// SPDX-License-Identifier: MIT
pragma solidity 0.8.34;

import {Ownable, Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {IPriceOracle} from "./interfaces/IPriceOracle.sol";

/**
 * @title StakesRounds
 * @notice Hourly calibration rounds. During hour H players enter round H+1:
 *         "will this market finish higher at (H+2):00 than at (H+1):00?"
 *         Each player names a YES probability and stakes ETH.
 *
 * Payout: the pool is split in proportion to stake × Brier score, where
 * score = 1 − (p − outcome)². Better-calibrated calls take a larger share.
 * A protocol fee is taken from profit only — never from a player's own stake.
 *
 * Refunds (every stake returned in full): no price change, a void or missing
 * price, or nobody scoring above zero.
 *
 * Safety: Σ payouts ≤ pool for every round, by construction (floor division
 * over shares that sum to the pool). The owner can pause new entries, tune
 * limits and withdraw accrued fees — and nothing else. Stakes can only leave
 * the contract through `claim`, to the player who staked them.
 */
contract StakesRounds is Ownable2Step, ReentrancyGuard {
    uint256 public constant HOUR = 3600;
    uint256 public constant BPS = 10_000;
    uint256 private constant BPS2 = BPS * BPS;
    uint16 public constant MAX_FEE_BPS = 1_000; // 10% of profit, hard cap

    enum Outcome {
        Unsettled,
        Up,
        Down,
        Refund
    }

    struct Pool {
        uint128 total; // total wei staked
        uint32 entries;
        uint16 feeBps; // fee fixed when the pool opens, so later changes never touch it
        Outcome outcome; // persisted on first settlement and never changed
        uint256 sumP; // Σ stake·p      (p in bps)
        uint256 sumP2; // Σ stake·p²
    }

    struct Entry {
        uint128 stake;
        uint16 yesBps;
        bool claimed;
    }

    IPriceOracle public immutable oracle;

    uint16 public feeBps;
    /// @notice Entries for round r close this many seconds before r starts.
    uint32 public entryCutoff;
    uint128 public minStake;
    uint128 public maxStake;
    bool public paused;
    uint256 public feesAccrued;

    mapping(bytes32 market => bool) public listed;
    mapping(uint64 round => mapping(bytes32 market => Pool)) private _pools;
    mapping(uint64 round => mapping(bytes32 market => mapping(address player => Entry))) private _entries;

    event MarketListed(bytes32 indexed market, bool listed);
    event ParamsSet(uint16 feeBps, uint32 entryCutoff, uint128 minStake, uint128 maxStake);
    event Paused(bool paused);
    event Entered(uint64 indexed round, bytes32 indexed market, address indexed player, uint256 stake, uint16 yesBps);
    event Settled(uint64 indexed round, bytes32 indexed market, Outcome outcome, uint256 startPrice, uint256 endPrice);
    event Claimed(uint64 indexed round, bytes32 indexed market, address indexed player, uint256 payout, uint256 fee);
    event FeesWithdrawn(address indexed to, uint256 amount);

    error EntriesPaused();
    error MarketNotListed();
    error RoundNotOpen();
    error BadProbability();
    error BadStake();
    error AlreadyEntered();
    error NoEntry();
    error AlreadyClaimed();
    error NotSettled();
    error LengthMismatch();
    error InvalidParam();
    error TransferFailed();

    constructor(
        address owner_,
        IPriceOracle oracle_,
        uint16 feeBps_,
        uint32 entryCutoff_,
        uint128 minStake_,
        uint128 maxStake_
    ) Ownable(owner_) {
        if (address(oracle_) == address(0)) revert InvalidParam();
        oracle = oracle_;
        _setParams(feeBps_, entryCutoff_, minStake_, maxStake_);
    }

    // ------------------------------------------------------------------ time

    /// @notice The round currently taking entries (= next hour index).
    function currentRound() public view returns (uint64) {
        return uint64(block.timestamp / HOUR + 1);
    }

    /// @notice Last second at which round `round` accepts entries (exclusive).
    function entryDeadline(uint64 round) public view returns (uint256) {
        return uint256(round) * HOUR - entryCutoff;
    }

    // ------------------------------------------------------------------ play

    /**
     * @notice Enter `round` on `market` with a YES probability in basis points.
     * @dev `round` must equal `currentRound()`; passing it explicitly means a
     *      transaction that lands late fails instead of joining a different round.
     */
    function enter(uint64 round, bytes32 market, uint16 yesBps) external payable {
        if (paused) revert EntriesPaused();
        if (!listed[market]) revert MarketNotListed();
        if (round != currentRound() || block.timestamp >= entryDeadline(round)) revert RoundNotOpen();
        if (yesBps > BPS) revert BadProbability();
        if (msg.value < minStake || msg.value > maxStake) revert BadStake();

        Entry storage e = _entries[round][market][msg.sender];
        if (e.stake != 0) revert AlreadyEntered();
        e.stake = uint128(msg.value);
        e.yesBps = yesBps;

        Pool storage p = _pools[round][market];
        if (p.entries == 0) p.feeBps = feeBps;
        p.total += uint128(msg.value);
        p.entries += 1;
        p.sumP += msg.value * yesBps;
        p.sumP2 += msg.value * uint256(yesBps) * yesBps;

        emit Entered(round, market, msg.sender, msg.value, yesBps);
    }

    /// @notice Fix the outcome of a round once its prices are final. Anyone may call; claims do it automatically.
    function settle(uint64 round, bytes32 market) external returns (Outcome) {
        return _settle(round, market);
    }

    /// @notice Collect your payout (or refund) for one round and market.
    function claim(uint64 round, bytes32 market) external nonReentrant returns (uint256) {
        return _claim(round, market);
    }

    /// @notice Claim several (round, market) pairs in one transaction.
    function claimMany(uint64[] calldata rounds, bytes32[] calldata markets) external nonReentrant returns (uint256 total) {
        if (rounds.length != markets.length) revert LengthMismatch();
        for (uint256 i; i < rounds.length; ++i) total += _claim(rounds[i], markets[i]);
    }

    function _claim(uint64 round, bytes32 market) private returns (uint256 payout) {
        Entry storage e = _entries[round][market][msg.sender];
        if (e.stake == 0) revert NoEntry();
        if (e.claimed) revert AlreadyClaimed();
        Outcome outcome = _settle(round, market);
        if (outcome == Outcome.Unsettled) revert NotSettled();

        uint256 fee;
        (payout, fee) = _payout(_pools[round][market], outcome, e.stake, e.yesBps);
        e.claimed = true;
        feesAccrued += fee;
        emit Claimed(round, market, msg.sender, payout, fee);

        if (payout > 0) {
            (bool ok,) = payable(msg.sender).call{value: payout}("");
            if (!ok) revert TransferFailed();
        }
    }

    function _settle(uint64 round, bytes32 market) private returns (Outcome outcome) {
        Pool storage p = _pools[round][market];
        if (p.outcome != Outcome.Unsettled) return p.outcome;
        uint256 startPrice;
        uint256 endPrice;
        (outcome, startPrice, endPrice) = _resolve(round, market, p);
        if (outcome != Outcome.Unsettled) {
            p.outcome = outcome;
            emit Settled(round, market, outcome, startPrice, endPrice);
        }
    }

    /// @dev Outcome from the oracle, without persisting. Unsettled while either price is pending.
    function _resolve(uint64 round, bytes32 market, Pool storage p)
        private
        view
        returns (Outcome, uint256 startPrice, uint256 endPrice)
    {
        IPriceOracle.Status s0;
        IPriceOracle.Status s1;
        (s0, startPrice) = oracle.priceAt(market, round);
        (s1, endPrice) = oracle.priceAt(market, round + 1);
        if (s0 == IPriceOracle.Status.Void || s1 == IPriceOracle.Status.Void) return (Outcome.Refund, startPrice, endPrice);
        if (s0 == IPriceOracle.Status.Pending || s1 == IPriceOracle.Status.Pending) {
            return (Outcome.Unsettled, startPrice, endPrice);
        }
        if (endPrice == startPrice) return (Outcome.Refund, startPrice, endPrice);
        Outcome o = endPrice > startPrice ? Outcome.Up : Outcome.Down;
        // Everyone scored zero (all called the wrong side at 0%/100%): nobody earned the pool.
        if (_weight(p.total, p.sumP, p.sumP2, o == Outcome.Up) == 0) return (Outcome.Refund, startPrice, endPrice);
        return (o, startPrice, endPrice);
    }

    // ------------------------------------------------------------------ maths

    /// @dev Σ stake·score for the whole pool, in wei·bps². Up: Σ s·(1−(1−p)²); Down: Σ s·(1−p²).
    function _weight(uint256 total, uint256 sumP, uint256 sumP2, bool up) private pure returns (uint256) {
        return up ? 2 * BPS * sumP - sumP2 : BPS2 * total - sumP2;
    }

    function _payout(Pool storage p, Outcome outcome, uint256 stake, uint16 yesBps)
        private
        view
        returns (uint256 payout, uint256 fee)
    {
        if (outcome == Outcome.Refund) return (stake, 0);
        return _share(p.total, p.sumP, p.sumP2, p.feeBps, stake, yesBps, outcome == Outcome.Up);
    }

    /// @dev One player's share of the pool, after the fee on profit.
    function _share(
        uint256 total,
        uint256 sumP,
        uint256 sumP2,
        uint16 fee_,
        uint256 stake,
        uint256 yesBps,
        bool up
    ) private pure returns (uint256 payout, uint256 fee) {
        uint256 w = _weight(total, sumP, sumP2, up);
        if (w == 0) return (stake, 0); // matches the Refund rule in _resolve
        uint256 mine = up ? stake * (2 * BPS * yesBps - yesBps * yesBps) : stake * (BPS2 - yesBps * yesBps);
        uint256 gross = Math.mulDiv(total, mine, w);
        if (gross > stake) fee = ((gross - stake) * fee_) / BPS;
        payout = gross - fee;
    }

    // ------------------------------------------------------------------ views for the site

    function getPool(uint64 round, bytes32 market)
        external
        view
        returns (uint256 total, uint32 entries, uint16 crowdYesBps, uint16 poolFeeBps, Outcome outcome)
    {
        Pool storage p = _pools[round][market];
        crowdYesBps = p.total == 0 ? 0 : uint16(p.sumP / p.total);
        return (p.total, p.entries, crowdYesBps, p.entries == 0 ? feeBps : p.feeBps, p.outcome);
    }

    function getEntry(uint64 round, bytes32 market, address player)
        external
        view
        returns (uint256 stake, uint16 yesBps, bool claimed)
    {
        Entry storage e = _entries[round][market][player];
        return (e.stake, e.yesBps, e.claimed);
    }

    /// @notice Outcome as it stands now (Unsettled while prices are pending), without writing it.
    function outcomeOf(uint64 round, bytes32 market) public view returns (Outcome outcome) {
        Pool storage p = _pools[round][market];
        if (p.outcome != Outcome.Unsettled) return p.outcome;
        (outcome,,) = _resolve(round, market, p);
    }

    /// @notice What `player` would receive by claiming now. Zero while the round is unsettled or already claimed.
    function claimable(uint64 round, bytes32 market, address player) external view returns (Outcome outcome, uint256 payout) {
        Entry storage e = _entries[round][market][player];
        outcome = outcomeOf(round, market);
        if (e.stake == 0 || e.claimed || outcome == Outcome.Unsettled) return (outcome, 0);
        (payout,) = _payout(_pools[round][market], outcome, e.stake, e.yesBps);
    }

    /**
     * @notice Exact payout if the pool closed as it is now, for an existing
     *         entry (`stake` = 0) or a hypothetical new one added to the pool.
     * @return ifUp   payout if the market finishes higher (after fee)
     * @return ifDown payout if it finishes lower (after fee)
     */
    function quote(uint64 round, bytes32 market, address player, uint16 yesBps, uint256 stake)
        external
        view
        returns (uint256 ifUp, uint256 ifDown)
    {
        if (yesBps > BPS) revert BadProbability();
        Pool storage p = _pools[round][market];
        uint256 total = p.total;
        uint256 sumP = p.sumP;
        uint256 sumP2 = p.sumP2;
        uint16 fee_ = p.entries == 0 ? feeBps : p.feeBps;
        if (stake == 0) {
            Entry storage e = _entries[round][market][player];
            stake = e.stake;
            yesBps = e.yesBps;
            if (stake == 0) return (0, 0);
        } else {
            total += stake;
            sumP += stake * yesBps;
            sumP2 += stake * uint256(yesBps) * yesBps;
        }
        (ifUp,) = _share(total, sumP, sumP2, fee_, stake, yesBps, true);
        (ifDown,) = _share(total, sumP, sumP2, fee_, stake, yesBps, false);
    }

    // ------------------------------------------------------------------ owner

    function listMarkets(bytes32[] calldata markets, bool isListed) external onlyOwner {
        for (uint256 i; i < markets.length; ++i) {
            listed[markets[i]] = isListed;
            emit MarketListed(markets[i], isListed);
        }
    }

    function setParams(uint16 feeBps_, uint32 entryCutoff_, uint128 minStake_, uint128 maxStake_) external onlyOwner {
        _setParams(feeBps_, entryCutoff_, minStake_, maxStake_);
    }

    /// @notice Stop new entries. Claims and refunds always keep working.
    function setPaused(bool paused_) external onlyOwner {
        paused = paused_;
        emit Paused(paused_);
    }

    /// @notice Withdraw accrued protocol fees — the only funds the owner can ever move.
    function withdrawFees(address payable to) external onlyOwner nonReentrant {
        if (to == address(0)) revert InvalidParam();
        uint256 amount = feesAccrued;
        feesAccrued = 0;
        emit FeesWithdrawn(to, amount);
        (bool ok,) = to.call{value: amount}("");
        if (!ok) revert TransferFailed();
    }

    function _setParams(uint16 feeBps_, uint32 entryCutoff_, uint128 minStake_, uint128 maxStake_) private {
        if (feeBps_ > MAX_FEE_BPS || entryCutoff_ > 30 minutes || minStake_ == 0 || maxStake_ < minStake_) {
            revert InvalidParam();
        }
        feeBps = feeBps_;
        entryCutoff = entryCutoff_;
        minStake = minStake_;
        maxStake = maxStake_;
        emit ParamsSet(feeBps_, entryCutoff_, minStake_, maxStake_);
    }
}
