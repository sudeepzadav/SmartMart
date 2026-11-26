import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-white text-black border-0 rounded-lg">
      <Sidebar />
      <main  className="flex-1 overflow-x-auto p-8">{children}</main>
    </div>
  );
}
