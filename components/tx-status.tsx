"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Circle, Loader2, RotateCcw, XCircle } from "lucide-react";
import { explorerUrl } from "@/lib/config";

const stages = ["PENDING", "PROPOSING", "COMMITTING", "REVEALING", "ACCEPTED", "FINALIZED"];

export function TxStatus({
  current,
  startedAt,
  txHash,
  onRetry,
}: {
  current: string;
  startedAt: number;
  txHash?: string;
  onRetry?: () => void;
}) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 1000);
    return () => window.clearInterval(id);
  }, [startedAt]);

  const isRetryable = ["UNDETERMINED", "VALIDATORS_TIMEOUT", "LEADER_TIMEOUT"].includes(current);
  const currentIndex = stages.indexOf(current);

  if (isRetryable) {
    return (
      <div className="rounded-lg border border-status-danger/50 bg-status-danger/15 p-4 text-sm text-noir-100" role="alert">
        <div className="mb-2 flex items-center gap-2 font-bold">
          <RotateCcw className="h-4 w-4" /> Validators did not reach consensus ({current}).
        </div>
        <p className="mb-3 text-noir-200">
          Nothing was written to the contract — your bond was not moved. This is a normal, retryable outcome on
          GenLayer, not an error in your submission.
        </p>
        {onRetry ? (
          <button
            onClick={onRetry}
            className="rounded-md bg-noir-400 px-3 py-1.5 text-xs font-bold text-noir-900 hover:bg-noir-200"
          >
            Retry
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="grid gap-3 rounded-lg border border-noir-400/15 bg-noir-900/80 p-4" aria-live="polite">
      <div className="flex items-center justify-between text-xs text-noir-200">
        <span>Elapsed: {elapsed}s</span>
        {txHash ? (
          <a
            href={`${explorerUrl}/transactions/${txHash}`}
            target="_blank"
            rel="noreferrer"
            className="underline decoration-noir-400 underline-offset-2 hover:text-noir-100"
          >
            View on explorer
          </a>
        ) : null}
      </div>
      {stages.map((stage, index) => {
        const done = index < currentIndex;
        const active = index === currentIndex;
        const Icon = done ? CheckCircle2 : active ? Loader2 : current === "CANCELED" ? XCircle : Circle;
        const iconClass = done
          ? "h-4 w-4 text-status-success"
          : active
            ? "h-4 w-4 animate-spin text-noir-400"
            : "h-4 w-4 text-noir-200/30";
        return (
          <div key={stage} className="flex items-center gap-3 text-sm">
            <Icon className={iconClass} />
            <span className={done ? "text-status-success" : active ? "text-noir-100" : "text-noir-200/40"}>{stage}</span>
          </div>
        );
      })}
      {current === "ACCEPTED" ? (
        <p className="text-xs text-status-warning">
          Accepted, not yet finalized — the result can still change during the appeal window.
        </p>
      ) : null}
    </div>
  );
}
