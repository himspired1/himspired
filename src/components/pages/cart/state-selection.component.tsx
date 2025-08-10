"use client";
import { P } from "@/components/common/typography";
import { states } from "@/data/states";
import { RefreshCw, ChevronDown, Search, X } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";

interface StateSelectionProps {
  onStateChange: (state: string) => void;
  selectedState: string;
  onRefresh: () => void;
}

const StateSelection = ({
  onStateChange,
  selectedState,
  onRefresh,
}: StateSelectionProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Sanitize state names for HTML ID attributes
  const sanitizeStateForId = (state: string): string => {
    return state
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-") // Replace non-alphanumeric chars with hyphens
      .replace(/-+/g, "-") // Replace multiple consecutive hyphens with single hyphen
      .replace(/^-|-$/g, ""); // Remove leading/trailing hyphens
  };

  const handleRefresh = () => {
    onRefresh();
  };

  const filteredStates = states.filter((state) =>
    state.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStateSelect = useCallback(
    (state: string) => {
      onStateChange(state);
      setIsOpen(false);
      setSearchTerm("");
      setHighlightedIndex(-1);
    },
    [onStateChange]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev < filteredStates.length - 1 ? prev + 1 : 0
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev > 0 ? prev - 1 : filteredStates.length - 1
          );
          break;
        case "Enter":
          e.preventDefault();
          if (highlightedIndex >= 0 && filteredStates[highlightedIndex]) {
            handleStateSelect(filteredStates[highlightedIndex]);
          }
          break;
        case "Escape":
          setIsOpen(false);
          setSearchTerm("");
          setHighlightedIndex(-1);
          break;
      }
    },
    [isOpen, filteredStates, highlightedIndex, handleStateSelect]
  );

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(e.target as Node)
    ) {
      setIsOpen(false);
      setSearchTerm("");
      setHighlightedIndex(-1);
    }
  }, []);

  useEffect(() => {
    // Only attach event listeners when dropdown is open
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.addEventListener("mousedown", handleClickOutside);
    }

    // Cleanup function to remove event listeners
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, handleKeyDown, handleClickOutside]);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setSearchTerm("");
      setHighlightedIndex(-1);
    }
  };

  return (
    <div className="w-full bg-white rounded-lg p-6 shadow-sm mb-6">
      <P fontFamily="activo" className="text-lg font-semibold mb-4">
        Select Your State
      </P>
      <P className="text-sm text-gray-600 mb-4">
        Choose your state to calculate delivery fees
      </P>

      <div className="w-full relative" ref={dropdownRef}>
        {/* Custom Dropdown Button */}
        <button
          type="button"
          onClick={toggleDropdown}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#68191E] focus:border-transparent bg-white text-left flex items-center justify-between hover:border-gray-400 transition-colors"
        >
          <span className={selectedState ? "text-gray-900" : "text-gray-500"}>
            {selectedState || "Select your state"}
          </span>
          <ChevronDown
            className={`w-5 h-5 text-gray-400 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-hidden">
            {/* Search Input */}
            <div className="p-3 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search states..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setHighlightedIndex(-1);
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#68191E] focus:border-transparent text-sm"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* States List */}
            <div
              role="listbox"
              aria-activedescendant={
                highlightedIndex >= 0 && filteredStates[highlightedIndex]
                  ? `state-option-${sanitizeStateForId(filteredStates[highlightedIndex])}`
                  : undefined
              }
              className="max-h-60 overflow-y-auto"
            >
              {filteredStates.length > 0 ? (
                filteredStates.map((state, index) => (
                  <button
                    key={state}
                    id={`state-option-${sanitizeStateForId(state)}`}
                    role="option"
                    aria-selected={state === selectedState}
                    type="button"
                    onClick={() => handleStateSelect(state)}
                    className={`w-full px-4 py-3 text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50 transition-colors ${
                      index === highlightedIndex
                        ? "bg-blue-50 border-l-4 border-blue-500"
                        : ""
                    } ${
                      state === selectedState
                        ? "bg-green-50 text-green-700 font-medium"
                        : "text-gray-900"
                    }`}
                  >
                    <div className="flex items-center">
                      {state === selectedState && (
                        <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mr-3">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                      )}
                      <span className="flex-1">{state}</span>
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-gray-500 text-center">
                  No states found matching &quot;{searchTerm}&quot;
                </div>
              )}
            </div>
          </div>
        )}

        {/* Selected State Display */}
        {selectedState && (
          <div className="flex items-center justify-between mt-2">
            <P className="text-sm text-green-600">
              ✓ State selected: {selectedState}
            </P>
            <button
              onClick={handleRefresh}
              className="text-blue-600 hover:text-blue-800 p-1 transition-colors"
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
