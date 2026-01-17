"use client"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"

type NavItem = {
  label: string
  href: string
  active?: boolean
}

export default function Sidebar() {
  const pathname = usePathname()
  const items: NavItem[] = [
    { label: "📊 Insights & Pulse", href: "/staff/insights" },
    { label: "📚 Tutorial Library", href: "/tutorial-library" },
    { label: "📱 App Screens", href: "/staff/app-screens" },
    { label: "➕ New Tutorial", href: "/staff/tutorials/new" },
  ]

  return (
    <aside className="fixed left-0 top-0 hidden h-screen w-72 shrink-0 border-r border-slate-200 bg-white lg:flex lg:flex-col">
      <div className="px-6 py-6">
        <div className="flex items-center gap-3">
          {/* OCBC Logo */}
          <Image
            src="/ocbc-logo.png"
            alt="OCBC Logo"
            width={32}
            height={32}
            className="rounded-md"
          />

          {/* Brand Text */}
          <div>
            <div className="text-sm font-semibold text-slate-900">OCBC Wise</div>
            <div className="text-xs font-medium tracking-wide text-slate-500">
              STAFF PORTAL
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable middle section if nav gets long */}
      <nav className="flex-1 overflow-y-auto px-4 py-2">
        <ul className="space-y-2">
          {items.map((it) => {
            const active = pathname.startsWith(it.href)
            return (
              <li key={it.href}>
                <Link
                  href={it.href}
                  className={[
                    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition",
                    active
                      ? "bg-red-50 text-red-600 ring-1 ring-red-100"
                      : "text-slate-500 hover:bg-slate-200 hover:text-black",
                  ].join(" ")}
                >
                  {it.label}
                  {active && (
                    <span className="ml-auto h-6 w-1 rounded-full bg-red-600" />
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer pinned to bottom */}
      <div className="mt-auto px-6 pb-6 pt-10">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700">
            JD
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-900">Jane Doe</div>
            <div className="text-xs font-medium text-slate-500">SERVICE MANAGER</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
