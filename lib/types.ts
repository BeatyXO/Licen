export type CaseStatus =
  | "open"
  | "challenged"
  | "resolved_allowed"
  | "resolved_not_allowed"
  | "resolved_undetermined"
  | "expired_unchallenged";

export type Verdict = "" | "allowed" | "not_allowed" | "undetermined";

export type LicenCase = {
  id: string;
  title: string;
  source_url: string;
  license_url: string;
  intended_use: string;
  submitter: string;
  submitter_bond: string;
  challenger: string;
  challenger_bond: string;
  status: CaseStatus;
  created_at: string;
  challenged_at: string;
  resolved_at: string;
  verdict: Verdict;
  confidence: number;
  reasoning: string;
};
