"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", label: "Parks" },
  { href: "/map", label: "Map" },
  { href: "/profile", label: "Profile" },
] as const;

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function TabNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="bg-background fixed inset-x-0 bottom-0 border-t border-black/10 pb-[env(safe-area-inset-bottom)] sm:static sm:border-t-0 sm:border-b sm:pb-0 dark:border-white/15"
    >
      <ul className="mx-auto flex max-w-3xl">
        {tabs.map((tab) => {
          const active = isActive(pathname, tab.href);
          return (
            <li key={tab.href} className="flex-1 sm:flex-none">
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`flex h-14 items-center justify-center px-4 text-sm font-medium ${
                  active ? "text-foreground" : "text-foreground/60"
                }`}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
