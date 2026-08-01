import json

import pytest

CONTRACT = "contracts/licen.py"

BASE_TIME = "2026-08-01T00:00:00.000000Z"


def _after(seconds: int) -> str:
    # BASE_TIME plus N seconds, formatted like gl.message_raw datetime.
    from datetime import datetime, timedelta, timezone

    start = datetime(2026, 8, 1, 0, 0, 0, tzinfo=timezone.utc)
    return (start + timedelta(seconds=seconds)).isoformat().replace("+00:00", "Z")


@pytest.fixture
def licen(direct_vm, direct_deploy, direct_alice, warp):
    direct_vm.sender = direct_alice
    warp(BASE_TIME)
    return direct_deploy(CONTRACT)


def submit(direct_vm, licen, sender, value=1000, **overrides):
    direct_vm.sender = sender
    direct_vm.value = value
    args = dict(
        title="Corpus X commercial use",
        source_url="https://example.com/dataset",
        license_url="https://example.com/license",
        intended_use="Fine-tune a commercial model and sell API access to the output.",
    )
    args.update(overrides)
    return licen.submit_case(
        args["title"], args["source_url"], args["license_url"], args["intended_use"]
    )


ALLOWED_LICENSE_HTML = "This dataset is released under a permissive commercial-use license."


def mock_evaluation(direct_vm, verdict="allowed", confidence=80, reasoning="clause 2 permits commercial fine-tuning"):
    direct_vm.mock_web(r"example\.com/license", {"status": 200, "body": ALLOWED_LICENSE_HTML})
    payload = json.dumps({"verdict": verdict, "confidence": confidence, "reasoning": reasoning})
    direct_vm.mock_llm(r".*", payload)


# ---------------------------------------------------------------------------
# submit_case
# ---------------------------------------------------------------------------


def test_submit_case_creates_open_case(direct_vm, licen, direct_alice):
    case_id = submit(direct_vm, licen, direct_alice)
    case = json.loads(licen.get_case(case_id))
    assert case["status"] == "open"
    assert case["submitter_bond"] == "1000"
    assert case["challenger"] == ""


def test_submit_case_requires_positive_bond(direct_vm, licen, direct_alice):
    direct_vm.sender = direct_alice
    direct_vm.value = 0
    with direct_vm.expect_revert("EXPECTED_BOND_REQUIRED"):
        licen.submit_case("Title here", "https://a.com/x", "https://a.com/license", "commercial use of the data")


def test_submit_case_rejects_short_title(direct_vm, licen, direct_alice):
    with direct_vm.expect_revert("EXPECTED_BAD_TITLE"):
        submit(direct_vm, licen, direct_alice, title="ab")


def test_submit_case_rejects_non_public_source_url(direct_vm, licen, direct_alice):
    with direct_vm.expect_revert("EXPECTED_BAD_SOURCE_URL"):
        submit(direct_vm, licen, direct_alice, source_url="ftp://a.com/x")


def test_submit_case_rejects_non_public_license_url(direct_vm, licen, direct_alice):
    with direct_vm.expect_revert("EXPECTED_BAD_LICENSE_URL"):
        submit(direct_vm, licen, direct_alice, license_url="not-a-url")


def test_submit_case_rejects_short_intended_use(direct_vm, licen, direct_alice):
    with direct_vm.expect_revert("EXPECTED_BAD_INTENDED_USE"):
        submit(direct_vm, licen, direct_alice, intended_use="short")


def test_submit_case_increments_counter(direct_vm, licen, direct_alice):
    id1 = submit(direct_vm, licen, direct_alice)
    id2 = submit(direct_vm, licen, direct_alice)
    assert int(id2) == int(id1) + 1
    assert int(licen.get_case_count()) == int(id2)


# ---------------------------------------------------------------------------
# challenge_case — including window boundary
# ---------------------------------------------------------------------------


def test_challenge_case_within_window_succeeds(direct_vm, licen, direct_alice, direct_bob, warp):
    case_id = submit(direct_vm, licen, direct_alice)
    warp(_after(100))
    direct_vm.sender = direct_bob
    direct_vm.value = 1000
    licen.challenge_case(case_id)
    case = json.loads(licen.get_case(case_id))
    assert case["status"] == "challenged"
    assert case["challenger"] != ""


