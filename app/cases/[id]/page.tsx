"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { TxStatus } from "@/components/tx-status";
import { readLicen, createWriteClient, waitForLicenReceipt, type WriteIdentity } from "@/lib/genlayer";
import { useWallet } from "@/lib/wallet";
import { contractAddress, explorerUrl } from "@/lib/config";
import { formatAbsoluteTime, formatGen, shortAddress } from "@/lib/utils";
import type { LicenCase } from "@/lib/types";

type Stage = "idle" | "signing" | "pending" | "error";

export default function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { address, mode, privateKey } = useWallet();

  const [item, setItem] = useState<LicenCase | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [txStatus, setTxStatus] = useState("PROPOSING");
  const [startedAt, setStartedAt] = useState(0);
  const [txHash, setTxHash] = useState<string>();
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const raw = (await readLicen("get_case", [id])) as string;
      if (!raw) {
        setNotFound(true);
        return;
      }
      setItem(JSON.parse(raw));
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Could not reach the Licen contract.");
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function runWrite(functionName: string, args: unknown[], value = 0n) {
    if (!address) return;
    setActionError(null);
    setStartedAt(Date.now());
    setStage("signing");
    try {
      const identity: WriteIdentity =
        mode === "browser" && privateKey ? { mode: "browser", privateKey } : { mode: "injected", address };
      const client = await createWriteClient(identity);
      const hash = await client.writeContract({
        address: contractAddress as `0x${string}`,
        functionName,
        args: args as never[],
        value,
      });
      setTxHash(hash);
      setStage("pending");
      setTxStatus("PROPOSING");
      await waitForLicenReceipt(client, hash);
      setTxStatus("ACCEPTED");
      setStage("idle");
      await load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Transaction failed.");
      setStage("error");
    }
  }

  if (notFound) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <ShieldAlert className="mx-auto h-8 w-8 text-noir-400" />
        <p className="mt-3 font-bold">Case #{id} was not found.</p>
        <Link href="/cases" className="mt-4 inline-block">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4" /> Back to cases
          </Button>
        </Link>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center text-sm text-status-danger">{loadError}</div>
    );
  }

  if (!item) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <div className="h-40 animate-pulse rounded-lg border border-noir-400/15 bg-noir-900/60" />
      </div>
    );
  }

  const isSubmitter = address?.toLowerCase() === item.submitter.toLowerCase();
  const isBusy = stage === "signing" || stage === "pending";

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <Link href="/cases" className="inline-flex items-center gap-1 text-sm text-noir-400 hover:text-noir-100">
        <ArrowLeft className="h-4 w-4" /> All cases
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black">{item.title}</h1>
          <p className="mt-1 text-xs text-noir-400">Case #{item.id} &middot; submitted {formatAbsoluteTime(item.created_at)}</p>
        </div>
        <StatusBadge status={item.status} />
      </div>

      <Card className="mt-6">
        <CardContent className="grid gap-4 pt-5 sm:grid-cols-2">
          <div>
            <p className="text-xs font-bold text-noir-900/60">Source</p>
            <a href={item.source_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-noir-700 underline">
              {item.source_url} <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <div>
            <p className="text-xs font-bold text-noir-900/60">License</p>
            <a href={item.license_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-noir-700 underline">
              {item.license_url} <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs font-bold text-noir-900/60">Intended use</p>
            <p className="text-sm text-noir-900/90">{item.intended_use}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-noir-900/60">Submitter</p>
            <p className="font-mono text-sm text-noir-900/90">{shortAddress(item.submitter)}</p>
            <p className="text-xs text-noir-900/60">Bond: {formatGen(item.submitter_bond)}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-noir-900/60">Challenger</p>
            {item.challenger ? (
              <>
                <p className="font-mono text-sm text-noir-900/90">{shortAddress(item.challenger)}</p>
                <p className="text-xs text-noir-900/60">Bond: {formatGen(item.challenger_bond)}</p>
              </>
            ) : (
              <p className="text-sm text-noir-900/50">None yet</p>
            )}
          </div>
        </CardContent>
      </Card>

      {item.verdict ? (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Consensus verdict: {item.verdict.replace("_", " ")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="text-noir-900/60">Confidence: {item.confidence}%</p>
            <p className="text-noir-900/90">{item.reasoning}</p>
            <p className="text-xs text-noir-900/50">Resolved {formatAbsoluteTime(item.resolved_at)}</p>
          </CardContent>
        </Card>
      ) : null}

      <div className="mt-6 space-y-4">
        {isBusy || stage === "error" ? <TxStatus current={txStatus} startedAt={startedAt} txHash={txHash} onRetry={() => setStage("idle")} /> : null}
        {actionError ? <p className="text-sm text-status-danger">{actionError}</p> : null}

        {!address ? (
          <p className="rounded-md border border-status-warning/50 bg-status-warning/10 p-3 text-sm text-noir-100">
            Connect a wallet to challenge, withdraw, or resolve this case.
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          {item.status === "open" && address && !isSubmitter ? (
            <Button disabled={isBusy} onClick={() => runWrite("challenge_case", [item.id], BigInt(item.submitter_bond || "1"))}>
              Challenge (bond {formatGen(item.submitter_bond)})
            </Button>
          ) : null}
          {item.status === "open" && address && isSubmitter ? (
            <Button variant="outline" disabled={isBusy} onClick={() => runWrite("withdraw_unchallenged", [item.id])}>
              Withdraw bond (after challenge window)
            </Button>
          ) : null}
          {item.status === "challenged" && address ? (
            <Button disabled={isBusy} onClick={() => runWrite("resolve_case", [item.id])}>
              Trigger resolution
            </Button>
          ) : null}
        </div>

        <p className="text-xs text-noir-400">
          Contract:{" "}
          <a href={`${explorerUrl}/address/${contractAddress}`} target="_blank" rel="noreferrer" className="underline">
            {contractAddress}
          </a>
        </p>
      </div>
    </div>
  );
}
