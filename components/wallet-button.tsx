"use client";

import { Download, KeyRound, LogOut, PlugZap, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/lib/wallet";
import { shortAddress } from "@/lib/utils";

export function WalletButton() {
  const { address, mode, connectInjected, ensureBrowserWallet, exportPrivateKey, importPrivateKey, disconnect } =
    useWallet();

  async function onImport() {
    const value = window.prompt("Paste your exported Licen browser private key");
    if (value) importPrivateKey(value.trim());
  }

  return (
    <div className="flex w-full flex-col gap-2 sm:w-56">
      {address ? (
        <div className="rounded-md border border-noir-400/30 bg-noir-900 px-3 py-2 text-xs leading-relaxed">
          <div className="text-noir-400">{mode === "injected" ? "Injected wallet" : "Browser wallet"}</div>
          <div className="font-mono text-noir-100">{shortAddress(address)}</div>
        </div>
      ) : (
        <div className="rounded-md border border-noir-400/20 bg-noir-900/70 px-3 py-2 text-xs text-noir-200">
          Not connected - reads still work
        </div>
      )}
      <Button className="w-full justify-start" size="sm" variant="outline" onClick={connectInjected}>
        <PlugZap className="h-3.5 w-3.5" /> Injected
      </Button>
      <Button className="w-full justify-start" size="sm" variant="secondary" onClick={ensureBrowserWallet}>
        <KeyRound className="h-3.5 w-3.5" /> Browser wallet
      </Button>
      {mode === "browser" ? (
        <>
          <Button className="w-full justify-start" size="sm" variant="ghost" onClick={exportPrivateKey}>
            <Download className="h-3.5 w-3.5" /> Export
          </Button>
          <Button className="w-full justify-start" size="sm" variant="ghost" onClick={onImport}>
            <Upload className="h-3.5 w-3.5" /> Import
          </Button>
        </>
      ) : null}
      {address ? (
        <Button className="w-full justify-start" size="sm" variant="danger" onClick={disconnect}>
          <LogOut className="h-3.5 w-3.5" /> Disconnect
        </Button>
      ) : null}
    </div>
  );
}