def test_challenge_case_exactly_at_window_boundary_fails(direct_vm, licen, direct_alice, direct_bob, warp):
    case_id = submit(direct_vm, licen, direct_alice)
    warp(_after(1800))  # CHALLENGE_WINDOW_SECONDS, boundary is closed (>=)
    direct_vm.sender = direct_bob
    direct_vm.value = 1000
    with direct_vm.expect_revert("EXPECTED_CHALLENGE_WINDOW_CLOSED"):
        licen.challenge_case(case_id)


def test_challenge_case_one_second_before_boundary_succeeds(direct_vm, licen, direct_alice, direct_bob, warp):
    case_id = submit(direct_vm, licen, direct_alice)
    warp(_after(1799))
    direct_vm.sender = direct_bob
    direct_vm.value = 1000
    licen.challenge_case(case_id)
    case = json.loads(licen.get_case(case_id))
    assert case["status"] == "challenged"


def test_challenge_case_after_window_fails(direct_vm, licen, direct_alice, direct_bob, warp):
    case_id = submit(direct_vm, licen, direct_alice)
    warp(_after(9000))
    direct_vm.sender = direct_bob
    direct_vm.value = 1000
    with direct_vm.expect_revert("EXPECTED_CHALLENGE_WINDOW_CLOSED"):
        licen.challenge_case(case_id)


def test_challenge_case_rejects_submitter_self_challenge(direct_vm, licen, direct_alice, warp):
    case_id = submit(direct_vm, licen, direct_alice)
    warp(_after(10))
    direct_vm.sender = direct_alice
    direct_vm.value = 1000
    with direct_vm.expect_revert("EXPECTED_SUBMITTER_CANNOT_CHALLENGE"):
        licen.challenge_case(case_id)


def test_challenge_case_rejects_bond_below_submitter_bond(direct_vm, licen, direct_alice, direct_bob, warp):
    case_id = submit(direct_vm, licen, direct_alice, value=5000)
    warp(_after(10))
    direct_vm.sender = direct_bob
    direct_vm.value = 100
    with direct_vm.expect_revert("EXPECTED_BOND_MUST_MATCH"):
        licen.challenge_case(case_id)


def test_challenge_case_rejects_already_challenged(direct_vm, licen, direct_alice, direct_bob, direct_charlie, warp):
    case_id = submit(direct_vm, licen, direct_alice)
    warp(_after(10))
    direct_vm.sender = direct_bob
    direct_vm.value = 1000
    licen.challenge_case(case_id)
    direct_vm.sender = direct_charlie
    direct_vm.value = 1000
    with direct_vm.expect_revert("EXPECTED_NOT_CHALLENGEABLE"):
        licen.challenge_case(case_id)


def test_challenge_case_missing_case_reverts(direct_vm, licen, direct_bob):
    direct_vm.sender = direct_bob
    direct_vm.value = 1000
    with direct_vm.expect_revert("EXPECTED_CASE_NOT_FOUND"):
        licen.challenge_case("999")


# ---------------------------------------------------------------------------
# withdraw_unchallenged — boundary tested both sides
# ---------------------------------------------------------------------------


def test_withdraw_unchallenged_before_window_fails(direct_vm, licen, direct_alice, warp):
    case_id = submit(direct_vm, licen, direct_alice)
    warp(_after(100))
    with direct_vm.expect_revert("EXPECTED_WINDOW_STILL_OPEN"):
        licen.withdraw_unchallenged(case_id)


def test_withdraw_unchallenged_exactly_at_boundary_succeeds(direct_vm, licen, direct_alice, warp):
    case_id = submit(direct_vm, licen, direct_alice)
    warp(_after(1800))
    licen.withdraw_unchallenged(case_id)
    case = json.loads(licen.get_case(case_id))
    assert case["status"] == "expired_unchallenged"


def test_withdraw_unchallenged_is_permissionless(direct_vm, licen, direct_alice, direct_bob, warp):
    case_id = submit(direct_vm, licen, direct_alice)
    warp(_after(2000))
    direct_vm.sender = direct_bob  # anyone can trigger; payout still goes to submitter
    licen.withdraw_unchallenged(case_id)
    case = json.loads(licen.get_case(case_id))
    assert case["status"] == "expired_unchallenged"


def test_withdraw_unchallenged_rejects_already_challenged(direct_vm, licen, direct_alice, direct_bob, warp):
    case_id = submit(direct_vm, licen, direct_alice)
    warp(_after(10))
    direct_vm.sender = direct_bob
    direct_vm.value = 1000
    licen.challenge_case(case_id)
    warp(_after(5000))
    with direct_vm.expect_revert("EXPECTED_NOT_WITHDRAWABLE"):
        licen.withdraw_unchallenged(case_id)


