"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { P } from "@/components/common/typography";
import Button from "@/components/common/button/button.component";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

const AdminLogin = () => {
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get redirect path from URL params, default to /admin
  const redirectPath = searchParams?.get("redirect") || "/admin";

  useEffect(() => {
    // Check if already authenticated using the new API
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/admin/verify");
        if (response.ok) {
          // User is already authenticated, redirect to intended page
          router.push(redirectPath);
        }
      } catch {
        // Not authenticated, stay on login page
        console.log("Not authenticated, staying on login page");
      }
    };

    checkAuth();
  }, [router, redirectPath]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success("Login successful!");
        // Redirect to the intended page (from redirect param or default to /admin)
        router.push(redirectPath);
      } else {
        const errorMessage = data.error || "Invalid credentials";
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error("Login error:", error);
      const errorMessage = "Login failed. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <motion.div
        className="max-w-md w-full bg-white rounded-lg shadow-md p-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center mb-8">
          <h1
            className="text-2xl font-moon font-bold"
            style={{ color: "#68191E" }}
          >
            HIMSPIRED
          </h1>
          <P className="text-gray-600 mt-2">Admin Dashboard</P>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <input
              type="text"
              placeholder="Username"
              value={credentials.username}
              onChange={(e) =>
                setCredentials({
                  ...credentials,
                  username: e.target.value,
                })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#68191E] focus:border-transparent"
              required
              disabled={loading}
            />
          </div>

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={credentials.password}
              onChange={(e) =>
                setCredentials({
                  ...credentials,
                  password: e.target.value,
                })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#68191E] focus:border-transparent pr-12"
              required
              disabled={loading}
            />
            <button
              type="button"
              tabIndex={-1}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 focus:outline-none"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <P className="text-red-600 text-sm">{error}</P>
            </div>
          )}

          <Button
            type="submit"
            btnTitle={loading ? "Signing In..." : "Sign In"}
            loading={loading}
            disabled={loading}
            className="w-full bg-[#68191E] hover:bg-[#5a1519] rounded-lg"
          />
        </form>

        <div className="mt-6 text-center">
          <P className="text-xs text-gray-500">
            Secure admin access with JWT authentication
          </P>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
