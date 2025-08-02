"use client";
import { P } from "@/components/common/typography";
import { states } from "@/data/states";
import { useDeliveryFee } from "@/hooks/useDeliveryFee";

import { RefreshCw } from "lucide-react";

interface StateSelectionProps {
  onStateChange: (state: string) => void;
  selectedState: string;
}

const StateSelection = ({
  onStateChange,
  selectedState,
}: StateSelectionProps) => {
  const { loading, error, setSelectedState } = useDeliveryFee();

  const handleRefresh = () => {
    // Force refresh by clearing and re-setting the state
    setSelectedState("");
    setTimeout(() => {
      setSelectedState(selectedState);
    }, 100);
  };

  return (
    <div className="w-full bg-white rounded-lg p-6 shadow-sm mb-6">
      <P fontFamily="activo" className="text-lg font-semibold mb-4">
        Select Your State
      </P>
      <P className="text-sm text-gray-600 mb-4">
        Choose your state to calculate delivery fees
      </P>

      <div className="w-full">
        <select
          value={selectedState}
          onChange={(e) => onStateChange(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#68191E] focus:border-transparent"
          disabled={loading}
        >
          <option value="">Select your state</option>
          {states.map((state) => (
            <option key={state} value={state}>
              {state}
            </option>
          ))}
        </select>

        {loading && (
          <P className="text-sm text-blue-600 mt-2">
            Calculating delivery fee...
          </P>
        )}

        {error && (
          <P className="text-sm text-red-600 mt-2">
            Error loading delivery fees. Please try again.
          </P>
        )}

        {selectedState && !loading && !error && (
          <div className="flex items-center justify-between mt-2">
            <P className="text-sm text-green-600">
              ✓ Delivery fee calculated for {selectedState}
            </P>
            <button
              onClick={handleRefresh}
              className="text-blue-600 hover:text-blue-800 p-1"
              title="Refresh delivery fee"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StateSelection;
