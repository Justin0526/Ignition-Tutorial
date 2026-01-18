import Sidebar from "@/components/Sidebar"

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />

      {/* Main area accounts for sidebar width on lg+ */}
      <main className="min-h-screen lg:ml-72">
        {/* This container centers content in the space to the right of the sidebar */}
        <div className="mx-auto max-w-6xl px-6 py-10 lg:px-10">
          {children}
        </div>
      </main>
    </div>
  )
}
