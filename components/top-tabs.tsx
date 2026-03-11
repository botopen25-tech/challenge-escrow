'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { href: '/', label: 'Home' },
  { href: '/create', label: 'Create' },
  { href: '/wagers', label: 'Wagers' },
];

export function TopTabs() {
  const pathname = usePathname();

  return (
    <nav className="inline-flex rounded-2xl border border-white/10 bg-white/5 p-1">
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={active
              ? 'rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-950'
              : 'rounded-xl px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white'}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
