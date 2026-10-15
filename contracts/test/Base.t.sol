// SPDX-License-Identifier: MIT
pragma solidity 0.8.34;

import {Test} from "forge-std/Test.sol";
import {StakesOracle} from "../contracts/StakesOracle.sol";
import {StakesRounds} from "../contracts/StakesRounds.sol";

/// @dev Shared deployment and helpers. Time starts exactly on an hour boundary.
abstract contract Base is Test {
    uint256 internal constant HOUR = 3600;
    uint256 internal constant T0 = 500_000 * HOUR; // 2027-01-15 08:00 UTC
    bytes32 internal constant NVDA = bytes32("nvda");
    bytes32 internal constant TSLA = bytes32("tsla");

    address internal owner = makeAddr("owner");
    address internal keeper = makeAddr("keeper");
    address internal guardian = makeAddr("guardian");
    address internal alice = makeAddr("alice");
    address internal bob = makeAddr("bob");
    address internal carol = makeAddr("carol");

    StakesOracle internal oracle;
    StakesRounds internal rounds;

    function setUp() public virtual {
        vm.warp(T0);
        oracle = new StakesOracle(owner, keeper, guardian, 1 hours, 6 hours, 300, 26 hours);
        rounds = new StakesRounds(owner, oracle, 300, 60, 0.001 ether, 10 ether);
        bytes32[] memory ms = new bytes32[](2);
        ms[0] = NVDA;
        ms[1] = TSLA;
        vm.prank(owner);
        rounds.listMarkets(ms, true);
        vm.deal(alice, 100 ether);
        vm.deal(bob, 100 ether);
        vm.deal(carol, 100 ether);
    }

    function _enter(address player, bytes32 market, uint16 yesBps, uint256 stake) internal returns (uint64 round) {
        round = rounds.currentRound();
        vm.prank(player);
        rounds.enter{value: stake}(round, market, yesBps);
    }

    function _post(bytes32 market, uint64 hour, uint256 price) internal {
        bytes32[] memory ms = new bytes32[](1);
        uint256[] memory ps = new uint256[](1);
        ms[0] = market;
        ps[0] = price;
        vm.prank(keeper);
        oracle.post(hour, ms, ps);
    }

    /// @dev Post start and end prices for `round` on time, then move past the challenge window.
    function _settlePrices(bytes32 market, uint64 round, uint256 startPrice, uint256 endPrice) internal {
        vm.warp(uint256(round) * HOUR + 60);
        _post(market, round, startPrice);
        vm.warp(uint256(round + 1) * HOUR + 60);
        _post(market, round + 1, endPrice);
        vm.warp(uint256(round + 1) * HOUR + 60 + 1 hours);
    }

    function _claim(address player, uint64 round, bytes32 market) internal returns (uint256) {
        vm.prank(player);
        return rounds.claim(round, market);
    }

    /// @dev Reference implementation of the payout rule, written independently of the contract.
    function _expected(uint256[] memory stakes, uint16[] memory ps, uint256 i, bool up, uint16 feeBps)
        internal
        pure
        returns (uint256 payout)
    {
        uint256 total;
        uint256 w;
        uint256 mine;
        for (uint256 k; k < stakes.length; ++k) {
            uint256 p = ps[k];
            uint256 score = up ? 1e8 - (1e4 - p) * (1e4 - p) : 1e8 - p * p;
            total += stakes[k];
            w += stakes[k] * score;
            if (k == i) mine = stakes[k] * score;
        }
        if (w == 0) return stakes[i];
        uint256 gross = (total * mine) / w;
        uint256 fee = gross > stakes[i] ? ((gross - stakes[i]) * feeBps) / 1e4 : 0;
        return gross - fee;
    }
}
