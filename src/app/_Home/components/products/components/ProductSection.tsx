"use client";
import { Plus, Check } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { SanityImageComponent } from "@/components/sanity/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  addItem,
  CartItem,
  selectCartItemQuantity,
} from "@/redux/slices/cartSlice";
import React from "react";
import type { Variants } from "framer-motion";
import { SessionManager } from "@/lib/session";
import { toast } from "sonner";

interface ProductSectionProps {
  itemsToShow?: number;
  products: Product[];
}

const ProductSection = ({ itemsToShow = 4, products }: ProductSectionProps) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  };

  // Create grid items based on itemsToShow
  const gridItems = [];
  for (let i = 0; i < itemsToShow; i++) {
    if (i < products.length) {
      const product = products[i];
      gridItems.push(
        <ProductItem
          key={product._id}
          product={product}
          itemsToShow={itemsToShow}
          variants={itemVariants}
        />
      );
    }
  }

  return (
    <motion.div
      className="flex flex-wrap justify-center gap-4 md:gap-6 lg:gap-8 text-center font-activo uppercase"
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
    >
      {gridItems}
    </motion.div>
  );
};

const ProductItem = ({
  product,
  itemsToShow,
  variants,
}: {
  product: Product;
  itemsToShow: number;
  variants: Variants | undefined;
}) => {
  const [showSizes, setShowSizes] = useState(false);
  const [addedToCart, setAddedToCart] = useState<string | null>(null);
  const [currentStock, setCurrentStock] = useState(product.stock || 0);
  const [stockMessage, setStockMessage] = useState("");
  const [isAvailable, setIsAvailable] = useState(true);
  const [lastKnownStock, setLastKnownStock] = useState(product.stock || 0);
  const [isReserving, setIsReserving] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const dispatch = useAppDispatch();
  const fetchStockRef = useRef<(() => Promise<void>) | undefined>(undefined);

  // Get cart quantities for this product
  const cartQuantity = useAppSelector((state) =>
    selectCartItemQuantity(state, product._id, product.size?.[0] || "")
  );

  // Get all cart items for this product
  const cartItems = useAppSelector((state) =>
    state.persistedReducer.cart.items.filter(
      (item) => item.originalProductId === product._id
    )
  );

  // Memoized size-specific quantities to prevent unnecessary rerenders
  const sizeQuantities = useMemo(() => {
    const quantities: Record<string, number> = {};
    cartItems.forEach((item: CartItem) => {
      if (item.size) {
        quantities[item.size] =
          (quantities[item.size] || 0) + (item.quantity || 1);
      }
    });
    return quantities;
  }, [cartItems]);

  // Check product availability
  const checkAvailability = useMemo(() => {
    return async () => {
      try {
        const sessionId = SessionManager.getSessionId();
        const res = await fetch(
          `/api/products/availability/${product._id}?sessionId=${sessionId}`
        );
        if (!res.ok) return;
        const data = await res.json();
        setIsAvailable(data.isAvailable);
      } catch (error) {
        console.error("Error checking availability:", error);
      }
    };
  }, [product._id]);

  // Real-time polling for stock and reservation status
  useEffect(() => {
    SessionManager.refreshSessionIfNeeded();
    let isMounted = true;
    const sessionId = SessionManager.getSessionId();
    const fetchStock = async () => {
      try {
        const res = await fetch(
          `/api/products/stock/${product._id}?sessionId=${sessionId}`
        );
        if (!res.ok) return;
        const data = await res.json();
        if (isMounted) {
          const newStock = data.stock || 0;
          const availableStock = data.availableStock || 0;
          const reservedByCurrentUser = data.reservedByCurrentUser || 0;
          const reservedByOthers = data.reservedByOthers || 0;

          // Check if stock changed significantly (admin intervention)
          if (Math.abs(newStock - lastKnownStock) > 1) {
            console.warn(
              `Significant stock change detected for ${product.title}: ${lastKnownStock} -> ${newStock}`
            );
            toast.info(`Stock updated for ${product.title}`);
          }

          setCurrentStock(newStock);
          setLastKnownStock(newStock);

          // Use the enhanced stock message from API
          setStockMessage(data.stockMessage || "");

          // Update availability based on available stock
          if (availableStock <= 0) {
            setIsAvailable(false);
          } else {
            setIsAvailable(true);
          }

          // Log reservation info for debugging
          if (reservedByCurrentUser > 0 || reservedByOthers > 0) {
            console.log(
              `${product.title}: You reserved ${reservedByCurrentUser}, Others reserved ${reservedByOthers}, Available: ${availableStock}`
            );
          }
        }
      } catch {
        // Ignore errors for polling
      }
    };

    // Initial fetch
    fetchStock();

    // Also fetch after a short delay to catch any recent changes
    const immediateRefresh = setTimeout(fetchStock, 2000);

    // Poll every 5 seconds for faster responsiveness
    const interval = setInterval(fetchStock, 5000);

    // Listen for cart changes from other tabs
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "cartSync" || event.key === "stockUpdate") {
        // Refetch stock when cart changes or stock updates
        fetchStock();
      }
    };

    // Listen for visibility changes to refresh stock when tab becomes active
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchStock();
      }
    };

    // Listen for window focus to refresh stock when user switches back to tab
    const handleWindowFocus = () => {
      fetchStock();
    };

    window.addEventListener("storage", handleStorageChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleWindowFocus);

    // Store fetchStock in a ref for instant update after reservation
    fetchStockRef.current = fetchStock;

    return () => {
      isMounted = false;
      clearInterval(interval);
      clearTimeout(immediateRefresh);
      window.removeEventListener("storage", handleStorageChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleWindowFocus);
      fetchStockRef.current = undefined;
    };
  }, [product._id, lastKnownStock, product.title]);

  // Initialize session and check availability
  useEffect(() => {
    SessionManager.refreshSessionIfNeeded();
    checkAvailability();

    // Also fetch stock immediately when component mounts
    if (isAvailable && fetchStockRef.current) {
      fetchStockRef.current();
    }
  }, [product._id, checkAvailability, isAvailable]);

  const handleClick = () => {
    router.push(`/shop/${product._id}/${product.slug?.current}`);
  };

  const handleAddToCart = async (
    selectedSize?: string,
    e?: React.MouseEvent
  ) => {
    if (e) e.stopPropagation();

    // Check if product is available
    if (!isAvailable) {
      toast.error(stockMessage || "Product is not available");
      return;
    }

    setIsReserving(true);
    SessionManager.refreshSessionIfNeeded();
    const sessionId = SessionManager.getSessionId();

    // Get current cart quantity for this specific product and size
    const currentSize = selectedSize || product.size?.[0] || "";
    const currentCartQuantity = sizeQuantities[currentSize] || 0;

    // Calculate new total quantity (current + 1)
    const newTotalQuantity = currentCartQuantity + 1;

    let reservationResult: {
      success: boolean;
      reservationId?: string;
      error?: string;
    } | null = null;

    // Reservation logic
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      const reservationData = {
        sessionId,
        quantity: newTotalQuantity, // Reserve the new total quantity
        size: selectedSize || product.size?.[0] || "",
        isUpdate: currentCartQuantity > 0, // Mark as update if item already in cart
      };

      const response = await fetch(`/api/products/reserve/${product._id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reservationData),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      reservationResult = await response.json();

      if (!reservationResult?.success) {
        // Check if it's a reservation conflict
        if (
          reservationResult?.error &&
          reservationResult.error.includes("already reserved")
        ) {
          toast.error(
            "This product is currently being purchased by another user"
          );
        } else if (
          reservationResult?.error &&
          (reservationResult.error.includes("timeout") ||
            reservationResult.error.includes("connection"))
        ) {
          toast.error(
            "This product is currently being purchased by another user"
          );
        } else {
          toast.error(reservationResult?.error || "Failed to reserve product");
        }
        return;
      }

      toast.success("Product reserved and added to cart");

      // Instantly update stock/reservation status after reservation
      if (fetchStockRef.current) {
        await fetchStockRef.current();
      }

      // Broadcast stock update to other tabs
      localStorage.setItem("stockUpdate", Date.now().toString());
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
      _id: product._id,
      title: product.title,
      category: product.category,
      mainImage: product.mainImage,
      price: product.price,
      size: selectedSize || product.size?.[0] || "",
      stock: product.stock || 0, // Include stock information
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

  return (
    <motion.div
      ref={cardRef}
      onClick={handleClick}
      className="flex flex-col gap-y-2 items-center cursor-pointer"
      variants={variants}
      style={{
        width: `calc(${100 / itemsToShow}% - ${itemsToShow > 1 ? "2rem" : "0rem"})`,
      }}
    >
      <motion.div
        whileHover={{ scale: 1.05 }}
        transition={{ duration: 0.3 }}
        className="relative group cursor-pointer"
      >
        <SanityImageComponent
          image={product.mainImage || "/placeholder.svg"}
          alt={product.title}
          width={0}
          height={0}
          className="w-auto h-auto md:px-7 py-3 md:py-4.5"
        />
        <div className="absolute inset-0 bg-black/0 transition-all duration-300 rounded-lg"></div>
      </motion.div>

      <div className="flex flex-col gap-y-2.5">
        <p className="text-gray-850/50 text-xs">{product.category}</p>
        <h3 className="text-gray-850 text-sm md:text-base whitespace-nowrap overflow-hidden text-ellipsis w-40">
          {product.title}
        </h3>
        <p className="text-gray-850 text-xs md:text-base">
          NGN {product.price.toLocaleString()}
        </p>
        {stockMessage && (
          <span
            className={`text-xs font-medium ${currentStock <= 0 ? "text-red-600" : currentStock <= 3 ? "text-orange-600" : "text-green-600"}`}
          >
            {stockMessage}
          </span>
        )}
      </div>

      {!showSizes && (
        <motion.button
          className={`mt-1.5 p-3 md:p-4 w-fit rounded-full transition-all duration-300 ${
            addedToCart === "default"
              ? "bg-green-100 border-2 border-green-500"
              : !isAvailable || isReserving
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-white-200 hover:bg-gray-200"
          }`}
          whileHover={isAvailable && !isReserving ? { scale: 1.1 } : undefined}
          whileTap={isAvailable && !isReserving ? { scale: 0.95 } : undefined}
          onClick={(e) => {
            if (!isAvailable || isReserving) return;
            if (!product.size?.length) {
              handleAddToCart(undefined, e);
            } else {
              e.stopPropagation();
              setShowSizes(true);
            }
          }}
          disabled={!isAvailable || isReserving}
        >
          {addedToCart === "default" ? <Check color="#22c55e" /> : <Plus />}
        </motion.button>
      )}

      {!product.size?.length && cartQuantity > 0 && (
        <p className="text-xs text-[#68191E] font-medium">
          In cart: {cartQuantity}
        </p>
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
            {product.size?.map((sizeOption) => {
              const sizeCartQuantity = sizeQuantities[sizeOption] || 0;

              return (
                <motion.div
                  key={sizeOption}
                  onClick={(e) => {
                    if (isReserving) return;
                    e.stopPropagation();
                    handleAddToCart(sizeOption, e);
                    setShowSizes(false);
                  }}
                  className={`px-4 py-2 font-medium rounded-full flex flex-col items-center justify-center text-sm font-activo uppercase cursor-pointer transition-all duration-300 ${
                    addedToCart === sizeOption
                      ? "bg-green-100 border-2 border-green-500 text-green-700"
                      : isReserving
                        ? "bg-gray-300 cursor-not-allowed text-gray-500"
                        : "bg-[#F4F4F4] hover:bg-[#DADADA] text-[#1E1E1E]"
                  }`}
                  whileHover={!isReserving ? { scale: 1.1 } : undefined}
                  whileTap={!isReserving ? { scale: 0.95 } : undefined}
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
    </motion.div>
  );
};

export default React.memo(ProductSection);
