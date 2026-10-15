import hardhatToolboxViemPlugin from "@nomicfoundation/hardhat-toolbox-viem";
import { configVariable, defineConfig } from "hardhat/config";

// Load contracts/.env if present (Node ≥ 20.12). Hardhat's configVariable() reads process.env.
try {
  process.loadEnvFile(new URL("./.env", import.meta.url));
} catch {
  // no .env — fine for tests
}

const MAINNET_RPC = process.env.ROBINHOOD_RPC_URL || "https://rpc.mainnet.chain.robinhood.com";
const TESTNET_RPC = process.env.ROBINHOOD_TESTNET_RPC_URL || "https://rpc.testnet.chain.robinhood.com";
const MAINNET_EXPLORER = process.env.ROBINHOOD_EXPLORER_URL || "https://explorer.mainnet.chain.robinhood.com";
const TESTNET_EXPLORER = "https://explorer.testnet.chain.robinhood.com";

export default defineConfig({
  plugins: [hardhatToolboxViemPlugin],
  solidity: {
    profiles: {
      default: { version: "0.8.34", settings: { evmVersion: "cancun" } },
      production: {
        version: "0.8.34",
        settings: { evmVersion: "cancun", optimizer: { enabled: true, runs: 200 } },
      },
    },
  },
  test: {
    solidity: {
      fuzz: { runs: 512 },
      invariant: { runs: 128, depth: 60, failOnRevert: false },
    },
  },
  chainDescriptors: {
    4663: {
      name: "Robinhood Chain",
      chainType: "generic",
      blockExplorers: {
        blockscout: { name: "Robinhood Chain Explorer", url: MAINNET_EXPLORER, apiUrl: `${MAINNET_EXPLORER}/api` },
      },
    },
    46630: {
      name: "Robinhood Chain Testnet",
      chainType: "generic",
      blockExplorers: {
        blockscout: { name: "Robinhood Chain Testnet Explorer", url: TESTNET_EXPLORER, apiUrl: `${TESTNET_EXPLORER}/api` },
      },
    },
  },
  networks: {
    // Local simulation of Robinhood Chain mainnet (live state forked in), for rehearsing the deploy.
    robinhoodFork: {
      type: "edr-simulated",
      chainType: "generic",
      chainId: 4663,
      forking: { url: MAINNET_RPC },
    },
    robinhood: {
      type: "http",
      chainType: "generic",
      url: MAINNET_RPC,
      accounts: [configVariable("DEPLOYER_PRIVATE_KEY")],
    },
    robinhoodTestnet: {
      type: "http",
      chainType: "generic",
      url: TESTNET_RPC,
      accounts: [configVariable("DEPLOYER_PRIVATE_KEY")],
    },
  },
});
