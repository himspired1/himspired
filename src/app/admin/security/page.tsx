"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/common/button/button.component";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

const AdminChangePassword = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("All fields are required.");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/security/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Password changed successfully. Please log in again.");
        router.push("/admin/login");
      } else {
        toast.error(data.error || "Failed to change password.");
      }
    } catch {
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 bg-white p-8 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6 text-center">
        Change Admin Password
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <label className="block mb-2 font-medium">Current Password</label>
            <input
              type={showCurrent ? "text" : "password"}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#68191E]"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <button
            type="button"
            tabIndex={-1}
            className="text-gray-400 hover:text-gray-700 focus:outline-none"
            onClick={() => setShowCurrent((prev) => !prev)}
            aria-label={showCurrent ? "Hide password" : "Show password"}
          >
            {showCurrent ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <label className="block mb-2 font-medium">New Password</label>
            <input
              type={showNew ? "text" : "password"}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#68191E]"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <button
            type="button"
            tabIndex={-1}
            className="text-gray-400 hover:text-gray-700 focus:outline-none"
            onClick={() => setShowNew((prev) => !prev)}
            aria-label={showNew ? "Hide password" : "Show password"}
          >
            {showNew ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <label className="block mb-2 font-medium">
              Confirm New Password
            </label>
            <input
              type={showConfirm ? "text" : "password"}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#68191E]"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <button
            type="button"
            tabIndex={-1}
            className="text-gray-400 hover:text-gray-700 focus:outline-none"
            onClick={() => setShowConfirm((prev) => !prev)}
            aria-label={showConfirm ? "Hide password" : "Show password"}
          >
            {showConfirm ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        </div>
        <Button
          btnTitle={loading ? "Changing..." : "Change Password"}
          className="w-full bg-[#68191E] hover:bg-[#5a1519] rounded-full"
          type="submit"
          loading={loading}
          disabled={loading}
        />
      </form>
    </div>
  );
};

export default AdminChangePassword;
