"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";
import { Separator } from "@/components/ui/separator";

type NavItem = {
  label: string;
  href: string;
};

function NavLink({ href, label }: NavItem) {
  const pathname = usePathname();
  const active = pathname === href;

  return (
    <Link
      href={href}
      className={[
        "block rounded-lg px-3 py-2 text-sm transition",
        active
          ? "bg-slate-900 text-white"
          : "text-slate-700 hover:bg-slate-100",
      ].join(" ")}
    >
      {label}
    </Link>
  );
}

export default function AppShell({
  title,
  nav,
  children,
}: {
  title: string;
  nav: NavItem[];
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="w-64 border-r border-slate-200 p-4 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Image
              src="/brand/cfv-logo.png"
              alt="CFV"
              width={40}
              height={40}
              className="h-10 w-10 object-contain"
              priority
            />
            <div className="leading-tight">
              <div className="font-semibold">Plataforma CFV</div>
              <div className="text-xs text-slate-500">{title}</div>
            </div>
          </div>

          <Separator />

          <nav className="flex flex-col gap-1">
            {nav.map((item) => (
              <NavLink key={item.href} {...item} />
            ))}
          </nav>

          <div className="mt-auto">
            <Separator className="mb-3" />
            <LogoutButton />
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1">
          <header className="border-b border-slate-200">
            <div className="px-6 py-4">
              <h1 className="text-lg font-semibold">{title}</h1>
            </div>
          </header>
          <div className="px-6 py-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
