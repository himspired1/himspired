"use client";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { SanityImageComponent } from "@/components/sanity/image";
import { P } from "@/components/common/typography";
import {
  addItem,
  CartItem,
  selectCartItemQuantity,
} from "@/redux/slices/cartSlice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { toast } from "sonner";
import { SessionManager } from "@/lib/session";
import { useProductReservation } from "@/hooks/useProductReservation";
import { CACHE_KEYS } from "@/lib/cache-constants";

interface ProductProps extends Product {
  className?: string;
  delay?: number;
}

const ProductCard = ({
  title,
  className = "",
  category,
  price,
  mainImage,
  _id,
  delay,
  size,
  slug,
  stock,
}: ProductProps) => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [showSizes, setShowSizes] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);
  const [availabilityMessage, setAvailabilityMessage] = useState("Available");
  const [addedToCart, setAddedToCart] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Real-time stock display
  const [currentStock, setCurrentStock] = useState(stock || 0);
  const [stockMessage, setStockMessage] = useState<string>("");
  const [lastKnownStock, setLastKnownStock] = useState(stock || 0);

  // Get cart quantity for products without sizes
  const cartQuantity = useAppSelector((state) =>
    selectCartItemQuantity(state, _id, size?.[0] || "")
  );

  // Get all cart items for this product to calculate size quantities
  const cartItems = useAppSelector((state) =>
    state.persistedReducer.cart.items.filter(
      (item) => item.originalProductId === _id
    )
  );

  // Memoized size quantities to prevent unnecessary rerenders
  const sizeQuantities = useMemo(() => {
    const quantities: Record<string, number> = {};
    if (size) {
      size.forEach((sizeOption) => {
        const item = cartItems.find((item) => item.size === sizeOption);
        quantities[sizeOption] = item ? item.quantity : 0;
      });
    }
    return quantities;
  }, [cartItems, size]);

  // Check product availability from server
  const checkAvailability = useCallback(async () => {
    const sessionId = SessionManager.getSessionId();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    try {
      const response = await fetch(
        `/api/products/availability/${_id}?sessionId=${sessionId}`,
        { signal: controller.signal }
      );
      const availability = await response.json();
      if (availability.error) {
        console.error("Availability check error:", availability.error);
        setIsAvailable(true); // Default to available for other errors
        setAvailabilityMessage("Available");
      } else {
        setIsAvailable(availability.available);
        setAvailabilityMessage(availability.message);
      }
    } catch (error: unknown) {
      if (
        error &&
        typeof error === "object" &&
        "name" in error &&
        error.name === "AbortError"
      ) {
        // Timeout occurred
        setIsAvailable(false);
        setAvailabilityMessage(
          "Product may be reserved by another user (timeout)"
        );
      } else {
        console.error("Error checking availability:", error);
        setIsAvailable(true); // Default to available if check fails
        setAvailabilityMessage("Available");
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }, [_id, title]);

  // Fetch real-time stock from Sanity
  const fetchRealTimeStock = useCallback(async () => {
    try {
      const sessionId = SessionManager.getSessionId() || "unknown";
      const response = await fetch(
        `/api/products/stock/${_id}?sessionId=${sessionId}`
      );
      if (response.ok) {
        const data = await response.json();
        const newStock = data.stock || 0;
        const availableStock = data.availableStock || 0;
        const reservedByCurrentUser = data.reservedByCurrentUser || 0;
        const reservedByOthers = data.reservedByOthers || 0;

        setCurrentStock(newStock);
        setLastKnownStock(newStock);

        // Use the enhanced stock message from API
        setStockMessage(data.stockMessage || "");

        // Update availability based on available stock
        if (availableStock <= 0) {
          setIsAvailable(false);
          setAvailabilityMessage("Out of stock");
        } else {
          setIsAvailable(true);
          setAvailabilityMessage("Available");
        }
      }
    } catch (error) {
      console.error("Error fetching real-time stock:", error);
    }
  }, [_id, title, lastKnownStock]);

  // Success callback for reservation
  const handleReservationSuccess = useCallback(async () => {
    // Update availability after successful reservation
    await checkAvailability();
    await fetchRealTimeStock();
  }, [checkAvailability, fetchRealTimeStock]);

  // Product reservation hook
  const { reserveProduct, isReserving } = useProductReservation({
    productId: _id,
    onReservationSuccess: handleReservationSuccess,
  });

  // Update stock display based on availability and real-time data
  useEffect(() => {
    if (stock !== undefined) {
      setCurrentStock(stock);
      // Don't set fallback stock message here - rely on API data for accurate reservation status
    }
  }, [stock, isAvailable, availabilityMessage]);

  // Fetch real-time stock when availability changes
  useEffect(() => {
    if (isAvailable) {
      fetchRealTimeStock();

      // Also fetch after a short delay to catch any recent changes
      const immediateRefresh = setTimeout(fetchRealTimeStock, 2000);

      return () => clearTimeout(immediateRefresh);
    }
  }, [isAvailable, _id, fetchRealTimeStock]);

  // Poll for stock updates every 30 seconds to catch cart changes (reduced from 5 seconds for better performance)
  useEffect(() => {
    if (isAvailable) {
      const interval = setInterval(() => {
        fetchRealTimeStock();
      }, 30000); // Poll every 30 seconds for better performance

      // Listen for cart changes from other tabs
      const handleStorageChange = (event: StorageEvent) => {
        if (
          event.key === CACHE_KEYS.CART_SYNC ||
          event.key === CACHE_KEYS.STOCK_UPDATE
        ) {
          // Refetch stock when cart changes or stock updates
          fetchRealTimeStock();
        }
      };

      // Listen for visibility changes to refresh stock when tab becomes active
      const handleVisibilityChange = () => {
        if (!document.hidden) {
          fetchRealTimeStock();
        }
      };

      // Listen for window focus to refresh stock when user switches back to tab
      const handleWindowFocus = () => {
        fetchRealTimeStock();
      };

      window.addEventListener("storage", handleStorageChange);
      document.addEventListener("visibilitychange", handleVisibilityChange);
      window.addEventListener("focus", handleWindowFocus);

      return () => {
        clearInterval(interval);
        window.removeEventListener("storage", handleStorageChange);
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange
        );
        window.removeEventListener("focus", handleWindowFocus);
      };
    }
  }, [isAvailable, fetchRealTimeStock]);

  // Initialize session and check availability
  useEffect(() => {
    SessionManager.refreshSessionIfNeeded();
    checkAvailability();

    // Also fetch stock immediately when component mounts
    if (isAvailable) {
      fetchRealTimeStock();
    }
  }, [_id, checkAvailability, isAvailable, fetchRealTimeStock]);

  const handleAddToCart = async (selectedSize?: string) => {
    // Check if product is available (this includes out of stock check)
    if (!isAvailable) {
      toast.error(availabilityMessage);
      return;
    }

    // Get current cart quantity for this specific product and size
    const currentSize = selectedSize || size?.[0] || "";
    const currentCartQuantity = sizeQuantities[currentSize] || 0;

    // Use the custom hook for reservation
    const reservationResult = await reserveProduct(
      currentCartQuantity,
      selectedSize || size?.[0] || ""
    );

    if (!reservationResult) {
      return; // Reservation failed, error already handled by hook
    }

    // Fixed: Updated to match new CartItem interface
    const data: Omit<
      CartItem,
      "quantity" | "originalPrice" | "originalProductId"
    > = {
      _id: _id,
      title: title,
      category: category,
      mainImage: mainImage,
      price: price,
      size: selectedSize || size?.[0] || "",
      stock: stock || 0, // Include stock information
      reservationId: reservationResult?.reservationId, // Include reservation ID
    };

    dispatch(addItem(data));

    // Show feedback animation
    setAddedToCart(selectedSize || "default");
    setTimeout(() => setAddedToCart(null), 1500);
  };

  useEffect(() => {
    const handleClickOutside = (event: globalThis.MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        setShowSizes(false);
      }
    };

    if (showSizes) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSizes]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/shop/${_id}/${slug?.current}`);
  };

  // Reusable function for button styling
  const getButtonClassName = (
    isAvailable: boolean,
    isReserving: boolean,
    addedToCart: string | null,
    sizeOption?: string,
    isSizeButton: boolean = false
  ): string => {
    const isSelected = sizeOption
      ? addedToCart === sizeOption
      : addedToCart === "default";

    let baseClasses = "";

    if (!isAvailable) {
      baseClasses = "bg-gray-300 cursor-not-allowed";
      if (isSizeButton) baseClasses += " text-gray-500";
    } else if (isReserving) {
      baseClasses = "bg-blue-100 border-2 border-blue-500 cursor-wait";
      if (isSizeButton) baseClasses += " text-blue-700";
    } else if (isSelected) {
      baseClasses = "bg-green-100 border-2 border-green-500 cursor-pointer";
      if (isSizeButton) baseClasses += " text-green-700";
    } else {
      baseClasses = "bg-[#F4F4F4] hover:bg-[#E0E0E0] cursor-pointer";
      if (isSizeButton) baseClasses += " hover:bg-[#DADADA] text-[#1E1E1E]";
    }

    return baseClasses;
  };

  return (
    <AnimatePresence>
      <motion.div
        ref={cardRef}
        onClick={handleClick}
        className={`${className} mb-[70px] cursor-pointer hover:scale-[1.05] duration-700 transition`}
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        transition={{ duration: 0.5, delay }}
      >
        <div className="w-full flex items-center justify-center">
          <SanityImageComponent
            alt={title}
            image={mainImage || "/placeholder.svg"}
            width={150}
            height={150}
          />
        </div>

        <div className="w-full mt-[38px]">
          <P
            fontFamily="activo"
            className="text-[10px] font-normal uppercase text-[#1E1E1E80] text-center font-activo"
          >
            {category}
          </P>
          <P
            fontFamily="activo"
            className="text-xs md:text-base font-normal uppercase text-[#000] text-center font-activo mt-[8px]"
          >
            {title}
          </P>
          <P
            fontFamily="activo"
            className="text-xs md:text-base font-normal uppercase text-[#000] text-center font-activo mt-[8px]"
          >
            ₦{price.toLocaleString()}
          </P>
        </div>

        <div className="w-full flex flex-col items-center gap-3 justify-center mt-[26px]">
          {/* Stock Status */}
          {stockMessage && (
            <div
              className={`flex items-center gap-2 text-xs ${
                currentStock <= 0
                  ? "text-red-600"
                  : currentStock <= 3
                    ? "text-orange-600"
                    : "text-green-600"
              }`}
            >
              <span className="font-medium">{stockMessage}</span>
            </div>
          )}

          {/* Availability Status - Hidden, only show in toast */}
          {/* {!isAvailable && (
            <div className="flex items-center gap-2 text-xs text-red-600">
              <AlertCircle size={12} />
              <span>{availabilityMessage}</span>
            </div>
          )} */}

          {!showSizes && (
            <motion.div
              whileHover={{ scale: isAvailable ? 1.1 : 1 }}
              whileTap={{ scale: isAvailable ? 0.95 : 1 }}
              onClick={(e) => {
                e.stopPropagation();
                if (!isAvailable) {
                  toast.error(availabilityMessage);
                  return;
                }
                if (isReserving) {
                  toast.info("Reserving product...");
                  return;
                }
                if (!size?.length) {
                  // No sizes, add directly to cart
                  handleAddToCart();
                } else {
                  // Show size selection
                  setShowSizes(true);
                }
              }}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${getButtonClassName(
                isAvailable,
                isReserving,
                addedToCart,
                undefined,
                false
              )}`}
            >
              {isReserving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              ) : addedToCart === "default" ? (
                <Check size={14} color="#22c55e" />
              ) : (
                <Plus size={14} color="#1E1E1E" />
              )}
            </motion.div>
          )}

          {/* Show cart quantity if item is in cart (for products without sizes) */}
          {!size?.length && cartQuantity > 0 && (
            <P
              fontFamily="activo"
              className="text-xs text-[#68191E] font-medium"
            >
              In cart: {cartQuantity}
            </P>
          )}

          <AnimatePresence>
            {showSizes && (
              <motion.div
                className="flex gap-4 flex-wrap justify-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.4 }}
              >
                {size?.map((sizeOption) => {
                  // Use pre-calculated quantity from hook called at component level
                  const sizeCartQuantity = sizeQuantities[sizeOption] || 0;

                  return (
                    <motion.div
                      key={sizeOption}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isAvailable) {
                          toast.error(availabilityMessage);
                          return;
                        }
                        if (isReserving) {
                          toast.info("Reserving product...");
                          return;
                        }
                        handleAddToCart(sizeOption);
                        setShowSizes(false);
                      }}
                      className={`px-4 py-2 font-medium rounded-full flex flex-col items-center justify-center text-sm font-activo uppercase transition-all duration-300 ${getButtonClassName(
                        isAvailable,
                        isReserving,
                        addedToCart,
                        sizeOption,
                        true
                      )}`}
                      whileHover={{
                        scale: isAvailable && !isReserving ? 1.1 : 1,
                      }}
                      whileTap={{
                        scale: isAvailable && !isReserving ? 0.95 : 1,
                      }}
                    >
                      <span>{sizeOption}</span>
                      {sizeCartQuantity > 0 && (
                        <span className="text-xs text-[#68191E] font-medium">
                          ({sizeCartQuantity})
                        </span>
                      )}
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ProductCard;
