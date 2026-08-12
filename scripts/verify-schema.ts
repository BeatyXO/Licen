/**
 * Fetches the deployed contract's real schema and checks every function name
 * this frontend calls actually exists there with the right arity. Run before
 * every deploy: `npx tsx scripts/verify-schema.ts`.
 */
import { createClient, createAccount } from "genlayer-js";
import { chain, contractAddress, contractFunctions } from "../lib/config";

const EXPECTED_ARITY: Record<string, number> = {
  submit_case: 5,
  challenge_case: 3,
  withdraw_unchallenged: 1,
  resolve_case: 1,
  get_case: 1,
  get_cases: 1,
  get_case_count: 0,
  get_challenge_window_seconds: 0,
};

async function main() {
  if (!contractAddress) {
    console.error("NEXT_PUBLIC_LICEN_CONTRACT_ADDRESS is not set.");
    process.exit(1);
  }

  const client = createClient({ chain, account: createAccount() });
  const schema = await client.getContractSchema(contractAddress as `0x${string}`);
  const methods = (schema as { methods?: Record<string, { params?: unknown[] }> }).methods ?? {};

  let failed = false;
  for (const fn of contractFunctions) {
    const method = methods[fn];
    if (!method) {
      console.error(`MISSING on-chain: ${fn}`);
      failed = true;
      continue;
    }
    const arity = method.params?.length ?? 0;
    const expected = EXPECTED_ARITY[fn];
    if (expected !== undefined && arity !== expected) {
      console.error(`ARITY MISMATCH: ${fn} expects ${expected} params, contract has ${arity}`);
      failed = true;
      continue;
    }
    console.log(`OK: ${fn} (${arity} params)`);
  }

  const onChainOnly = Object.keys(methods).filter((name) => !contractFunctions.includes(name as never));
  if (onChainOnly.length) {
    console.log(`Contract also exposes (not called by frontend): ${onChainOnly.join(", ")}`);
  }

  if (failed) {
    console.error("\nSchema verification FAILED.");
    process.exit(1);
  }
  console.log("\nSchema verification passed: every frontend call matches the deployed contract.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
