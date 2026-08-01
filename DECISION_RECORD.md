# Decision record — Licen

## Candidates considered

Eight candidates, drawn deliberately from different parts of the GenLayer capability
surface rather than variations on "fetch a page and judge it."

1. **Licen (chosen)** — bonded license-use verification. Submitter posts a source +
   intended commercial use + bond; challengers bond against it; the contract fetches
   the license page and an LLM judges allowed / not allowed / undetermined.
   *Capabilities: web fetch, prompt_comparative, native GEN bonding + slashing.*

2. **RFP Yard v2** — companies post paid RFPs, vendors submit bids, GenLayer scores bid
   relevance against the RFP text. Rejected: no genuine dispute between two parties —
   the vendor and buyer both want a good match, so there's no adversarial pressure
   that needs a trustless arbiter, just a recommender system.

3. **Receipt-backed expense pool** — a shared pool where members submit photographed
   receipts (`render(mode="screenshot")` + `exec_prompt(images=[...])`) to justify a
   withdrawal; other members can dispute. *Capabilities: images, native value.* A real
   contender — dropped mainly because "is this receipt legitimate" is closer to OCR +
   heuristic than genuinely interpretive judgment for most cases, weakening Gate C.

4. **On-chain semantic bug-bounty triage** — reports get embedded (`genlayer_embeddings`
   `VecDB`/`knn`) and matched against a project's known-issue corpus to filter
   duplicates before a human reviews them. Rejected: duplicate-detection has no
   two-sided financial dispute — nobody's money is on the line over whether embeddings
   are similar, so Gate B fails.

5. **Domain-squatting insurance pool** — members pay into a pool; a claim requires
   GenLayer to decide if a live domain is impersonating a member's brand, paying out
   from the pool if so. *Capabilities: web fetch/screenshot, insurance pool, native
   value.* Genuinely adversarial (squatter vs. brand owner) but the "squatting or not"
   question is close to a trademark/visual-similarity heuristic more often than it is
   irreducibly semantic — weaker on Gate C than Licen's license-clause reading.

6. **Cross-chain grant milestone escrow** — a DAO escrows GEN for a grantee; the
   grantee submits evidence a milestone shipped (a repo, a live URL); the DAO can
   dispute; GenLayer fetches the evidence and decides. This is structurally almost
   identical to Licen (bond, challenge, fetch, judge) — same two capabilities, same
   shape of dispute — so it's the "same idea twice" case. Licen was kept over this
   because "is this feature shipped" is fuzzier and more gameable than "does this
   specific license text permit this specific use," which has actual clauses to cite.

7. **Prediction market on GitHub PR merges** — bet on whether an open PR will be merged
   by a deadline; GenLayer checks PR state at resolution. Rejected on Gate C: PR merge
   status is a deterministic API fact (`state: merged`), not a judgment call — a
   regular oracle answers this, consensus adds nothing.

8. **AI-model-card compliance checker** — teams submit a model card; GenLayer checks it
   against a fixed rubric (license field present, training-data source disclosed,
   etc.) for a compliance badge. Rejected on Gate B: nobody has money against the
   submitter's claim, so there's no counterparty and no reason to distrust a single
   pass/fail check — this is closer to a linter than a dispute.

9. **Freelance-contract scope-creep arbiter** — client and freelancer each escrow a
   bond; on a dispute, GenLayer reads the original scope doc and the delivered work's
   repo/description and decides if delivery matches scope. *Capabilities: web fetch,
   native value, comparative judgment.* Very close in shape to Licen. Dropped for
   breadth of adoption: it needs a matched pair of counterparties who both choose to
   use the platform per contract, versus Licen where any public source with a public
   license already qualifies and any stranger can challenge — a lower bar to first use.

## Self-audit

- **Distinct capabilities actually represented across the eight**: web fetch/render
  (1, 2, 3, 5, 6, 9), images (3), embeddings/VecDB (4), native GEN bonding/escrow/
  insurance (1, 5, 6, 9), prompt_comparative judgment (1, 5, 6, 9), a pure deterministic
  oracle case included as a negative example (7). That's four distinct capability
  families, not eight variations of one idea.
- **Which two are really the same idea twice**: #1 (Licen) and #6 (grant milestone
  escrow) share the bond/challenge/fetch/judge skeleton. Licen was chosen because its
  judgment question (does license text X permit use Y) has actual textual anchors to
  cite, which is a stronger fit for Gate C than "did this ship," which tends to
  degrade into vibes.
- **What I'd have picked if web access didn't exist**: #4, the embedding-based bug
  triage — the only candidate whose core mechanism doesn't depend on `web.get`/
  `web.render` at all. It was set aside because it fails Gate B (no adversarial money),
  not because embeddings are a weak capability — worth revisiting as a milestone
  feature (e.g., prior-art search across submitted Licen cases) rather than a v1 core.

## Licen against every gate

- **Gate A — counterfactual.** Delete GenLayer: a single party (the submitter, a
  platform moderator, or an automated regex over the license URL) decides whether a
  use is permitted, and the other side — the challenger, or downstream users relying
  on the verdict — has no way to verify that call except trusting them. License text
  is exactly the kind of document a regex cannot safely interpret ("non-commercial
  except for research" clauses, dual licensing, CC-BY-NC-SA attribution chains).
- **Gate B — two distrusting parties.** Named: the **submitter** (wants their intended
  use ruled allowed, gets their bond back plus the challenger's if so) and the
  **challenger** (wants it ruled not allowed, same payoff structure in reverse). Their
  incentives are direct opposites, and they never have to agree — a live end-to-end
  test on StudioNet ran exactly this: case #2 (`0xe59e56FC...`) was submitted claiming
  a GPL-licensed CLI could be embedded in closed-source SaaS, challenged, and resolved
  `not_allowed` with the consensus reasoning citing GPLv2's distribution clause.
- **Gate C — irreducibly semantic.** "Does this license's text permit this specific
  described use" requires reading prose and applying it to a novel scenario, not
  parsing a known field. A regex can find the word "commercial" in a license; it
  cannot tell you whether embedding GPL code in a closed-source SaaS without releasing
  source violates it — that took citing the actual distribution requirement.
- **Gate D — evidence the contract fetches itself.** `resolve_case` calls
  `gl.nondet.web.render(license_url, mode="text")` inside the leader function, never
  trusts a submitter-pasted excerpt. If the fetch fails, the leader catches the
  exception and returns `undetermined` instead of guessing or reverting (see the
  StudioNet bug found and fixed, in the README).
- **Gate E — would a stranger use this twice.** Any team about to use any public
  dataset, model weights, or open-source repo commercially has this problem
  repeatedly, one source at a time — it's not a one-off analysis, it's a checklist
  item on every new integration.
- **Gate F — path beyond submission.** Natural extensions: a badge/registry API other
  tools can query before they redistribute a dependency; embeddings-based prior-art
  search across resolved cases (see candidate #4) so a new submission can be warned
  about a similar past `not_allowed` verdict before it bonds; multi-jurisdiction
  license packs (CC, SPDX identifiers) with pre-filled license URLs.
- **Gate G — latency budget.** One nondet round, one fetch, one LLM call per
  `resolve_case` — the minimum possible shape. Registration (`submit_case`) and
  disputing (`challenge_case`) are plain deterministic writes that settle in seconds;
  only the challenged path pays the consensus round, and it's a separate,
  permissionless transaction anyone can trigger and pay for, so the submitter is never
  the one stuck waiting on it.