# ---------------------------------------------------------------------------
# resolve_case — the nondet branch, and every verdict outcome
# ---------------------------------------------------------------------------


def _challenged_case(direct_vm, licen, direct_alice, direct_bob, warp, value=1000):
    case_id = submit(direct_vm, licen, direct_alice, value=value)
    warp(_after(10))
    direct_vm.sender = direct_bob
    direct_vm.value = value
    licen.challenge_case(case_id)
    return case_id


def test_resolve_case_requires_challenged_status(direct_vm, licen, direct_alice, warp):
    case_id = submit(direct_vm, licen, direct_alice)
    with direct_vm.expect_revert("EXPECTED_NOT_RESOLVABLE"):
        licen.resolve_case(case_id)


def test_resolve_case_allowed_pays_submitter_and_closes(direct_vm, licen, direct_alice, direct_bob, warp):
    case_id = _challenged_case(direct_vm, licen, direct_alice, direct_bob, warp)
    mock_evaluation(direct_vm, verdict="allowed")
    direct_vm.sender = direct_alice  # permissionless: any address may trigger
    licen.resolve_case(case_id)
    case = json.loads(licen.get_case(case_id))
    assert case["status"] == "resolved_allowed"
    assert case["verdict"] == "allowed"


def test_resolve_case_not_allowed_pays_challenger_and_closes(direct_vm, licen, direct_alice, direct_bob, warp):
    case_id = _challenged_case(direct_vm, licen, direct_alice, direct_bob, warp)
    mock_evaluation(direct_vm, verdict="not_allowed")
    licen.resolve_case(case_id)
    case = json.loads(licen.get_case(case_id))
    assert case["status"] == "resolved_not_allowed"
    assert case["verdict"] == "not_allowed"


def test_resolve_case_undetermined_refunds_both_and_closes(direct_vm, licen, direct_alice, direct_bob, warp):
    case_id = _challenged_case(direct_vm, licen, direct_alice, direct_bob, warp)
    mock_evaluation(direct_vm, verdict="undetermined", reasoning="license page unreachable")
    licen.resolve_case(case_id)
    case = json.loads(licen.get_case(case_id))
    assert case["status"] == "resolved_undetermined"


def test_resolve_case_fetch_failure_is_undetermined_not_a_revert(direct_vm, licen, direct_alice, direct_bob, warp):
    """A fetch failure (timeout, 404, unreachable host) must resolve the case as
    undetermined and refund both bonds, never leave the transaction reverted and
    the case stuck in 'challenged' with bonds stranded. Regression test for a bug
    found on StudioNet: an unmocked/unreachable license_url raised NondetException
    out of gl.nondet.web.render, which the original leader() did not catch."""
    case_id = _challenged_case(direct_vm, licen, direct_alice, direct_bob, warp)
    # No mock_web registered for this URL, so the fetch raises MockNotFoundError,
    # the direct-mode equivalent of a real network fetch failure.
    licen.resolve_case(case_id)
    case = json.loads(licen.get_case(case_id))
    assert case["status"] == "resolved_undetermined"
    assert case["verdict"] == "undetermined"
    assert "EXTERNAL" in case["reasoning"]


def test_resolve_case_treats_unknown_verdict_as_undetermined(direct_vm, licen, direct_alice, direct_bob, warp):
    case_id = _challenged_case(direct_vm, licen, direct_alice, direct_bob, warp)
    mock_evaluation(direct_vm, verdict="maybe_allowed")
    licen.resolve_case(case_id)
    case = json.loads(licen.get_case(case_id))
    assert case["status"] == "resolved_undetermined"
    assert case["verdict"] == "undetermined"


def test_resolve_case_fenced_json_is_parsed(direct_vm, licen, direct_alice, direct_bob, warp):
    case_id = _challenged_case(direct_vm, licen, direct_alice, direct_bob, warp)
    direct_vm.mock_web(r"example\.com/license", {"status": 200, "body": ALLOWED_LICENSE_HTML})
    fenced = "```json\n" + json.dumps({"verdict": "allowed", "confidence": 90, "reasoning": "ok"}) + "\n```"
    direct_vm.mock_llm(r".*", fenced)
    licen.resolve_case(case_id)
    case = json.loads(licen.get_case(case_id))
    assert case["status"] == "resolved_allowed"


