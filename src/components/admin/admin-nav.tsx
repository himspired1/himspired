"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Package, MessageCircle, LogOut, Menu } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

const AdminNav = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { href: "/admin/orders", label: "Orders", icon: Package },
    { href: "/admin/messages", label: "Messages", icon: MessageCircle },
    { href: "/admin/delivery-fees", label: "Delivery Fees", icon: Package },
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
    <nav className="bg-white shadow-sm border-b border-gray-200 px-4 py-3 sm:px-6 sm:py-4">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between">
        <div className="w-full flex items-center justify-between sm:justify-start">
          <Link href="/admin" className="text-xl font-bold text-[#68191E]">
            HIMSPIRED Admin
          </Link>
          {/* Hamburger for mobile */}
          <button
            className="sm:hidden ml-2 p-2 rounded-md text-gray-600 hover:text-gray-900 focus:outline-none"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
        {/* Nav links and logout - mobile: hidden unless open, desktop: always visible */}
        <div
          className={`w-full sm:w-auto ${
            menuOpen ? "block" : "hidden"
          } sm:flex sm:items-center sm:space-x-6 mt-3 sm:mt-0`}
        >
          <div className="flex flex-col sm:flex-row sm:space-x-6 space-y-2 sm:space-y-0">
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
                  onClick={() => setMenuOpen(false)}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            {/* Logout button - inside dropdown on mobile, separate on desktop */}
            <button
              onClick={logout}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors sm:hidden"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
        {/* Logout button - desktop only */}
        <button
          onClick={logout}
          className="hidden sm:flex items-center space-x-2 text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </nav>
  );
};

export default AdminNav;
