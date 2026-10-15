/**
 * Chainlink price feeds on Robinhood Chain mainnet (chain 4663), used by
 * StakesOracle to sanity-check the keeper's prices. Only markets on our board.
 *
 * Source: Chainlink reference data (feeds-robinhood-mainnet.json), snapshot 2026-10-15.
 * The deploy script checks every address on-chain (code + description) before
 * using it, and skips any that fail. Testnet has no feeds, so no checks run there.
 */
export const chainlinkFeeds: Record<number, Record<string, `0x${string}`>> = {
  4663: {
    "ETH": "0x78F3556b67E17Df817D51Ef5a990cDaF09E8d3A9", // ETH / USD
    "NVDA": "0x379EC4f7C378F34a1B47E4F3cbeBCbAC3E8E9F15", // Robinhood NVDA / USD
    "TSLA": "0x4A1166a659A55625345e9515b32adECea5547C38", // Robinhood TSLA / USD
    "SPCX": "0xB265810950ba6c5C0Ff821c9963014a56fD8Bffb", // Robinhood SPCX / USD
    "AAPL": "0x6B22A786bAa607d76728168703a39Ea9C99f2cD0", // Robinhood AAPL / USD
    "MSFT": "0x45C3C877C15E6BA2EBB19eA114Ea508d14C1Af2E", // Robinhood MSFT / USD
    "AMZN": "0xD5a1508ceD74c084eBf3cBe853e2C968fB2a651C", // Robinhood AMZN / USD
    "GOOGL": "0xF6f373a037c30F0e5010d854385cA89185AE638b", // Robinhood GOOGL / USD
    "META": "0x7C38C00C30BEe9378381E7B6135d7283356D71b1", // Robinhood META / USD
    "PLTR": "0x820ABedFF239034956B7A9d2F0a331f9F075eB4c", // Robinhood PLTR / USD
    "AMD": "0x943A29E7ae51A4798823ca9eEd2ed533B2A22C72", // Robinhood AMD / USD
    "MSTR": "0x396118bdFB181e6240E74D243F266B061c0edc3D", // Robinhood MSTR / USD
    "TSM": "0x874cF94aa8eC88Fd9560094dD065f2fB3E41Fc2F", // Robinhood TSM / USD
    "MU": "0x425EEFdCf05ed6526C3cE61Af99429A228a6d596", // Robinhood MU / USD
    "INTC": "0x3f390C5C24628Ac7C489515402235FeAD71D1913", // Robinhood INTC / USD
    "GME": "0x27C71df6A64fB476468EdF256CF72c038baB5B67", // Robinhood GME / USD
    "CRWV": "0xe1b3aABCAFAd1c94708dc1367dcfF8Aa4407487C", // Robinhood CRWV / USD
    "RKLB": "0x045477BF65Aef6f4F2386ad0164579e48381CC74", // Robinhood RKLB / USD
    "CRCL": "0x6652eDf64bA3731C4F2D3ce821A0Fb1f1f6b482a", // Robinhood CRCL / USD
    "SPY": "0x319724394D3A0e3669269846abE664Cd621f9f6A", // Robinhood SPY / USD
    "QQQ": "0x80901d846d5D7B030F26B480776EE3b29374C2ae", // Robinhood QQQ / USD
    "SNDK": "0xfb133Fa4B7b385802B693a293606682Df47109A3", // Robinhood SNDK / USD
    "DELL": "0x1C6c8cADBe02E19129c39dDB92281cE4c0bf206b", // Robinhood DELL-USD
    "RGTI": "0x2A045cF1C49c61c166C036d2f06FA2D2d984f765", // Robinhood RGTI / USD
    "BABA": "0x62Cc8F9b5f56a33c9C8A60c8B92779f523c4E984", // Robinhood BABA / USD
    "CLSK": "0x810c12D3a554Bc47fd39597Fe3b3AAC4941F50eF", // Robinhood CLSK / USD
    "USAR": "0xA994d3684e8400A6c8078226925779FdeE682DD9", // Robinhood USAR-USD
    "EWY": "0xEFdf54610B62A7753Ec30bDc380847c12D32e1D1", // Robinhood EWY / USD
    "SGOV": "0xa0DF4ee0fFf975306345875E3548Fcc519577A11", // Robinhood SGOV-USD
    "SLV": "0x209b73908e92Ae021826eD79609845451Ecba2ce", // Robinhood SLV / USD
  },
};
