"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import AdminNav from "@/components/admin/admin-nav";

interface AdminUser {
  _id: string;
  username: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminUsersPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function fetchAdmins() {
    setLoading(true);
    const res = await fetch("/api/admin/users");
    if (res.ok) {
      const data = await res.json();
      setAdmins(data.admins);
    } else {
      toast.error("Failed to fetch admins");
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchAdmins();
  }, []);

  async function handleAddAdmin(e: React.FormEvent) {
    e.preventDefault();
    if (!username || !password) {
      toast.error("Username and password required");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (res.ok) {
      toast.success("Admin added");
      setUsername("");
      setPassword("");
      fetchAdmins();
    } else {
      const data = await res.json();
      toast.error(data.error || "Failed to add admin");
    }
    setLoading(false);
  }

  async function handleDeleteAdmin(id: string) {
    if (!confirm("Are you sure you want to delete this admin?")) return;
    setDeletingId(id);
    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Admin deleted");
      fetchAdmins();
    } else {
      const data = await res.json();
      toast.error(data.error || "Failed to delete admin");
    }
    setDeletingId(null);
  }

  return (
    <>
      <AdminNav />
      <div className="max-w-2xl mx-auto mt-12 bg-white p-8 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-6 text-center">Admin Users</h2>
        <form onSubmit={handleAddAdmin} className="mb-8 space-y-4">
          <div>
            <label className="block mb-1 font-medium">Username</label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Password</label>
            <input
              type="password"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            className="w-full bg-[#68191E] hover:bg-[#5a1519] text-white rounded-full py-2 font-semibold"
            disabled={loading}
          >
            {loading ? "Adding..." : "Add Admin"}
          </button>
        </form>
        <h3 className="text-lg font-semibold mb-2">All Admins</h3>
        <ul className="divide-y divide-gray-200">
          {admins.map((admin) => (
            <li
              key={admin._id}
              className="flex items-center justify-between py-3"
            >
              <span className="font-mono">{admin.username}</span>
              <button
                className="text-red-500 hover:text-red-700 text-sm px-2 py-1 rounded flex items-center justify-center min-w-[60px]"
                onClick={() => handleDeleteAdmin(admin._id)}
                disabled={!!deletingId || admin.username === "admin"}
                title={
                  admin.username === "admin"
                    ? "Cannot delete default admin"
                    : "Delete admin"
                }
              >
                {deletingId === admin._id ? (
                  <span className="inline-block w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  "Delete"
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
