"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FileX2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CaseCard } from "@/components/case-card";
import { readLicen } from "@/lib/genlayer";
import type { LicenCase } from "@/lib/types";

export default function CasesPage() {
  const [cases, setCases] = useState<LicenCase[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setCases(null);
    readLicen("get_cases", [100])
      .then((raw) => {
        if (cancelled) return;
        const parsed: LicenCase[] = JSON.parse(raw as string);
        setCases(parsed.slice().reverse());
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Could not reach the Licen contract.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black">Cases</h1>
          <p className="mt-1 text-sm text-noir-200">Every case ever submitted to Licen, newest first.</p>
        </div>
        <Link href="/cases/new">
          <Button>
            <Plus className="h-4 w-4" /> Submit a case
          </Button>
        </Link>
      </div>

      {error ? (
        <div className="rounded-lg border border-status-danger/50 bg-status-danger/10 p-6 text-sm text-noir-100">
          <p className="font-bold">Could not load cases.</p>
          <p className="mt-1 text-noir-200">{error}</p>
        </div>
      ) : cases === null ? (
        <div className="grid gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-lg border border-noir-400/15 bg-noir-900/60" />
          ))}
        </div>
      ) : cases.length === 0 ? (
        <div className="rounded-lg border border-dashed border-noir-400/30 p-12 text-center">
          <FileX2 className="mx-auto h-8 w-8 text-noir-400" />
          <p className="mt-3 font-bold">No cases yet</p>
          <p className="mt-1 text-sm text-noir-200">
            Be the first to submit a source and its intended commercial use.
          </p>
          <Link href="/cases/new" className="mt-4 inline-block">
            <Button>
              <Plus className="h-4 w-4" /> Submit a case
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {cases.map((item) => (
            <CaseCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
