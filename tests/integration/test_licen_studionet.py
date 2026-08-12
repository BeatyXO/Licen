import json
import time

import pytest
from gltest import get_contract_factory, get_accounts


@pytest.fixture(scope="module")
def accounts():
    return get_accounts()


@pytest.fixture(scope="module")
def licen_contract(accounts):
    factory = get_contract_factory("Licen")
    return factory.deploy(args=[], account=accounts[0], wait_interval=8000, wait_retries=90)


def test_submit_and_read_case(licen_contract):
    receipt = licen_contract.submit_case(
        args=[
            "Public dataset for a commercial summarizer",
            "https://raw.githubusercontent.com/huggingface/datasets/main/README.md",
            "https://raw.githubusercontent.com/huggingface/datasets/main/LICENSE",
            "Apache-2.0",
            "Fine-tune a commercial summarization model and sell API access to it.",
        ]
    ).transact(value=1, wait_interval=8000, wait_retries=90)
    assert receipt["status"] in (5, "ACCEPTED")

    count = licen_contract.get_case_count(args=[]).call()
    assert int(count) >= 1

    case = json.loads(licen_contract.get_case(args=[str(count)]).call())
    assert case["status"] == "open"
    assert case["submitter_bond"] == "1"


def test_challenge_and_resolve_reaches_consensus(licen_contract, accounts):
    challenger = licen_contract.connect(accounts[1])

    receipt = licen_contract.submit_case(
        args=[
            "Scraped news corpus for a commercial chatbot",
            "https://raw.githubusercontent.com/git/git/master/README.md",
            "https://raw.githubusercontent.com/git/git/master/COPYING",
            "GPL-2.0-only",
            "Train a closed-source commercial chatbot and sell subscriptions without releasing source.",
        ]
    ).transact(value=1, wait_interval=8000, wait_retries=90)
    assert receipt["status"] in (5, "ACCEPTED")

    case_id = str(int(licen_contract.get_case_count(args=[]).call()))

    challenge_receipt = challenger.challenge_case(
        args=[
            case_id,
            "https://www.gnu.org/licenses/old-licenses/gpl-2.0.txt",
            "The project license is GPL-2.0-only, which requires source availability when distributing modified copies.",
        ]
    ).transact(value=1, wait_interval=8000, wait_retries=90)
    assert challenge_receipt["status"] in (5, "ACCEPTED")

    case = json.loads(licen_contract.get_case(args=[case_id]).call())
    assert case["status"] == "challenged"

    resolve_receipt = licen_contract.resolve_case(args=[case_id]).transact(
        wait_interval=8000, wait_retries=90
    )
    assert resolve_receipt["status"] in (5, "ACCEPTED")

    resolved = None
    for _ in range(10):
        resolved = json.loads(licen_contract.get_case(args=[case_id]).call())
        if resolved["status"] != "challenged":
            break
        time.sleep(3)

    if resolved["status"] == "challenged":
        leader_receipt = resolve_receipt.get("consensus_data", {}).get(
            "leader_receipt", [{}]
        )[0]
        print("DIAGNOSTIC execution_result:", leader_receipt.get("execution_result"))
        print(
            "DIAGNOSTIC stdout:",
            leader_receipt.get("genvm_result", {}).get("stdout", "")[-2000:],
        )
        print(
            "DIAGNOSTIC stderr:",
            leader_receipt.get("genvm_result", {}).get("stderr", "")[-2000:],
        )

    assert resolved["status"] in (
        "resolved_allowed",
        "resolved_not_allowed",
        "resolved_undetermined",
    ), f"resolve_case reached ACCEPTED but case state never left 'challenged': {resolved}"
    assert resolved["verdict"] in ("allowed", "not_allowed", "undetermined")
