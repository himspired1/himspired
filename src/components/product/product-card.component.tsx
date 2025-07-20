"use client";
import { useState, useEffect, useCallback, useRef } from "react";
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
  const [isReserving, setIsReserving] = useState(false);
  const [addedToCart, setAddedToCart] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Real-time stock display
  const [currentStock, setCurrentStock] = useState(stock || 0);
  const [stockMessage, setStockMessage] = useState("");

  // Get cart quantity for products without sizes
  const cartQuantity = useAppSelector((state) =>
    selectCartItemQuantity(state, _id, size?.[0] || "")
  );

  // Get cart quantities for all sizes
  const sizeQuantities = useAppSelector((state) => {
    const quantities: Record<string, number> = {};
    if (size) {
      size.forEach((sizeOption) => {
        quantities[sizeOption] = selectCartItemQuantity(state, _id, sizeOption);
      });
    }
    return quantities;
  });

  // Check product availability from server
  const checkAvailability = useCallback(async () => {
    try {
      const sessionId = SessionManager.getSessionId();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(
        `/api/products/availability/${_id}?sessionId=${sessionId}`,
        { signal: controller.signal }
      );

      clearTimeout(timeoutId);
      const availability = await response.json();

      if (availability.error) {
        console.error("Availability check error:", availability.error);
        // If it's a timeout or connection error, assume product might be reserved
        if (
          availability.error.includes("timeout") ||
          availability.error.includes("connection")
        ) {
          setIsAvailable(false);
          setAvailabilityMessage("Product may be reserved by another user");
        } else {
          setIsAvailable(true); // Default to available for other errors
          setAvailabilityMessage("Available");
        }
      } else {
        setIsAvailable(availability.available);
        setAvailabilityMessage(availability.message);

        // Log if product is permanently out of stock
        if (availability.permanentlyOutOfStock) {
          console.log(`🚨 Product permanently out of stock: ${title}`);
        }
      }
    } catch (error) {
      console.error("Error checking availability:", error);
      setIsAvailable(true); // Default to available if check fails
      setAvailabilityMessage("Available");
    }
  }, [_id, title]);

  // Fetch real-time stock from Sanity
  const fetchRealTimeStock = useCallback(async () => {
    try {
      const sessionId = SessionManager.getSessionId();
      const response = await fetch(
        `/api/products/stock/${_id}?sessionId=${sessionId}`
      );
      if (response.ok) {
        const data = await response.json();
        setCurrentStock(data.stock);
        setStockMessage(data.stockMessage);
      }
    } catch (error) {
      console.error("Error fetching real-time stock:", error);
    }
  }, [_id]);

  // Update stock display based on availability and real-time data
  useEffect(() => {
    if (stock !== undefined) {
      setCurrentStock(stock);

      if (stock <= 0) {
        setStockMessage("Out of Stock");
      } else if (stock === 1) {
        setStockMessage("Only 1 left!");
      } else if (stock <= 3) {
        setStockMessage(`Only ${stock} left!`);
      } else {
        setStockMessage(`${stock} in stock`);
      }
    }
  }, [stock, isAvailable, availabilityMessage]);

  // Fetch real-time stock when availability changes
  useEffect(() => {
    if (isAvailable) {
      fetchRealTimeStock();
    }
  }, [isAvailable, _id, fetchRealTimeStock]);

  // Poll for stock updates every 30 seconds to catch cart changes (reduced from 5 seconds for better performance)
  useEffect(() => {
    if (isAvailable) {
      const interval = setInterval(() => {
        fetchRealTimeStock();
      }, 30000); // Poll every 30 seconds (optimized for concurrent users)

      return () => clearInterval(interval);
    }
  }, [isAvailable, fetchRealTimeStock]);

  // Initialize session and check availability
  useEffect(() => {
    SessionManager.refreshSessionIfNeeded();
    checkAvailability();
  }, [_id, checkAvailability]);

  const handleAddToCart = async (selectedSize?: string) => {
    // Check if product is available (this includes out of stock check)
    if (!isAvailable) {
      toast.error(availabilityMessage);
      return;
    }

    setIsReserving(true);
    try {
      const sessionId = SessionManager.getSessionId();

      // Reserve product via API
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      const response = await fetch(`/api/products/reserve/${_id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          quantity: 1,
          size: selectedSize || size?.[0] || "",
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const reservationResult = await response.json();

      if (!reservationResult.success) {
        // Check if it's a reservation conflict
        if (
          reservationResult.error &&
          reservationResult.error.includes("already reserved")
        ) {
          toast.error(
            "This product is currently being purchased by another user"
          );
        } else if (
          reservationResult.error &&
          (reservationResult.error.includes("timeout") ||
            reservationResult.error.includes("connection"))
        ) {
          toast.error(
            "This product is currently being purchased by another user"
          );
        } else {
          toast.error(reservationResult.error || "Failed to reserve product");
        }
        return;
      }

      toast.success("Product reserved and added to cart");

      // Update availability after successful reservation
      await checkAvailability();
      await fetchRealTimeStock();
    } catch (error) {
      console.error("Reservation error:", error);

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          toast.error("Reservation timed out. Please try again.");
        } else {
          toast.error("Failed to reserve product");
        }
      } else {
        toast.error("Failed to reserve product");
      }
      return;
    } finally {
      setIsReserving(false);
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
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                !isAvailable
                  ? "bg-gray-300 cursor-not-allowed"
                  : isReserving
                    ? "bg-blue-100 border-2 border-blue-500 cursor-wait"
                    : addedToCart === "default"
                      ? "bg-green-100 border-2 border-green-500 cursor-pointer"
                      : "bg-[#F4F4F4] hover:bg-[#E0E0E0] cursor-pointer"
              }`}
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
                      className={`px-4 py-2 font-medium rounded-full flex flex-col items-center justify-center text-sm font-activo uppercase transition-all duration-300 ${
                        !isAvailable
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : isReserving
                            ? "bg-blue-100 border-2 border-blue-500 text-blue-700 cursor-wait"
                            : addedToCart === sizeOption
                              ? "bg-green-100 border-2 border-green-500 text-green-700 cursor-pointer"
                              : "bg-[#F4F4F4] hover:bg-[#DADADA] text-[#1E1E1E] cursor-pointer"
                      }`}
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
