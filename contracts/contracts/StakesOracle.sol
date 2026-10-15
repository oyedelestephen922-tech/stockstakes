// SPDX-License-Identifier: MIT
pragma solidity 0.8.34;

import {Ownable, Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {IPriceOracle} from "./interfaces/IPriceOracle.sol";
import {AggregatorV3Interface} from "./interfaces/AggregatorV3Interface.sol";

/**
 * @title StakesOracle
 * @notice Hourly prices for every StockStakes market, posted by a keeper.
 *
 * Trust model (read this before relying on it):
 *  - The keeper posts the price of each market at the top of each hour. Players
 *    trust the keeper not to lie about small moves.
 *  - Where a Chainlink feed exists, a posted price that strays more than
 *    `maxDeviationBps` from the feed is rejected (that market then refunds).
 *  - Every price waits `CHALLENGE_WINDOW` before it is final. Until then the
 *    guardian can void it, which refunds every round that uses it.
 *  - A price not posted within `POST_DEADLINE` of its hour is void forever.
 *  - A price never changes once posted, and a final price can never be voided,
 *    so a round's outcome cannot flip after anyone has claimed.
 *  - Neither the keeper, the guardian nor the owner can move player funds.
 */
contract StakesOracle is IPriceOracle, Ownable2Step {
    uint8 public constant PRICE_DECIMALS = 8;
    uint256 private constant HOUR = 3600;
    uint256 private constant BPS = 10_000;

    /// @notice Time a posted price waits before it is final. Immutable so a final price stays final.
    uint64 public immutable CHALLENGE_WINDOW;
    /// @notice Time after the hour within which its price must be posted. Immutable so a void hour stays void.
    uint64 public immutable POST_DEADLINE;

    enum SkipReason {
        AlreadySet,
        BadPrice,
        FeedDeviation
    }

    struct Posted {
        uint128 price;
        /// When the price becomes final (post time + challenge window). 0 = never posted.
        uint64 finalAt;
        bool voided;
    }

    struct Feed {
        AggregatorV3Interface aggregator;
        uint8 decimals;
    }

    address public keeper;
    address public guardian;
    /// @notice Max distance from the Chainlink feed, in basis points, for a post to be accepted.
    uint16 public maxDeviationBps;
    /// @notice A feed older than this is ignored (the post is accepted unchecked).
    uint32 public maxFeedAge;

    mapping(bytes32 market => mapping(uint64 hour => Posted)) private _prices;
    mapping(bytes32 market => Feed) public feeds;

    event KeeperSet(address indexed keeper);
    event GuardianSet(address indexed guardian);
    event FeedSet(bytes32 indexed market, address aggregator);
    event FeedCheckSet(uint16 maxDeviationBps, uint32 maxFeedAge);
    event PricePosted(bytes32 indexed market, uint64 indexed hour, uint256 price, uint64 finalAt);
    event PriceSkipped(bytes32 indexed market, uint64 indexed hour, SkipReason reason);
    event PriceVoided(bytes32 indexed market, uint64 indexed hour);

    error NotKeeper();
    error NotGuardian();
    error LengthMismatch();
    error HourInFuture();
    error PostTooLate();
    error AlreadyFinal();
    error InvalidParam();

    constructor(
        address owner_,
        address keeper_,
        address guardian_,
        uint64 challengeWindow,
        uint64 postDeadline,
        uint16 maxDeviationBps_,
        uint32 maxFeedAge_
    ) Ownable(owner_) {
        if (challengeWindow > 1 days || postDeadline < 1 hours || postDeadline > 2 days) revert InvalidParam();
        CHALLENGE_WINDOW = challengeWindow;
        POST_DEADLINE = postDeadline;
        _setKeeper(keeper_);
        _setGuardian(guardian_);
        _setFeedCheck(maxDeviationBps_, maxFeedAge_);
    }

    // ------------------------------------------------------------------ reads

    /// @inheritdoc IPriceOracle
    function priceAt(bytes32 market, uint64 hour) external view returns (Status, uint256) {
        Posted memory p = _prices[market][hour];
        if (p.voided) return (Status.Void, 0);
        if (p.finalAt == 0) {
            return (block.timestamp > uint256(hour) * HOUR + POST_DEADLINE ? Status.Void : Status.Pending, 0);
        }
        if (block.timestamp < p.finalAt) return (Status.Pending, 0);
        return (Status.Final, p.price);
    }

    /// @notice Raw posted record, including prices still inside the challenge window.
    function posted(bytes32 market, uint64 hour) external view returns (uint256 price, uint64 finalAt, bool voided) {
        Posted memory p = _prices[market][hour];
        return (p.price, p.finalAt, p.voided);
    }

    // ------------------------------------------------------------------ keeper

    /**
     * @notice Post the price of each market at timestamp `hour * 3600`.
     * @dev Bad or duplicate entries are skipped (with an event), not reverted,
     *      so one bad quote can't block the rest of the batch.
     */
    function post(uint64 hour, bytes32[] calldata markets, uint256[] calldata prices) external {
        if (msg.sender != keeper) revert NotKeeper();
        if (markets.length != prices.length) revert LengthMismatch();
        uint256 hourTs = uint256(hour) * HOUR;
        if (hourTs > block.timestamp) revert HourInFuture();
        if (block.timestamp > hourTs + POST_DEADLINE) revert PostTooLate();

        uint64 finalAt = uint64(block.timestamp) + CHALLENGE_WINDOW;
        for (uint256 i; i < markets.length; ++i) {
            bytes32 market = markets[i];
            uint256 price = prices[i];
            Posted storage slot = _prices[market][hour];
            if (slot.finalAt != 0 || slot.voided) {
                emit PriceSkipped(market, hour, SkipReason.AlreadySet);
            } else if (price == 0 || price > type(uint128).max) {
                emit PriceSkipped(market, hour, SkipReason.BadPrice);
            } else if (!_withinFeed(market, price)) {
                emit PriceSkipped(market, hour, SkipReason.FeedDeviation);
            } else {
                slot.price = uint128(price);
                slot.finalAt = finalAt;
                emit PricePosted(market, hour, price, finalAt);
            }
        }
    }

    /// @dev True if there is no usable feed, or the price is within `maxDeviationBps` of it.
    function _withinFeed(bytes32 market, uint256 price) private view returns (bool) {
        Feed memory f = feeds[market];
        if (address(f.aggregator) == address(0)) return true;
        try f.aggregator.latestRoundData() returns (uint80, int256 answer, uint256, uint256 updatedAt, uint80) {
            if (answer <= 0 || updatedAt > block.timestamp || block.timestamp - updatedAt > maxFeedAge) return true;
            uint256 ref = uint256(answer);
            if (f.decimals > PRICE_DECIMALS) ref /= 10 ** (f.decimals - PRICE_DECIMALS);
            else if (f.decimals < PRICE_DECIMALS) ref *= 10 ** (PRICE_DECIMALS - f.decimals);
            if (ref == 0) return true;
            uint256 diff = price > ref ? price - ref : ref - price;
            return diff * BPS <= ref * maxDeviationBps;
        } catch {
            return true; // a broken feed must not stop prices; the challenge window still applies
        }
    }

    // ------------------------------------------------------------------ guardian

    /**
     * @notice Void prices before they become final. Every round that uses a
     *         voided price refunds all stakes. Also usable on hours not yet
     *         posted, to block a price known to be bad.
     */
    function voidPrices(uint64 hour, bytes32[] calldata markets) external {
        if (msg.sender != guardian) revert NotGuardian();
        for (uint256 i; i < markets.length; ++i) {
            Posted storage slot = _prices[markets[i]][hour];
            if (slot.voided) continue;
            if (slot.finalAt != 0 && block.timestamp >= slot.finalAt) revert AlreadyFinal();
            slot.voided = true;
            emit PriceVoided(markets[i], hour);
        }
    }

    // ------------------------------------------------------------------ owner

    function setKeeper(address keeper_) external onlyOwner {
        _setKeeper(keeper_);
    }

    function setGuardian(address guardian_) external onlyOwner {
        _setGuardian(guardian_);
    }

    /// @notice Attach (or with address(0), remove) the Chainlink feed used to sanity-check a market.
    function setFeeds(bytes32[] calldata markets, address[] calldata aggregators) external onlyOwner {
        if (markets.length != aggregators.length) revert LengthMismatch();
        for (uint256 i; i < markets.length; ++i) {
            address a = aggregators[i];
            feeds[markets[i]] = Feed(AggregatorV3Interface(a), a == address(0) ? 0 : AggregatorV3Interface(a).decimals());
            emit FeedSet(markets[i], a);
        }
    }

    function setFeedCheck(uint16 maxDeviationBps_, uint32 maxFeedAge_) external onlyOwner {
        _setFeedCheck(maxDeviationBps_, maxFeedAge_);
    }

    function _setKeeper(address keeper_) private {
        if (keeper_ == address(0)) revert InvalidParam();
        keeper = keeper_;
        emit KeeperSet(keeper_);
    }

    function _setGuardian(address guardian_) private {
        if (guardian_ == address(0)) revert InvalidParam();
        guardian = guardian_;
        emit GuardianSet(guardian_);
    }

    function _setFeedCheck(uint16 maxDeviationBps_, uint32 maxFeedAge_) private {
        if (maxDeviationBps_ < 10 || maxDeviationBps_ > 2_000 || maxFeedAge_ > 7 days) revert InvalidParam();
        maxDeviationBps = maxDeviationBps_;
        maxFeedAge = maxFeedAge_;
        emit FeedCheckSet(maxDeviationBps_, maxFeedAge_);
    }
}
