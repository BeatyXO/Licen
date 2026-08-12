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
  // connect() installs the GenLayer Snap for MetaMask Flask wallets.
  // Other EIP-1193 wallets (Rabby, standard MetaMask) handle network/signing
  // at the transaction level — if connect() throws, swallow it and let
  // writeContract proceed; the wallet will prompt natively.
  try {
    await client.connect(chainName as never);
  } catch {
    // Non-fatal: wallet will handle signing on writeContract.
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

const TERMINAL_ERROR_STATUSES = new Set([
  TransactionStatus.CANCELED,
  TransactionStatus.UNDETERMINED,
  TransactionStatus.VALIDATORS_TIMEOUT,
  TransactionStatus.LEADER_TIMEOUT,
]);

const RECEIPT_POLL_INITIAL_MS = 15_000;
const RECEIPT_POLL_MAX_MS = 45_000;
const RATE_LIMIT_COOLDOWN_MS = 60_000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRateLimited(error: unknown) {
  return /rate limit exceeded|code=-32029/i.test(error instanceof Error ? error.message : String(error));
}

function retryAfterMs(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const match = message.match(/retry_after_seconds["':\s]+(\d+)/i);
  return match ? Number(match[1]) * 1000 : RATE_LIMIT_COOLDOWN_MS;
}

export async function waitForLicenReceipt(
  client: Awaited<ReturnType<typeof createWriteClient>>,
  hash: string,
  onStatus?: (status: string) => void,
) {
  // Poll manually so we can surface terminal error states immediately
  // rather than waiting for the full retry budget to exhaust.
  const maxRetries = 40;
  let interval = RECEIPT_POLL_INITIAL_MS;
  for (let i = 0; i < maxRetries; i++) {
    await sleep(interval);
    let tx;
    try {
      tx = await client.getTransaction({ hash: hash as never });
    } catch (error) {
      if (isRateLimited(error)) {
        onStatus?.("RATE_LIMITED");
        interval = Math.max(interval, retryAfterMs(error));
      } else {
        interval = Math.min(interval * 2, RECEIPT_POLL_MAX_MS);
      }
      continue; // transient network hiccup — keep polling
    }
    const status = String(tx.statusName ?? tx.status ?? "PENDING");
    onStatus?.(status);
    if (status === TransactionStatus.ACCEPTED || status === TransactionStatus.FINALIZED) {
      // Check for contract-level execution error even on ACCEPTED.
      if (tx.txExecutionResultName === "FINISHED_WITH_ERROR") {
        const detail = tx.consensus_data?.leader_receipt?.[0]?.error ?? "contract execution error";
        throw new Error(`Transaction was accepted but the contract reverted: ${detail}`);
      }
      return tx;
    }
    if (TERMINAL_ERROR_STATUSES.has(status as TransactionStatus)) {
      throw new Error(`Transaction ended with status ${String(status)} — nothing was written. It is safe to retry.`);
    }
  }
  throw new Error("Transaction is still pending. Check the explorer for its current status; it will continue on StudioNet.");
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
