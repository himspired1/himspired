"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Package, MessageCircle, LogOut } from "lucide-react";
import { toast } from "sonner";

const AdminNav = () => {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { href: "/admin/orders", label: "Orders", icon: Package },
    { href: "/admin/messages", label: "Messages", icon: MessageCircle },
  ];

  const logout = async () => {
    try {
      const response = await fetch("/api/admin/auth", {
        method: "DELETE",
      });
      localStorage.removeItem("adminAuth");
      if (response.ok) {
        toast.success("Logged out successfully");
        router.push("/admin/login");
      } else {
        toast.error("Logout failed");
      }
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Logout failed");
    }
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link href="/admin" className="text-xl font-bold text-[#68191E]">
            HIMSPIRED Admin
          </Link>

          <div className="flex space-x-6">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    active
                      ? "bg-[#68191E] text-white"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        <button
          onClick={logout}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </nav>
  );
};

export default AdminNav;