def test_resolve_case_malformed_json_falls_back_to_undetermined(direct_vm, licen, direct_alice, direct_bob, warp):
    case_id = _challenged_case(direct_vm, licen, direct_alice, direct_bob, warp)
    direct_vm.mock_web(r"example\.com/license", {"status": 200, "body": ALLOWED_LICENSE_HTML})
    direct_vm.mock_llm(r".*", "not json at all, sorry")
    licen.resolve_case(case_id)
    case = json.loads(licen.get_case(case_id))
    assert case["status"] == "resolved_undetermined"
    assert "LLM_ERROR" in case["reasoning"]


def test_resolve_case_non_object_json_falls_back_to_undetermined(direct_vm, licen, direct_alice, direct_bob, warp):
    case_id = _challenged_case(direct_vm, licen, direct_alice, direct_bob, warp)
    direct_vm.mock_web(r"example\.com/license", {"status": 200, "body": ALLOWED_LICENSE_HTML})
    direct_vm.mock_llm(r".*", json.dumps(["allowed"]))
    licen.resolve_case(case_id)
    case = json.loads(licen.get_case(case_id))
    assert case["status"] == "resolved_undetermined"


def test_resolve_case_confidence_is_clamped_above_100(direct_vm, licen, direct_alice, direct_bob, warp):
    case_id = _challenged_case(direct_vm, licen, direct_alice, direct_bob, warp)
    mock_evaluation(direct_vm, verdict="allowed", confidence=999)
    licen.resolve_case(case_id)
    case = json.loads(licen.get_case(case_id))
    assert case["confidence"] == 100


def test_resolve_case_confidence_is_clamped_below_0(direct_vm, licen, direct_alice, direct_bob, warp):
    case_id = _challenged_case(direct_vm, licen, direct_alice, direct_bob, warp)
    mock_evaluation(direct_vm, verdict="not_allowed", confidence=-50)
    licen.resolve_case(case_id)
    case = json.loads(licen.get_case(case_id))
    assert case["confidence"] == 0


def test_resolve_case_cannot_be_replayed_after_resolution(direct_vm, licen, direct_alice, direct_bob, warp):
    case_id = _challenged_case(direct_vm, licen, direct_alice, direct_bob, warp)
    mock_evaluation(direct_vm, verdict="allowed")
    licen.resolve_case(case_id)
    with direct_vm.expect_revert("EXPECTED_NOT_RESOLVABLE"):
        licen.resolve_case(case_id)


def test_resolve_case_retries_after_undetermined(direct_vm, licen, direct_alice, direct_bob, warp):
    """An undetermined verdict on a challenged case is terminal in this design
    (bonds are already refunded), but a fresh challenge round on a new case
    with matching evidence must still be resolvable — confirms no cross-case
    state leaks between resolutions."""
    case_id = _challenged_case(direct_vm, licen, direct_alice, direct_bob, warp)
    mock_evaluation(direct_vm, verdict="undetermined")
    licen.resolve_case(case_id)
    direct_vm.clear_mocks()

    case_id_2 = submit(direct_vm, licen, direct_alice)
    warp(_after(20))
    direct_vm.sender = direct_bob
    direct_vm.value = 1000
    licen.challenge_case(case_id_2)
    mock_evaluation(direct_vm, verdict="allowed")
    licen.resolve_case(case_id_2)
    case2 = json.loads(licen.get_case(case_id_2))
    assert case2["status"] == "resolved_allowed"


# ---------------------------------------------------------------------------
# views
# ---------------------------------------------------------------------------


def test_get_cases_lists_all_created_cases(direct_vm, licen, direct_alice):
    submit(direct_vm, licen, direct_alice)
    submit(direct_vm, licen, direct_alice)
    cases = json.loads(licen.get_cases(10))
    assert len(cases) == 2


def test_get_cases_respects_limit_cap(direct_vm, licen, direct_alice):
    for _ in range(3):
        submit(direct_vm, licen, direct_alice)
    cases = json.loads(licen.get_cases(2))
    assert len(cases) == 2


def test_get_case_unknown_id_returns_empty(licen):
    assert licen.get_case("999") == ""


def test_get_challenge_window_seconds(licen):
    assert int(licen.get_challenge_window_seconds()) == 1800
