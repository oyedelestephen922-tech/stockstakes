// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @notice Hourly reference prices used to settle StockStakes rounds.
/// @dev `hour` is an hour index: the price is for timestamp `hour * 3600` (UTC).
///      Kept as an interface so the keeper-fed oracle can later be swapped for
///      a trust-minimised source (e.g. Chainlink Data Streams) without
///      touching StakesRounds' accounting.
interface IPriceOracle {
    enum Status {
        /// Not posted yet, or posted but still inside the challenge window.
        Pending,
        /// Posted and past the challenge window — safe to settle on.
        Final,
        /// Voided by the guardian, or never posted before the deadline. Rounds using it refund.
        Void
    }

    /// @return status Pending, Final or Void.
    /// @return price  Price with `PRICE_DECIMALS` decimals; 0 unless status is Final.
    function priceAt(bytes32 market, uint64 hour) external view returns (Status status, uint256 price);
}
