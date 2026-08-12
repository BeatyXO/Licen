# Steward Request: Evidence-Bound License Verification

## Requested review

Please review the deployed Licen upgrade that addresses the finding that a submitter
could name a source and independently choose any license URL without proving the two
were related.

## What changed

- A submission now includes source metadata, a versioned license document, and an
  explicit license identifier/version.
- A challenge now requires a counter-evidence URL and a concise explanation of the
  claimed mismatch or restriction.
- `resolve_case` fetches the source metadata, license document, and counter-evidence
  itself. Validators must establish the source-to-license-version binding before they
  assess the intended commercial use.
- Missing, unreachable, or non-binding evidence produces `undetermined`, which refunds
  both bonds rather than favoring a party with unsupported evidence.

## Verification

- Contract lint: 3/3 checks passed.
- Direct contract tests: 37 passed.
- TypeScript check and production build: passed.
- StudioNet deployment: `0x6E0F1463EBe082a3c27a0f66D0dEB1bcc675a00E`.
- Deployment transaction: `0x2a85d6e8e3b29219740d70860c5f3f4430bc18748210174584c1f3a1aea597bc`.
- Deployed ABI verification: passed (`submit_case` has 5 arguments and
  `challenge_case` has 3). A full live challenged-resolution run was attempted twice
  but StudioNet returned its `30 requests/minute` RPC rate-limit error while the test
  client polled receipts; it is not represented as a passing consensus test.

## Review links

- Contract: https://explorer-studio.genlayer.com/address/0x6E0F1463EBe082a3c27a0f66D0dEB1bcc675a00E
- Deployment transaction: https://explorer-studio.genlayer.com/tx/0x2a85d6e8e3b29219740d70860c5f3f4430bc18748210174584c1f3a1aea597bc
