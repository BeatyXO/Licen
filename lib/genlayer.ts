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
  await client.connect(chainName as never);
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

export { TransactionStatus };
