import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { formatGen, formatRelativeTime, shortAddress } from "@/lib/utils";
import type { LicenCase } from "@/lib/types";

export function CaseCard({ item }: { item: LicenCase }) {
  return (
    <Link href={`/cases/${item.id}`} className="block">
      <Card className="transition-transform hover:-translate-y-0.5">
        <CardHeader className="flex-row items-start justify-between gap-3">
          <div>
            <CardTitle>{item.title}</CardTitle>
            <p className="mt-1 text-xs text-noir-900/60">
              #{item.id} &middot; submitted by {shortAddress(item.submitter)} &middot; {formatRelativeTime(item.created_at)}
            </p>
          </div>
          <StatusBadge status={item.status} />
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="text-noir-900/70">Bond: {formatGen(item.submitter_bond)}</span>
          {item.challenger ? (
            <span className="text-noir-900/70">Challenged by {shortAddress(item.challenger)}</span>
          ) : (
            <span className="text-noir-900/50">No challenge yet</span>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
