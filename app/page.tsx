import Link from "next/link";
import { ArrowRight, FileSearch, Gavel, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { contractAddress, explorerUrl } from "@/lib/config";

export default function Home() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="max-w-3xl">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-noir-400">license-use verification</p>
        <h1 className="mt-3 text-4xl font-black leading-tight sm:text-5xl">
          Post a bond. Say how you&apos;ll use it. Let GenLayer read the license.
        </h1>
        <p className="mt-5 text-lg text-noir-200">
          Licen is a public checker for AI, data, and software license use. A team names a source and the commercial
          use they intend, backing the claim with a bond. Anyone who disagrees can challenge with a matching bond.
          GenLayer fetches the license page itself and validators decide — allowed, not allowed, or genuinely
          undetermined.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/cases/new">
            <Button size="lg">
              Submit a case <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/cases">
            <Button size="lg" variant="outline">
              Browse cases
            </Button>
          </Link>
        </div>
      </div>

      <div className="mt-16 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <FileSearch className="h-6 w-6 text-noir-400" />
            <CardTitle>Evidence, fetched live</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-noir-900/70">
            The contract itself fetches the license page when a case is challenged — not a cached copy, not a
            user-submitted summary. If the page is unreachable, the verdict is undetermined, never guessed.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Gavel className="h-6 w-6 text-noir-400" />
            <CardTitle>Money on both sides</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-noir-900/70">
            Submitters bond behind their claim; challengers bond behind their doubt. The loser&apos;s bond pays the
            winner. An undetermined verdict returns both bonds untouched.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <ShieldCheck className="h-6 w-6 text-noir-400" />
            <CardTitle>Why it needs consensus</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-noir-900/70">
            License text is interpretive. Without GenLayer, one party — the submitter, a moderator, an oracle —
            would decide alone, and the other side would have to trust them. Here validators judge it independently.
          </CardContent>
        </Card>
      </div>

      {contractAddress ? (
        <p className="mt-12 text-xs text-noir-400">
          Contract:{" "}
          <a
            href={`${explorerUrl}/address/${contractAddress}`}
            target="_blank"
            rel="noreferrer"
            className="underline decoration-noir-400/60 underline-offset-2 hover:text-noir-100"
          >
            {contractAddress}
          </a>{" "}
          on StudioNet
        </p>
      ) : null}
    </div>
  );
}
