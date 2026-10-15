// SPDX-License-Identifier: MIT
pragma solidity 0.8.34;

import {Base} from "./Base.t.sol";
import {StakesOracle} from "../contracts/StakesOracle.sol";
import {IPriceOracle} from "../contracts/interfaces/IPriceOracle.sol";
import {MockAggregator} from "../contracts/mocks/MockAggregator.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract StakesOracleTest is Base {
    uint64 internal h;
    MockAggregator internal feed;

    function setUp() public override {
        super.setUp();
        h = uint64(T0 / HOUR);
        feed = new MockAggregator(8, 100e8);
        bytes32[] memory ms = new bytes32[](1);
        address[] memory fs = new address[](1);
        (ms[0], fs[0]) = (NVDA, address(feed));
        vm.prank(owner);
        oracle.setFeeds(ms, fs);
    }

    function _status(bytes32 m, uint64 hour) internal view returns (IPriceOracle.Status s, uint256 p) {
        return oracle.priceAt(m, hour);
    }

    function test_PostThenFinalAfterChallengeWindow() public {
        vm.warp(T0 + 30);
        _post(NVDA, h, 101e8);
        (IPriceOracle.Status s,) = _status(NVDA, h);
        assertEq(uint8(s), uint8(IPriceOracle.Status.Pending));
        vm.warp(T0 + 30 + 1 hours);
        uint256 p;
        (s, p) = _status(NVDA, h);
        assertEq(uint8(s), uint8(IPriceOracle.Status.Final));
        assertEq(p, 101e8);
    }

    function test_OnlyKeeperPosts() public {
        bytes32[] memory ms = new bytes32[](1);
        uint256[] memory ps = new uint256[](1);
        (ms[0], ps[0]) = (NVDA, 100e8);
        vm.prank(alice);
        vm.expectRevert(StakesOracle.NotKeeper.selector);
        oracle.post(h, ms, ps);
    }

    function test_CannotPostFutureOrLate() public {
        vm.prank(keeper);
        vm.expectRevert(StakesOracle.HourInFuture.selector);
        oracle.post(h + 1, new bytes32[](0), new uint256[](0));

        vm.warp(T0 + 6 hours + 1);
        vm.prank(keeper);
        vm.expectRevert(StakesOracle.PostTooLate.selector);
        oracle.post(h, new bytes32[](0), new uint256[](0));
    }

    function test_PriceCannotBeOverwritten() public {
        _post(NVDA, h, 100e8);
        vm.expectEmit(true, true, false, true);
        emit StakesOracle.PriceSkipped(NVDA, h, StakesOracle.SkipReason.AlreadySet);
        _post(NVDA, h, 120e8);
        (uint256 p,,) = oracle.posted(NVDA, h);
        assertEq(p, 100e8);
    }

    function test_BadPriceSkipped() public {
        vm.expectEmit(true, true, false, true);
        emit StakesOracle.PriceSkipped(TSLA, h, StakesOracle.SkipReason.BadPrice);
        _post(TSLA, h, 0);
        (, uint64 finalAt,) = oracle.posted(TSLA, h);
        assertEq(finalAt, 0);
    }

    function test_FeedDeviationRejected() public {
        // feed says 100; 3% tolerance → 103 ok, 103.01 rejected
        _post(NVDA, h, 103e8);
        (, uint64 finalAt,) = oracle.posted(NVDA, h);
        assertGt(finalAt, 0);

        vm.warp(T0 + HOUR);
        feed.set(100e8);
        vm.expectEmit(true, true, false, true);
        emit StakesOracle.PriceSkipped(NVDA, h + 1, StakesOracle.SkipReason.FeedDeviation);
        _post(NVDA, h + 1, 103.01e8);
        (, finalAt,) = oracle.posted(NVDA, h + 1);
        assertEq(finalAt, 0);
        vm.expectEmit(true, true, false, true);
        emit StakesOracle.PriceSkipped(NVDA, h + 1, StakesOracle.SkipReason.FeedDeviation);
        _post(NVDA, h + 1, 96.99e8);
    }

    function test_StaleOrBrokenFeedIsNotChecked() public {
        feed.setUpdatedAt(T0 - 27 hours);
        vm.warp(T0 + 10);
        _post(NVDA, h, 150e8); // far off, but the feed is stale
        (uint256 p,,) = oracle.posted(NVDA, h);
        assertEq(p, 150e8);

        vm.warp(T0 + HOUR + 10);
        feed.set(100e8);
        feed.setBroken(true);
        _post(NVDA, h + 1, 150e8);
        (p,,) = oracle.posted(NVDA, h + 1);
        assertEq(p, 150e8);
    }

    function test_FeedDecimalsNormalised() public {
        MockAggregator f18 = new MockAggregator(18, 100e18);
        bytes32[] memory ms = new bytes32[](1);
        address[] memory fs = new address[](1);
        (ms[0], fs[0]) = (TSLA, address(f18));
        vm.prank(owner);
        oracle.setFeeds(ms, fs);
        _post(TSLA, h, 102e8);
        (uint256 p,,) = oracle.posted(TSLA, h);
        assertEq(p, 102e8);
        vm.warp(T0 + HOUR);
        f18.set(100e18);
        _post(TSLA, h + 1, 110e8);
        (p,,) = oracle.posted(TSLA, h + 1);
        assertEq(p, 0, "10% off an 18-decimal feed is rejected");
    }

    function test_UnpostedHourBecomesVoidAfterDeadline() public {
        (IPriceOracle.Status s,) = _status(TSLA, h);
        assertEq(uint8(s), uint8(IPriceOracle.Status.Pending));
        vm.warp(T0 + 6 hours + 1);
        (s,) = _status(TSLA, h);
        assertEq(uint8(s), uint8(IPriceOracle.Status.Void));
    }

    function test_GuardianVoidsWithinWindowOnly() public {
        _post(NVDA, h, 100e8);
        _post(TSLA, h, 200e8);
        bytes32[] memory ms = new bytes32[](1);
        ms[0] = NVDA;

        vm.prank(alice);
        vm.expectRevert(StakesOracle.NotGuardian.selector);
        oracle.voidPrices(h, ms);

        vm.prank(guardian);
        oracle.voidPrices(h, ms);
        (IPriceOracle.Status s,) = _status(NVDA, h);
        assertEq(uint8(s), uint8(IPriceOracle.Status.Void));

        vm.warp(T0 + 1 hours);
        ms[0] = TSLA;
        vm.prank(guardian);
        vm.expectRevert(StakesOracle.AlreadyFinal.selector);
        oracle.voidPrices(h, ms);
    }

    function test_GuardianCanPreVoidUnpostedHour() public {
        bytes32[] memory ms = new bytes32[](1);
        ms[0] = TSLA;
        vm.prank(guardian);
        oracle.voidPrices(h, ms);
        vm.expectEmit(true, true, false, true);
        emit StakesOracle.PriceSkipped(TSLA, h, StakesOracle.SkipReason.AlreadySet);
        _post(TSLA, h, 200e8);
    }

    function test_AdminOnlyAndBounds() public {
        vm.startPrank(alice);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, alice));
        oracle.setKeeper(alice);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, alice));
        oracle.setGuardian(alice);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, alice));
        oracle.setFeedCheck(300, 1 days);
        vm.stopPrank();

        vm.startPrank(owner);
        vm.expectRevert(StakesOracle.InvalidParam.selector);
        oracle.setKeeper(address(0));
        vm.expectRevert(StakesOracle.InvalidParam.selector);
        oracle.setFeedCheck(2001, 1 days);
        oracle.setKeeper(bob);
        vm.stopPrank();
        assertEq(oracle.keeper(), bob);

        vm.expectRevert(StakesOracle.InvalidParam.selector);
        new StakesOracle(owner, keeper, guardian, 2 days, 6 hours, 300, 1 days); // window too long
        vm.expectRevert(StakesOracle.InvalidParam.selector);
        new StakesOracle(owner, keeper, guardian, 1 hours, 3 days, 300, 1 days); // deadline too long
    }
}
