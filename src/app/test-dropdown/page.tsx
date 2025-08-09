"use client";
import { useState } from "react";
import StateSelection from "@/components/pages/cart/state-selection.component";

export default function TestDropdownPage() {
  const [selectedState, setSelectedState] = useState("");
  const [deliveryFee, setDeliveryFee] = useState(0);

  const handleStateChange = (state: string) => {
    setSelectedState(state);
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

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-center mb-8 text-gray-800">
          Custom Dropdown Test
        </h1>

        <StateSelection
          onStateChange={handleStateChange}
          selectedState={selectedState}
          onRefresh={handleRefresh}
        />

        {selectedState && deliveryFee > 0 && (
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Delivery Fee Details</h2>
            <div className="space-y-2">
              <p>
                <strong>State:</strong> {selectedState}
              </p>
              <p>
                <strong>Delivery Fee:</strong> ₦
                {(deliveryFee / 1000).toFixed(1)}k
              </p>
            </div>
          </div>
        )}

        <div className="mt-8 text-center text-sm text-gray-600">
          <p>Test the dropdown functionality:</p>
          <ul className="mt-2 space-y-1">
            <li>• Click to open/close</li>
            <li>• Type to search states</li>
            <li>• Use arrow keys to navigate</li>
            <li>• Press Enter to select</li>
            <li>• Press Escape to close</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
