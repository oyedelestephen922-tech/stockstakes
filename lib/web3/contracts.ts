import { deployment, targetChainId } from "./chain";

/**
 * Contract configuration. Round contract addresses come from the deploy
 * script's output (lib/web3/deployment.ts); every address is null until
 * deployed — never a placeholder.
 */
export const contracts = {
  stakesRounds: deployment?.stakesRounds ?? null,
  stakesOracle: deployment?.stakesOracle ?? null,
  stakesToken: (process.env.NEXT_PUBLIC_STAKES_TOKEN_ADDRESS || null) as string | null,
  chainId: targetChainId,
};

export const contractsLive = Boolean(contracts.stakesRounds);
