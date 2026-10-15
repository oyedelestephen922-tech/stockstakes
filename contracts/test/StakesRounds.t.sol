// SPDX-License-Identifier: MIT
pragma solidity 0.8.34;

import {Base} from "./Base.t.sol";
import {StakesRounds} from "../contracts/StakesRounds.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract StakesRoundsTest is Base {
    // ---------------------------------------------------------------- payouts

    function test_UpPaysByBrierScore() public {
        uint64 r = _enter(alice, NVDA, 8000, 1 ether);
        _enter(bob, NVDA, 2000, 1 ether);
        _settlePrices(NVDA, r, 100e8, 101e8);

        uint256[] memory s = new uint256[](2);
        uint16[] memory p = new uint16[](2);
        (s[0], s[1], p[0], p[1]) = (1 ether, 1 ether, 8000, 2000);

        uint256 a = _claim(alice, r, NVDA);
        uint256 b = _claim(bob, r, NVDA);
        assertEq(a, _expected(s, p, 0, true, 300));
        assertEq(b, _expected(s, p, 1, true, 300));
        assertGt(a, 1 ether, "better call profits");
        assertLt(b, 1 ether, "worse call loses part of stake");
        // alice: gross = 2 * 96/132 ether; fee is 3% of the profit only
        uint256 pool = 2 ether;
        uint256 gross = (pool * 96) / 132;
        assertEq(a, gross - ((gross - 1 ether) * 300) / 10_000);
        assertEq(rounds.feesAccrued(), ((gross - 1 ether) * 300) / 10_000);
    }

    function test_DownPaysByBrierScore() public {
        uint64 r = _enter(alice, NVDA, 8000, 1 ether);
        _enter(bob, NVDA, 2000, 3 ether);
        _settlePrices(NVDA, r, 100e8, 99e8);

        uint256[] memory s = new uint256[](2);
        uint16[] memory p = new uint16[](2);
        (s[0], s[1], p[0], p[1]) = (1 ether, 3 ether, 8000, 2000);

        uint256 a = _claim(alice, r, NVDA);
        assertEq(a, _expected(s, p, 0, false, 300));
        assertEq(_claim(bob, r, NVDA), _expected(s, p, 1, false, 300));
        assertLt(a, 1 ether, "leaning the wrong way loses part of the stake");
    }

    function test_FeeNeverTouchesOwnStake() public {
        // a lone player always gets exactly their stake back: no profit, no fee
        uint64 r = _enter(alice, NVDA, 9000, 2 ether);
        _settlePrices(NVDA, r, 100e8, 105e8);
        assertEq(_claim(alice, r, NVDA), 2 ether);
        assertEq(rounds.feesAccrued(), 0);
    }

    function test_IdenticalCallsAllGetStakeBack() public {
        uint64 r = _enter(alice, NVDA, 6000, 1 ether);
        _enter(bob, NVDA, 6000, 2 ether);
        _settlePrices(NVDA, r, 100e8, 99e8);
        assertEq(_claim(alice, r, NVDA), 1 ether);
        assertEq(_claim(bob, r, NVDA), 2 ether);
    }

    function test_QuoteMatchesActualPayout() public {
        uint64 r = _enter(alice, NVDA, 7000, 1 ether);
        // bob's quote before entering = his real payout if nobody else joins
        (uint256 qUp, uint256 qDown) = rounds.quote(r, NVDA, bob, 3000, 2 ether);
        _enter(bob, NVDA, 3000, 2 ether);
        (uint256 eUp, uint256 eDown) = rounds.quote(r, NVDA, bob, 0, 0);
        assertEq(qUp, eUp);
        assertEq(qDown, eDown);
        _settlePrices(NVDA, r, 100e8, 101e8);
        (, uint256 c) = rounds.claimable(r, NVDA, bob);
        assertEq(c, qUp);
        assertEq(_claim(bob, r, NVDA), qUp);
    }

    function test_FeeFixedWhenPoolOpens() public {
        uint64 r = _enter(alice, NVDA, 9000, 1 ether);
        _enter(bob, NVDA, 1000, 1 ether);
        vm.prank(owner);
        rounds.setParams(1000, 60, 0.001 ether, 10 ether); // raise fee to 10% mid-round
        _settlePrices(NVDA, r, 100e8, 101e8);
        uint256[] memory s = new uint256[](2);
        uint16[] memory p = new uint16[](2);
        (s[0], s[1], p[0], p[1]) = (1 ether, 1 ether, 9000, 1000);
        assertEq(_claim(alice, r, NVDA), _expected(s, p, 0, true, 300), "old 3% fee applies");
    }

    // ---------------------------------------------------------------- refunds

    function test_RefundWhenPriceUnchanged() public {
        uint64 r = _enter(alice, NVDA, 9000, 1 ether);
        _enter(bob, NVDA, 1000, 1 ether);
        _settlePrices(NVDA, r, 100e8, 100e8);
        assertEq(uint8(rounds.outcomeOf(r, NVDA)), uint8(StakesRounds.Outcome.Refund));
        assertEq(_claim(alice, r, NVDA), 1 ether);
        assertEq(_claim(bob, r, NVDA), 1 ether);
    }

    function test_RefundWhenPriceVoided() public {
        uint64 r = _enter(alice, NVDA, 9000, 1 ether);
        _enter(bob, NVDA, 1000, 1 ether);
        vm.warp(uint256(r) * HOUR + 60);
        _post(NVDA, r, 100e8);
        vm.warp(uint256(r + 1) * HOUR + 60);
        _post(NVDA, r + 1, 150e8); // suspicious jump
        bytes32[] memory ms = new bytes32[](1);
        ms[0] = NVDA;
        vm.prank(guardian);
        oracle.voidPrices(r + 1, ms);
        assertEq(_claim(alice, r, NVDA), 1 ether);
        assertEq(_claim(bob, r, NVDA), 1 ether);
    }

    function test_RefundWhenPriceNeverPosted() public {
        uint64 r = _enter(alice, NVDA, 9000, 1 ether);
        vm.warp(uint256(r) * HOUR + 60);
        _post(NVDA, r, 100e8);
        // keeper misses the end price; still pending inside the deadline
        vm.warp(uint256(r + 1) * HOUR + 6 hours);
        vm.prank(alice);
        vm.expectRevert(StakesRounds.NotSettled.selector);
        rounds.claim(r, NVDA);
        vm.warp(uint256(r + 1) * HOUR + 6 hours + 1);
        assertEq(_claim(alice, r, NVDA), 1 ether);
    }

    function test_RefundWhenNobodyScores() public {
        // everyone was certain of DOWN; it went UP — zero total weight
        uint64 r = _enter(alice, NVDA, 0, 1 ether);
        _enter(bob, NVDA, 0, 2 ether);
        _settlePrices(NVDA, r, 100e8, 101e8);
        assertEq(uint8(rounds.outcomeOf(r, NVDA)), uint8(StakesRounds.Outcome.Refund));
        assertEq(_claim(alice, r, NVDA), 1 ether);
        assertEq(_claim(bob, r, NVDA), 2 ether);
    }

    function test_CertainWrongCallLosesEverything() public {
        uint64 r = _enter(alice, NVDA, 0, 1 ether);
        _enter(bob, NVDA, 10_000, 1 ether);
        _settlePrices(NVDA, r, 100e8, 101e8);
        assertEq(_claim(alice, r, NVDA), 0);
        uint256 b = _claim(bob, r, NVDA);
        assertEq(b, 2 ether - (1 ether * 300) / 10_000);
    }

    // ---------------------------------------------------------------- settlement timing

    function test_ClaimWaitsForChallengeWindow() public {
        uint64 r = _enter(alice, NVDA, 6000, 1 ether);
        vm.warp(uint256(r) * HOUR + 60);
        _post(NVDA, r, 100e8);
        vm.warp(uint256(r + 1) * HOUR + 60);
        _post(NVDA, r + 1, 101e8);
        vm.warp(uint256(r + 1) * HOUR + 60 + 1 hours - 1);
        vm.prank(alice);
        vm.expectRevert(StakesRounds.NotSettled.selector);
        rounds.claim(r, NVDA);
        vm.warp(uint256(r + 1) * HOUR + 60 + 1 hours);
        assertEq(_claim(alice, r, NVDA), 1 ether);
    }

    function test_OutcomeIsPersistedOnFirstSettle() public {
        uint64 r = _enter(alice, NVDA, 8000, 1 ether);
        _enter(bob, NVDA, 2000, 1 ether);
        _settlePrices(NVDA, r, 100e8, 101e8);
        assertEq(uint8(rounds.settle(r, NVDA)), uint8(StakesRounds.Outcome.Up));
        (,,,, StakesRounds.Outcome o) = rounds.getPool(r, NVDA);
        assertEq(uint8(o), uint8(StakesRounds.Outcome.Up));
        // a final price can no longer be voided
        bytes32[] memory ms = new bytes32[](1);
        ms[0] = NVDA;
        vm.prank(guardian);
        vm.expectRevert();
        oracle.voidPrices(r + 1, ms);
    }

    function test_MarketsSettleIndependently() public {
        uint64 r = _enter(alice, NVDA, 8000, 1 ether);
        _enter(alice, TSLA, 8000, 1 ether);
        _settlePrices(NVDA, r, 100e8, 101e8);
        assertEq(_claim(alice, r, NVDA), 1 ether);
        vm.prank(alice);
        vm.expectRevert(StakesRounds.NotSettled.selector); // TSLA prices not posted yet, still inside the deadline
        rounds.claim(r, TSLA);
    }

    // ---------------------------------------------------------------- entry rules

    function test_EntryRules() public {
        uint64 r = rounds.currentRound();
        assertEq(r, T0 / HOUR + 1);

        vm.startPrank(alice);
        vm.expectRevert(StakesRounds.RoundNotOpen.selector);
        rounds.enter{value: 1 ether}(r - 1, NVDA, 5000);
        vm.expectRevert(StakesRounds.RoundNotOpen.selector);
        rounds.enter{value: 1 ether}(r + 1, NVDA, 5000);
        vm.expectRevert(StakesRounds.BadProbability.selector);
        rounds.enter{value: 1 ether}(r, NVDA, 10_001);
        vm.expectRevert(StakesRounds.BadStake.selector);
        rounds.enter{value: 0.0009 ether}(r, NVDA, 5000);
        vm.expectRevert(StakesRounds.BadStake.selector);
        rounds.enter{value: 10.1 ether}(r, NVDA, 5000);
        vm.expectRevert(StakesRounds.MarketNotListed.selector);
        rounds.enter{value: 1 ether}(r, bytes32("aapl"), 5000);

        rounds.enter{value: 1 ether}(r, NVDA, 5000);
        vm.expectRevert(StakesRounds.AlreadyEntered.selector);
        rounds.enter{value: 1 ether}(r, NVDA, 7000);
        vm.stopPrank();
    }

    function test_EntriesCloseBeforeRoundStarts() public {
        uint64 r = rounds.currentRound();
        vm.warp(uint256(r) * HOUR - 61);
        _enter(alice, NVDA, 5000, 1 ether);
        vm.warp(uint256(r) * HOUR - 60);
        vm.prank(bob);
        vm.expectRevert(StakesRounds.RoundNotOpen.selector);
        rounds.enter{value: 1 ether}(r, NVDA, 5000);
    }

    function test_PauseBlocksEntriesButNotClaims() public {
        uint64 r = _enter(alice, NVDA, 8000, 1 ether);
        vm.prank(owner);
        rounds.setPaused(true);
        vm.prank(bob);
        vm.expectRevert(StakesRounds.EntriesPaused.selector);
        rounds.enter{value: 1 ether}(r, NVDA, 5000);
        _settlePrices(NVDA, r, 100e8, 101e8);
        assertEq(_claim(alice, r, NVDA), 1 ether);
    }

    function test_DelistBlocksEntriesButNotClaims() public {
        uint64 r = _enter(alice, NVDA, 8000, 1 ether);
        bytes32[] memory ms = new bytes32[](1);
        ms[0] = NVDA;
        vm.prank(owner);
        rounds.listMarkets(ms, false);
        _settlePrices(NVDA, r, 100e8, 101e8);
        assertEq(_claim(alice, r, NVDA), 1 ether);
    }

    // ---------------------------------------------------------------- claims

    function test_CannotClaimTwiceOrWithoutEntry() public {
        uint64 r = _enter(alice, NVDA, 8000, 1 ether);
        _settlePrices(NVDA, r, 100e8, 101e8);
        _claim(alice, r, NVDA);
        vm.prank(alice);
        vm.expectRevert(StakesRounds.AlreadyClaimed.selector);
        rounds.claim(r, NVDA);
        vm.prank(bob);
        vm.expectRevert(StakesRounds.NoEntry.selector);
        rounds.claim(r, NVDA);
    }

    function test_ClaimMany() public {
        uint64 r = _enter(alice, NVDA, 8000, 1 ether);
        _enter(alice, TSLA, 8000, 2 ether);
        vm.warp(uint256(r) * HOUR + 60);
        _post(NVDA, r, 100e8);
        _post(TSLA, r, 200e8);
        vm.warp(uint256(r + 1) * HOUR + 60);
        _post(NVDA, r + 1, 101e8);
        _post(TSLA, r + 1, 200e8);
        vm.warp(block.timestamp + 1 hours);
        uint64[] memory rs = new uint64[](2);
        bytes32[] memory ms = new bytes32[](2);
        (rs[0], rs[1], ms[0], ms[1]) = (r, r, NVDA, TSLA);
        uint256 before = alice.balance;
        vm.prank(alice);
        assertEq(rounds.claimMany(rs, ms), 3 ether);
        assertEq(alice.balance - before, 3 ether);
    }

    function test_ReentrantClaimCannotDoublePay() public {
        Reenterer evil = new Reenterer(rounds);
        vm.deal(address(evil), 1 ether);
        uint64 r = rounds.currentRound();
        evil.enter{value: 1 ether}(r, NVDA, 9000);
        _enter(bob, NVDA, 1000, 1 ether);
        _settlePrices(NVDA, r, 100e8, 101e8);
        // the re-entrant call reverts inside receive(), so the whole claim reverts
        vm.expectRevert(StakesRounds.TransferFailed.selector);
        evil.attack(r, NVDA);
        assertEq(address(rounds).balance, 2 ether);
        // bob can still claim normally
        _claim(bob, r, NVDA);
    }

    // ---------------------------------------------------------------- owner powers

    function test_OwnerCanOnlyWithdrawFees() public {
        uint64 r = _enter(alice, NVDA, 9000, 1 ether);
        _enter(bob, NVDA, 1000, 1 ether);
        _settlePrices(NVDA, r, 100e8, 101e8);
        _claim(alice, r, NVDA);
        uint256 fees = rounds.feesAccrued();
        assertGt(fees, 0);

        address treasury = makeAddr("treasury");
        vm.prank(owner);
        rounds.withdrawFees(payable(treasury));
        assertEq(treasury.balance, fees);
        assertEq(rounds.feesAccrued(), 0);

        // bob's (smaller) payout is still fully covered
        (, uint256 owed) = rounds.claimable(r, NVDA, bob);
        assertGe(address(rounds).balance, owed);
        _claim(bob, r, NVDA);
    }

    function test_OnlyOwnerAdmin() public {
        vm.startPrank(alice);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, alice));
        rounds.withdrawFees(payable(alice));
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, alice));
        rounds.setPaused(true);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, alice));
        rounds.setParams(0, 0, 1, 1);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, alice));
        rounds.listMarkets(new bytes32[](0), true);
        vm.stopPrank();
    }

    function test_ParamBounds() public {
        vm.startPrank(owner);
        vm.expectRevert(StakesRounds.InvalidParam.selector);
        rounds.setParams(1001, 60, 1, 2); // fee above 10% cap
        vm.expectRevert(StakesRounds.InvalidParam.selector);
        rounds.setParams(300, 31 minutes, 1, 2);
        vm.expectRevert(StakesRounds.InvalidParam.selector);
        rounds.setParams(300, 60, 0, 2);
        vm.expectRevert(StakesRounds.InvalidParam.selector);
        rounds.setParams(300, 60, 3, 2);
        vm.stopPrank();
    }

    // ---------------------------------------------------------------- fuzz

    /// @dev Any mix of players, calls and outcomes: payouts + fees never exceed the pool.
    function testFuzz_Solvency(uint256 seed, uint8 n, bool up) public {
        n = uint8(bound(n, 1, 12));
        uint64 r = rounds.currentRound();
        uint256[] memory s = new uint256[](n);
        uint16[] memory p = new uint16[](n);
        address[] memory who = new address[](n);
        uint256 total;
        for (uint256 i; i < n; ++i) {
            uint256 x = uint256(keccak256(abi.encode(seed, i)));
            who[i] = address(uint160(0x10000 + i));
            s[i] = bound(x, 0.001 ether, 10 ether);
            p[i] = uint16(bound(x >> 128, 0, 10_000));
            total += s[i];
            vm.deal(who[i], s[i]);
            vm.prank(who[i]);
            rounds.enter{value: s[i]}(r, NVDA, p[i]);
        }
        _settlePrices(NVDA, r, 100e8, up ? 101e8 : 99e8);

        uint256 paid;
        bool refund = rounds.outcomeOf(r, NVDA) == StakesRounds.Outcome.Refund;
        for (uint256 i; i < n; ++i) {
            uint256 got = _claim(who[i], r, NVDA);
            assertEq(got, refund ? s[i] : _expected(s, p, i, up, 300), "matches reference formula");
            paid += got;
        }
        uint256 fees = rounds.feesAccrued();
        assertLe(paid + fees, total, "never pays out more than the pool");
        assertLe(total - paid - fees, n, "rounding dust is at most 1 wei per player");
        assertEq(address(rounds).balance, total - paid);
    }

}

/// @dev Tries to claim again from inside the payout transfer.
contract Reenterer {
    StakesRounds private immutable rounds;
    uint64 private round;
    bytes32 private market;

    constructor(StakesRounds rounds_) {
        rounds = rounds_;
    }

    function enter(uint64 r, bytes32 m, uint16 p) external payable {
        rounds.enter{value: msg.value}(r, m, p);
    }

    function attack(uint64 r, bytes32 m) external {
        (round, market) = (r, m);
        rounds.claim(r, m);
    }

    receive() external payable {
        rounds.claim(round, market);
    }
}
