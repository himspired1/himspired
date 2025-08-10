"use client";
import { useState, useEffect } from "react";
import StateSelection from "@/components/pages/cart/state-selection.component";

export default function TestDropdownPage() {
  const [selectedState, setSelectedState] = useState("");
  const [deliveryFee, setDeliveryFee] = useState(0);

  // Check localStorage on mount
  useEffect(() => {
    const storedState = localStorage.getItem("himspired_selected_state");
    if (storedState) {
      setSelectedState(storedState);
      // Auto-fetch delivery fee for stored state
      handleStateChange(storedState);
    }
  }, []);

  const handleStateChange = (state: string) => {
    setSelectedState(state);
    localStorage.setItem("himspired_selected_state", state);

    // Simulate fetching delivery fee
    if (state) {
      fetch(`/api/delivery-fees/${encodeURIComponent(state)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setDeliveryFee(data.data.deliveryFee);
          }
        })
        .catch((error) => {
          console.error("Error fetching delivery fee:", error);
          setDeliveryFee(0);
        });
    } else {
      setDeliveryFee(0);
    }
  };

  const handleRefresh = () => {
    if (selectedState) {
      handleStateChange(selectedState);
    }
  };

  const clearLocalStorage = () => {
    localStorage.removeItem("himspired_selected_state");
    setSelectedState("");
    setDeliveryFee(0);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-center mb-8 text-gray-800">
          Custom Dropdown Test
        </h1>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="font-semibold text-gray-800 mb-4">Current State</h3>
          <div className="text-sm text-gray-700 space-y-2">
            <p>
              <strong>Selected State:</strong>{" "}
              {selectedState || "None selected"}
            </p>
            <p>
              <strong>Delivery Fee:</strong> N{deliveryFee.toLocaleString()}
            </p>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Refresh
            </button>
            <button
              onClick={clearLocalStorage}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Clear localStorage
            </button>
          </div>
        </div>

        <StateSelection
          onStateChange={handleStateChange}
          selectedState={selectedState}
          onRefresh={handleRefresh}
        />
      </div>
    </div>
  );
}
