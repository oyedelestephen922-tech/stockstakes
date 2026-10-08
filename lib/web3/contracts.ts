/**
 * Contract configuration. Every address is null until deployed.
 * Fill these from environment variables — never hardcode a placeholder.
 */
export const contracts = {
  roundManager: (process.env.NEXT_PUBLIC_ROUND_MANAGER_ADDRESS || null) as string | null,
  stakesToken: (process.env.NEXT_PUBLIC_STAKES_TOKEN_ADDRESS || null) as string | null,
  chainId: process.env.NEXT_PUBLIC_CHAIN_ID ? Number(process.env.NEXT_PUBLIC_CHAIN_ID) : null,
};

export const contractsLive = Boolean(contracts.roundManager);
