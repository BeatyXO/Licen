"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TxStatus } from "@/components/tx-status";
import { useWallet } from "@/lib/wallet";
import { createWriteClient, readLicen, waitForLicenReceipt, type WriteIdentity } from "@/lib/genlayer";
import { contractAddress } from "@/lib/config";

type Stage = "idle" | "signing" | "pending" | "done" | "error";

export default function NewCasePage() {
  const router = useRouter();
  const { address, mode, privateKey } = useWallet();
  const [title, setTitle] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [licenseUrl, setLicenseUrl] = useState("");
  const [licenseVersion, setLicenseVersion] = useState("");
  const [intendedUse, setIntendedUse] = useState("");
  const [bond, setBond] = useState("1");
  const [stage, setStage] = useState<Stage>("idle");
  const [txStatus, setTxStatus] = useState("PENDING");
  const [startedAt, setStartedAt] = useState(0);
  const [txHash, setTxHash] = useState<string>();
  const [error, setError] = useState<string | null>(null);
  const [newCaseId, setNewCaseId] = useState<string | null>(null);

  const formError =
    title.trim().length < 4
      ? "Title needs at least 4 characters."
      : !/^https?:\/\//.test(sourceUrl)
        ? "Source URL must start with http:// or https://"
        : !/^https?:\/\//.test(licenseUrl)
          ? "License URL must start with http:// or https://"
          : licenseVersion.trim().length < 3
            ? "Enter the exact license identifier and version."
            : intendedUse.trim().length < 12
              ? "Describe the intended use in at least 12 characters."
              : Number(bond) <= 0
                ? "Bond must be greater than 0."
                : null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (formError || !address) return;

    setError(null);
    setStage("signing");
    try {
      const identity: WriteIdentity =
        mode === "browser" && privateKey ? { mode: "browser", privateKey } : { mode: "injected", address };
      const client = await createWriteClient(identity);
      const hash = await client.writeContract({
        address: contractAddress as `0x${string}`,
        functionName: "submit_case",
        args: [title.trim(), sourceUrl.trim(), licenseUrl.trim(), licenseVersion.trim(), intendedUse.trim()],
        value: BigInt(Math.floor(Number(bond))),
      });
      setTxHash(hash);
      setStartedAt(Date.now());
      setStage("pending");
      setTxStatus("PROPOSING");

      await waitForLicenReceipt(client, hash, (s) => setTxStatus(s));
      setTxStatus("ACCEPTED");
      setStage("done");

      // The new case is always the current highest id: submit_case only ever
      // increments the counter, so reading it back is simpler and more robust
      // than decoding the write receipt's return value.
      try {
        const count = await readLicen("get_case_count", []);
        setNewCaseId(Number(count).toString());
      } catch {
        // Non-fatal: the case still exists and is visible on /cases.
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transaction failed.");
      setStage("error");
    }
  }

  if (!contractAddress) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center text-noir-200">
        Contract address is not configured. Set NEXT_PUBLIC_LICEN_CONTRACT_ADDRESS.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-black">Submit a case</h1>
      <p className="mt-1 text-sm text-noir-200">
        Give validators source metadata that identifies its license, the exact versioned license document, and the
        commercial use you intend. Your bond is at risk if a challenger disproves that evidence or the use is not allowed.
      </p>

      {stage === "done" ? (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Case submitted</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <TxStatus current={txStatus} startedAt={startedAt} txHash={txHash} />
            <div className="flex gap-3">
              {newCaseId ? (
                <Button onClick={() => router.push(`/cases/${newCaseId}`)}>View case #{newCaseId}</Button>
              ) : null}
              <Button variant="outline" onClick={() => router.push("/cases")}>
                Back to cases
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <form onSubmit={onSubmit} className="mt-8 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Public dataset for a commercial summarizer" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="source">Source metadata URL</Label>
            <Input id="source" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="https://github.com/owner/project/blob/v1.2.0/README.md" />
            <p className="text-xs text-noir-400">It must name the source and state or link to the applicable license.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="license">Versioned license document URL</Label>
            <Input id="license" value={licenseUrl} onChange={(e) => setLicenseUrl(e.target.value)} placeholder="https://raw.githubusercontent.com/owner/project/v1.2.0/LICENSE" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="license-version">License identifier and version</Label>
            <Input id="license-version" value={licenseVersion} onChange={(e) => setLicenseVersion(e.target.value)} placeholder="Apache-2.0" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="use">Intended use</Label>
            <Textarea
              id="use"
              value={intendedUse}
              onChange={(e) => setIntendedUse(e.target.value)}
              placeholder="Fine-tune a commercial model on this dataset and sell API access to the output."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bond">Bond (wei)</Label>
            <Input id="bond" type="number" min={1} value={bond} onChange={(e) => setBond(e.target.value)} />
            <p className="text-xs text-noir-400">
              StudioNet balances are simulated — any positive amount works. A challenger must match this bond.
            </p>
          </div>

          {formError ? <p className="text-sm text-status-danger">{formError}</p> : null}
          {error ? <p className="text-sm text-status-danger">{error}</p> : null}

          {stage === "pending" ? <TxStatus current={txStatus} startedAt={startedAt} txHash={txHash} /> : null}

          {!address ? (
            <p className="rounded-md border border-status-warning/50 bg-status-warning/10 p-3 text-sm text-noir-100">
              Connect a wallet (injected or browser) above to submit a case.
            </p>
          ) : null}

          <Button type="submit" size="lg" disabled={!!formError || !address || stage === "signing" || stage === "pending"}>
            {stage === "signing" ? "Waiting for signature..." : stage === "pending" ? "Submitting..." : "Submit case"}
          </Button>
        </form>
      )}
    </div>
  );
}
