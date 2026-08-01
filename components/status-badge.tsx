import { Badge } from "@/components/ui/badge";
import type { CaseStatus } from "@/lib/types";

const copy: Record<CaseStatus, string> = {
  open: "Open — unchallenged",
  challenged: "Challenged — awaiting consensus",
  resolved_allowed: "Resolved: use allowed",
  resolved_not_allowed: "Resolved: use not allowed",
  resolved_undetermined: "Resolved: undetermined",
  expired_unchallenged: "Window closed, unchallenged",
};

const tone: Record<CaseStatus, string> = {
  open: "border-status-pending/70 bg-status-pending/20 text-noir-900",
  challenged: "border-status-warning/80 bg-status-warning/25 text-noir-900",
  resolved_allowed: "border-status-success/80 bg-status-success/25 text-noir-900",
  resolved_not_allowed: "border-status-danger/80 bg-status-danger/25 text-noir-900",
  resolved_undetermined: "border-noir-700/60 bg-noir-200 text-noir-900",
  expired_unchallenged: "border-noir-700/40 bg-noir-200 text-noir-900",
};

export function StatusBadge({ status }: { status: CaseStatus }) {
  return <Badge className={tone[status]}>{copy[status]}</Badge>;
}
