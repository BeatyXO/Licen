"use client";

import { createAccount, createClient } from "genlayer-js";
import { TransactionStatus } from "genlayer-js/types";
import { chain, chainName, contractAddress } from "@/lib/config";

type HexAddress = `0x${string}`;
type CalldataValue =
  | null
  | boolean
  | number
  | bigint
  | string
  | Uint8Array
  | CalldataValue[]
  | { [key: string]: CalldataValue };

export type WriteIdentity = { mode: "browser"; privateKey: string } | { mode: "injected"; address: string };

export function createReadClient() {
  return createClient({ chain, account: createAccount() });
}

export async function createWriteClient(identity: WriteIdentity) {
  if (identity.mode === "browser") {
    return createClient({ chain, account: createAccount(identity.privateKey as HexAddress) });
  }
  const client = createClient({ chain, account: identity.address as HexAddress });
  try {
    await client.connect(chainName as never);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    // Some wallets error when already on the correct network — treat that as success.
    const alreadyCorrect =
      /already/i.test(msg) ||
      /same chain/i.test(msg) ||
      /no.*switch/i.test(msg);
    if (!alreadyCorrect) {
      throw new Error(
        `Could not connect your wallet to GenLayer StudioNet. ` +
          `Make sure your wallet is set to the GenLayer StudioNet network and try again, ` +
          `or use the Browser Wallet option instead. (Detail: ${msg})`,
      );
    }
  }
  return client;
}

export async function readLicen(functionName: string, args: CalldataValue[] = []) {
  const client = createReadClient();
  return client.readContract({ address: contractAddress as HexAddress, functionName, args: args as never[] });
}

export async function writeLicen(
  identity: WriteIdentity,
  functionName: string,
  args: CalldataValue[] = [],
  value = 0n,
) {
  const client = await createWriteClient(identity);
  const hash = await client.writeContract({
    address: contractAddress as HexAddress,
    functionName,
    args: args as never[],
    value,
  });
  return { hash, client };
}

export async function waitForLicenReceipt(client: Awaited<ReturnType<typeof createWriteClient>>, hash: string) {
  return client.waitForTransactionReceipt({
    hash: hash as never,
    status: TransactionStatus.ACCEPTED,
    interval: 5000,
    retries: 90,
  });
}

export async function fetchAddressBalance(address: string): Promise<string> {
  const client = createReadClient();
  // GenLayerClient extends viem PublicActions which exposes getBalance.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wei: bigint = await (client as any).getBalance({ address: address as HexAddress });
  // StudioNet balances are simulated; display as GEN (1 GEN = 1e18 wei).
  const gen = Number(wei) / 1e18;
  return gen.toLocaleString(undefined, { maximumFractionDigits: 4 }) + " GEN";
}

export { TransactionStatus };
