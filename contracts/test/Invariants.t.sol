// SPDX-License-Identifier: MIT
pragma solidity 0.8.34;

import {Test} from "forge-std/Test.sol";
import {Base} from "./Base.t.sol";
import {StakesOracle} from "../contracts/StakesOracle.sol";
import {StakesRounds} from "../contracts/StakesRounds.sol";

/// @dev Drives random sequences of entries, price posts, voids, time jumps, claims and fee withdrawals.
contract Handler is Test {
    StakesRounds internal immutable rounds;
    StakesOracle internal immutable oracle;
    address internal immutable keeper;
    address internal immutable guardian;
    address internal immutable owner;

    bytes32[2] internal markets = [bytes32("nvda"), bytes32("tsla")];
    address[4] internal actors = [address(0xA1), address(0xA2), address(0xA3), address(0xA4)];

    struct Ticket {
        uint64 round;
        bytes32 market;
        address player;
    }

    Ticket[] public tickets;
    uint256 public deposits;
    uint256 public paid;
    uint256 public withdrawn;
    uint256 public claimsOk;
    mapping(bytes32 pool => uint256) public poolTotal;
    mapping(bytes32 pool => uint256) public poolOut; // payouts + fees taken from the pool
    bytes32[] public pools;
    uint256 internal price = 100e8;

    constructor(StakesRounds r, StakesOracle o, address keeper_, address guardian_, address owner_) {
        (rounds, oracle, keeper, guardian, owner) = (r, o, keeper_, guardian_, owner_);
    }

    function tickets_length() external view returns (uint256) {
        return tickets.length;
    }

    function poolCount() external view returns (uint256) {
        return pools.length;
    }

    function enter(uint256 who, uint256 mkt, uint16 p, uint256 stake) external {
        address player = actors[who % 4];
        bytes32 market = markets[mkt % 2];
        uint64 round = rounds.currentRound();
        stake = bound(stake, 0.001 ether, 10 ether);
        p = uint16(bound(p, 0, 10_000));
        vm.deal(player, stake);
        vm.prank(player);
        try rounds.enter{value: stake}(round, market, p) {
            deposits += stake;
            bytes32 id = keccak256(abi.encode(round, market));
            if (poolTotal[id] == 0) pools.push(id);
            poolTotal[id] += stake;
            tickets.push(Ticket(round, market, player));
        } catch {}
    }

    function warp(uint256 secs) external {
        vm.warp(block.timestamp + bound(secs, 5 minutes, 2 hours));
    }

    function post(uint256 mkt, uint256 seed) external {
        bytes32[] memory ms = new bytes32[](1);
        uint256[] memory ps = new uint256[](1);
        ms[0] = markets[mkt % 2];
        // like the real keeper: post this hour and back-fill any of the last few still missing.
        // Each hour gets its own random step (1 in 5 flat, so refunds happen too).
        uint64 nowHour = uint64(block.timestamp / 3600);
        for (uint64 h = nowHour - 5; h <= nowHour; ++h) {
            uint256 x = uint256(keccak256(abi.encode(seed, h)));
            uint256 step = x % 5 == 0 ? 0 : (x >> 8) % 3e8;
            price = (x >> 128) % 2 == 0 && step < price ? price - step : price + step;
            ps[0] = price;
            vm.prank(keeper);
            try oracle.post(h, ms, ps) {} catch {}
        }
    }

    function voidPrice(uint256 mkt) external {
        bytes32[] memory ms = new bytes32[](1);
        ms[0] = markets[mkt % 2];
        vm.prank(guardian);
        try oracle.voidPrices(uint64(block.timestamp / 3600), ms) {} catch {}
    }

    function claim(uint256 i) external {
        if (tickets.length == 0) return;
        Ticket memory t = tickets[i % tickets.length];
        uint256 feesBefore = rounds.feesAccrued();
        vm.prank(t.player);
        try rounds.claim(t.round, t.market) returns (uint256 got) {
            paid += got;
            claimsOk += 1;
            poolOut[keccak256(abi.encode(t.round, t.market))] += got + rounds.feesAccrued() - feesBefore;
        } catch {}
    }

    function withdrawFees() external {
        uint256 f = rounds.feesAccrued();
        vm.prank(owner);
        rounds.withdrawFees(payable(address(0xFEE)));
        withdrawn += f;
    }
}

contract InvariantsTest is Base {
    Handler internal handler;

    function setUp() public override {
        super.setUp();
        handler = new Handler(rounds, oracle, keeper, guardian, owner);
        targetContract(address(handler));
    }

    /// The handler can reach real (non-refund) payouts, so the invariants below are not vacuous.
    function test_HandlerReachesPayouts() public {
        handler.enter(0, 0, 7000, 1 ether);
        handler.enter(1, 0, 2000, 2 ether);
        handler.warp(2 hours);
        handler.post(0, 1);
        handler.warp(2 hours);
        handler.post(0, 1);
        (uint64 r,,) = handler.tickets(0);
        StakesRounds.Outcome o = rounds.outcomeOf(r, NVDA);
        assertTrue(o == StakesRounds.Outcome.Up || o == StakesRounds.Outcome.Down, "settles with a direction");
        handler.claim(0);
        handler.claim(1);
        assertEq(handler.claimsOk(), 2);
    }

    /// Every wei is accounted for: in = out + still held.
    function invariant_BalanceMatchesLedger() public view {
        assertEq(address(rounds).balance, handler.deposits() - handler.paid() - handler.withdrawn());
    }

    /// No pool ever pays out (payouts + fees) more than was staked into it.
    function invariant_NoPoolOverpays() public view {
        uint256 n = handler.poolCount();
        for (uint256 i; i < n; ++i) {
            bytes32 id = handler.pools(i);
            assertLe(handler.poolOut(id), handler.poolTotal(id));
        }
    }

    /// Fees the owner may withdraw are always backed by ETH actually held.
    function invariant_FeesBacked() public view {
        assertGe(address(rounds).balance, rounds.feesAccrued());
    }
}
