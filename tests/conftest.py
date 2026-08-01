import os
import sys

import pytest

# Windows keeps the fd-0-injection temp file open across os.dup2, so the
# loader's os.unlink(path) fails with WinError 32. The message has already
# been copied into fd 0 by that point, so the temp file itself is disposable;
# swallow the removal failure instead of letting it fail every test.
_original_unlink = os.unlink


def _tolerant_unlink(path, *args, **kwargs):
    try:
        _original_unlink(path, *args, **kwargs)
    except PermissionError:
        pass


os.unlink = _tolerant_unlink


def warp_to(direct_vm, iso: str) -> None:
    """Advance the clock everywhere the contract can read it.

    direct_vm.warp() alone only patches datetime.now(); it never rewrites
    gl.message_raw['datetime'] or gl.message.raw['datetime'], which is what
    our contract actually reads via gl.message_raw.get("datetime", "").
    Without this bridge every cooldown/window test passes vacuously.
    """
    direct_vm.warp(iso)
    gl = sys.modules.get("genlayer.gl")
    if gl is None:
        return
    raw = getattr(gl, "message_raw", None)
    if isinstance(raw, dict):
        raw["datetime"] = iso
    nested = getattr(getattr(gl, "message", None), "raw", None)
    if isinstance(nested, dict):
        nested["datetime"] = iso


@pytest.fixture
def warp(direct_vm):
    def _warp(iso: str) -> None:
        warp_to(direct_vm, iso)

    return _warp
