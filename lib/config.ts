import { localnet, studionet, testnetAsimov, testnetBradbury } from "genlayer-js/chains";

export const chainName = process.env.NEXT_PUBLIC_GENLAYER_CHAIN ?? "studionet";

const CHAINS = {
  localnet,
  studionet,
  testnetAsimov,
  testnetBradbury,
} as const;

export const chain = CHAINS[chainName as keyof typeof CHAINS] ?? studionet;
export const contractAddress = process.env.NEXT_PUBLIC_LICEN_CONTRACT_ADDRESS ?? "";
export const explorerUrl = process.env.NEXT_PUBLIC_GENLAYER_EXPLORER_URL ?? "https://explorer-studio.genlayer.com";
export const studioUrl = process.env.NEXT_PUBLIC_GENLAYER_STUDIO_URL ?? "https://studio.genlayer.com";

export const contractFunctions = [
  "submit_case",
  "challenge_case",
  "withdraw_unchallenged",
  "resolve_case",
  "get_case",
  "get_cases",
  "get_case_count",
  "get_challenge_window_seconds",
] as const;

export const CHALLENGE_WINDOW_SECONDS = 1800;
