import { AdminPanel } from "@/components/admin/admin-panel"

export default function AdminPage() {
  return (
    <div className="container max-w-4xl py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      <AdminPanel />
    </div>
  )
}