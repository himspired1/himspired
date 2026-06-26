"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { P, H } from "@/components/common/typography";
import { Package, Edit, Trash2, Save, X, Plus } from "lucide-react";
import AdminNav from "@/components/admin/admin-nav";
import { toast } from "sonner";
import { states } from "@/data/states";

interface StateDeliveryFee {
  _id?: string;
  state: string;
  deliveryFee: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface DeliveryFeesResponse {
  success: boolean;
  data: StateDeliveryFee[];
  total: number;
}

const AdminDeliveryFees = () => {
  const [fees, setFees] = useState<StateDeliveryFee[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingState, setEditingState] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ deliveryFee: 0, isActive: true });
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({
    state: "",
    deliveryFee: 1000,
    isActive: true,
  });
  const router = useRouter();

  const loadDeliveryFees = useCallback(async () => {
    try {
      const response = await fetch("/api/delivery-fees");
      if (response.status === 401) {
        router.push("/admin/login?redirect=/admin/delivery-fees");
        return;
      }

      const data: DeliveryFeesResponse = await response.json();
      if (data.success) {
        setFees(data.data);
      } else {
        toast.error("Failed to load delivery fees");
      }
    } catch (error) {
      console.error("Error loading delivery fees:", error);
      toast.error("Failed to load delivery fees");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    // Check authentication
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/admin/verify");
        if (!response.ok) {
          router.push("/admin/login?redirect=/admin/delivery-fees");
          return;
        }
        loadDeliveryFees();
      } catch (error) {
        console.error("Auth check failed:", error);
        router.push("/admin/login?redirect=/admin/delivery-fees");
      }
    };

    checkAuth();
  }, [router, loadDeliveryFees]);

  const handleEdit = (state: string) => {
    const fee = fees.find((f) => f.state === state);
    if (fee) {
      setEditingState(state);
      setEditForm({
        deliveryFee: fee.deliveryFee,
        isActive: fee.isActive,
      });
    }
  };

  const handleSave = async (state: string) => {
    try {
      const response = await fetch(
        `/api/delivery-fees/${encodeURIComponent(state)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(editForm),
        }
      );

      if (response.ok) {
        toast.success("Delivery fee updated successfully");
        setEditingState(null);
        loadDeliveryFees();

        // Clear frontend cache to force refresh
        if (typeof window !== "undefined") {
          // Clear localStorage cache
          localStorage.removeItem(`delivery_fee_${state.toLowerCase()}`);

          // Dispatch custom event to notify other components
          window.dispatchEvent(
            new CustomEvent("deliveryFeeUpdated", {
              detail: { state, fee: editForm.deliveryFee },
            })
          );
        }
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update delivery fee");
      }
    } catch (error) {
      console.error("Error updating delivery fee:", error);
      toast.error("Failed to update delivery fee");
    }
  };

  const handleDelete = async (state: string) => {
    if (
      !confirm(`Are you sure you want to delete the delivery fee for ${state}?`)
    ) {
      return;
    }

    try {
      const response = await fetch(
        `/api/delivery-fees/${encodeURIComponent(state)}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        toast.success("Delivery fee deleted successfully");
        loadDeliveryFees();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to delete delivery fee");
      }
    } catch (error) {
      console.error("Error deleting delivery fee:", error);
      toast.error("Failed to delete delivery fee");
    }
  };

  const handleAdd = async () => {
    if (!addForm.state) {
      toast.error("Please select a state");
      return;
    }

    try {
      const response = await fetch("/api/delivery-fees", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(addForm),
      });

      if (response.ok) {
        toast.success("Delivery fee added successfully");
        setShowAddForm(false);
        setAddForm({ state: "", deliveryFee: 1000, isActive: true });
        loadDeliveryFees();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to add delivery fee");
      }
    } catch (error) {
      console.error("Error adding delivery fee:", error);
      toast.error("Failed to add delivery fee");
    }
  };

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#68191E] mx-auto"></div>
          <P className="mt-4 text-gray-600">Loading delivery fees...</P>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50">
      <AdminNav />
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <H className="text-3xl mb-2 text-[#68191E]">State Delivery Fees</H>
            <P className="text-gray-600">
              Manage delivery fees for different Nigerian states
            </P>
          </div>

          {/* Add New Fee Button */}
          <div className="mb-6">
            <motion.button
              onClick={() => setShowAddForm(true)}
              className="bg-[#68191E] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#5a1519] transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Plus className="w-4 h-4" />
              Add New Fee
            </motion.button>
          </div>

          {/* Add Form */}
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg p-6 mb-6 shadow-sm"
            >
              <H className="text-lg mb-4">Add New Delivery Fee</H>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State
                  </label>
                  <select
                    value={addForm.state}
                    onChange={(e) =>
                      setAddForm({ ...addForm, state: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#68191E]"
                  >
                    <option value="">Select a state</option>
                    {states.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Delivery Fee (NGN)
                  </label>
                  <input
                    type="number"
                    value={addForm.deliveryFee}
                    onChange={(e) =>
                      setAddForm({
                        ...addForm,
                        deliveryFee: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#68191E]"
                    min="0"
                    max="10000"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={addForm.isActive}
                      onChange={(e) =>
                        setAddForm({ ...addForm, isActive: e.target.checked })
                      }
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Active</span>
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={handleAdd}
                      className="bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 transition-colors"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setShowAddForm(false)}
                      className="bg-gray-500 text-white px-3 py-2 rounded-md hover:bg-gray-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Fees Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="max-h-[60vh] overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                      State
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                      Delivery Fee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {fees.map((fee) => (
                    <motion.tr
                      key={fee.state}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <P className="text-sm font-medium text-gray-900">
                          {fee.state}
                        </P>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingState === fee.state ? (
                          <input
                            type="number"
                            value={editForm.deliveryFee}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                deliveryFee: parseInt(e.target.value) || 0,
                              })
                            }
                            className="w-24 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#68191E]"
                            min="0"
                            max="10000"
                          />
                        ) : (
                          <P className="text-sm text-gray-900">
                            {formatCurrency(fee.deliveryFee)}
                          </P>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingState === fee.state ? (
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={editForm.isActive}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  isActive: e.target.checked,
                                })
                              }
                              className="mr-2"
                            />
                            <span className="text-sm text-gray-700">
                              Active
                            </span>
                          </label>
                        ) : (
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              fee.isActive
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {fee.isActive ? "Active" : "Inactive"}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {editingState === fee.state ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSave(fee.state)}
                              className="text-green-600 hover:text-green-900"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingState(null)}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(fee.state)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(fee.state)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {fees.length === 0 && (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <P className="text-gray-500">No delivery fees configured yet.</P>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDeliveryFees;
