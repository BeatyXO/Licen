"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Copy, Download, KeyRound, LogOut, PlugZap, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/lib/wallet";
import { fetchAddressBalance } from "@/lib/genlayer";
import { shortAddress } from "@/lib/utils";

export function WalletButton() {
  const { address, mode, connectInjected, ensureBrowserWallet, exportPrivateKey, importPrivateKey, disconnect } =
    useWallet();
  const [isOpen, setIsOpen] = useState(false);
  const [balance, setBalance] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fetch balance whenever address changes.
  useEffect(() => {
    if (!address) { setBalance(null); return; }
    setBalance(null);
    let cancelled = false;
    fetchAddressBalance(address)
      .then((b) => { if (!cancelled) setBalance(b); })
      .catch(() => { if (!cancelled) setBalance("—"); });
    return () => { cancelled = true; };
  }, [address]);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setIsOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  function copyAddress() {
    if (!address) return;
    void navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function onImport() {
    const value = window.prompt("Paste your exported Licen browser private key");
    if (value) importPrivateKey(value.trim());
  }

  async function runAction(action: () => void | Promise<void>) {
    await action();
    setIsOpen(false);
  }

  return (
    <div ref={menuRef} className="relative w-full sm:w-auto">
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((v) => !v)}
        className="flex h-11 w-full items-center justify-between gap-3 rounded-md border border-noir-400/35 bg-noir-900/80 px-3 text-left text-sm text-noir-100 transition-colors hover:bg-noir-700/40 sm:w-64"
      >
        <span className="min-w-0">
          <span className="block text-xs text-noir-400">
            {address ? (mode === "injected" ? "Injected wallet" : "Browser wallet") : "Wallet"}
          </span>
          <span className="block truncate font-mono text-xs">
            {address ? shortAddress(address) : "Not connected"}
          </span>
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-noir-300 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen ? (
        <div className="absolute right-0 z-50 mt-2 flex w-full min-w-64 flex-col gap-2 rounded-md border border-noir-400/25 bg-noir-900 p-2 shadow-2xl shadow-black/35 sm:w-64">
          {address ? (
            <div className="rounded-md border border-noir-400/20 bg-noir-900/60 px-3 py-2 text-xs">
              <p className="font-mono text-noir-100 break-all">{address}</p>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-noir-400">
                  {balance === null ? "Loading…" : balance}
                  {balance !== null && balance !== "—" ? " (simulated)" : ""}
                </span>
                <button
                  type="button"
                  onClick={copyAddress}
                  className="flex items-center gap-1 text-noir-400 hover:text-noir-100"
                  title="Copy address"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-status-success" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>
              </div>
            </div>
          ) : null}

          <Button className="w-full justify-start" size="sm" variant="outline" onClick={() => runAction(connectInjected)}>
            <PlugZap className="h-3.5 w-3.5" /> Injected
          </Button>
          <Button className="w-full justify-start" size="sm" variant="secondary" onClick={() => runAction(ensureBrowserWallet)}>
            <KeyRound className="h-3.5 w-3.5" /> Browser wallet
          </Button>
          {mode === "browser" ? (
            <>
              <Button className="w-full justify-start" size="sm" variant="ghost" onClick={() => runAction(exportPrivateKey)}>
                <Download className="h-3.5 w-3.5" /> Export
              </Button>
              <Button className="w-full justify-start" size="sm" variant="ghost" onClick={() => runAction(onImport)}>
                <Upload className="h-3.5 w-3.5" /> Import
              </Button>
            </>
          ) : null}
          {address ? (
            <Button className="w-full justify-start" size="sm" variant="danger" onClick={() => runAction(disconnect)}>
              <LogOut className="h-3.5 w-3.5" /> Disconnect
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
