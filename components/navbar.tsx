"use client";

import Link from "next/link";
import { ScrollText, FilePlus2, ShieldCheck } from "lucide-react";
import { WalletButton } from "@/components/wallet-button";

const links = [
  { href: "/cases", label: "Cases", icon: ScrollText },
  { href: "/cases/new", label: "Submit a case", icon: FilePlus2 },
];

export function Navbar() {
  return (
    <header className="border-b border-noir-400/15 bg-noir-900/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md border border-noir-400/70 bg-noir-400/15">
            <ShieldCheck className="h-5 w-5 text-noir-400" />
          </div>
          <div>
            <p className="text-lg font-black tracking-tight">Licen</p>
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-noir-400">license-use gate</p>
          </div>
        </Link>
        <nav className="flex flex-col gap-3 lg:ml-auto lg:flex-1 lg:flex-row lg:items-center">
          <div className="flex flex-wrap items-center gap-2">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm text-noir-200 hover:bg-noir-700/40 hover:text-noir-100"
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            ))}
          </div>
          <div className="lg:ml-auto">
            <WalletButton />
          </div>
        </nav>
      </div>
    </header>
  );
}
