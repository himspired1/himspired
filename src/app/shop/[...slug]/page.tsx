"use client";
import { ChevronLeft, Frown, Plus } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useClothingItem } from "@/sanity/queries";
import { SanityImageComponent } from "@/components/sanity/image";
import ProductDetailsSkeleton from "@/components/common/skeleton/product-details-skeleton.component";
import { addItem, selectCartItemQuantity } from "@/redux/slices/cartSlice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { toast } from "sonner";
import { SessionManager } from "@/lib/session";
import { CACHE_KEYS } from "@/lib/cache-constants";

const ProductDetails = () => {
  const [showSizes, setShowSizes] = useState(false);
  const [productId, setProductId] = useState<string>("");
  const [isAvailable, setIsAvailable] = useState(true);
  const [availabilityMessage, setAvailabilityMessage] = useState("Available");
  const [isReserving, setIsReserving] = useState(false);
  const [currentStock, setCurrentStock] = useState(0);
  const [stockMessage, setStockMessage] = useState("");
  const router = useRouter();
  const params = useParams();
  const dispatch = useAppDispatch();

  // Handle async params in Next.js 15+
  useEffect(() => {
    const getProductId = async () => {
      // Handle the [...slug] dynamic route
      const slugArray = Array.isArray(params?.slug)
        ? params.slug
        : [params?.slug];
      const id = slugArray[0]; // First segment is the product ID

      if (typeof id === "string") {
        setProductId(id);
      }
    };

    getProductId();
  }, [params]);

  const { item, loading, error } = useClothingItem(productId, "id");

  // Get cart quantities for this product
  const cartQuantities = useAppSelector((state) => {
    const quantities: Record<string, number> = {};
    if (item?.size) {
      item.size.forEach((sizeOption) => {
        quantities[sizeOption] = selectCartItemQuantity(
          state,
          item._id,
          sizeOption
        );
      });
    }
    return quantities;
  });

  // Fetch real-time stock from Sanity
  const fetchRealTimeStock = useCallback(async () => {
    try {
      const sessionId = SessionManager.getSessionId();
      const response = await fetch(
        `/api/products/stock/${productId}?sessionId=${sessionId}`
      );
      if (response.ok) {
        const data = await response.json();
        setCurrentStock(data.stock);
        setStockMessage(data.stockMessage);
      }
    } catch (error) {
      console.error("Error fetching real-time stock:", error);
    }
  }, [productId]);

  // Check product availability
  const checkAvailability = useCallback(async () => {
    if (!productId) return;

    try {
      const sessionId = SessionManager.getSessionId();
      const response = await fetch(
        `/api/products/availability/${productId}?sessionId=${sessionId}`,
        {
          method: "GET",
          headers: {
            "Cache-Control": "no-cache",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setIsAvailable(data.available);
        setAvailabilityMessage(data.message);

        // Log if product is permanently out of stock
        if (data.permanentlyOutOfStock) {
          console.log(`🚨 Product permanently out of stock: ${item?.title}`);
        }
      } else {
        console.error("Error checking availability:", response.statusText);
        setIsAvailable(true); // Default to available if check fails
        setAvailabilityMessage("Available");
      }
    } catch (error) {
      console.error("Error checking availability:", error);
      setIsAvailable(true); // Default to available if check fails
      setAvailabilityMessage("Available");
    }
  }, [productId, item?.title]);

  // Update stock display based on item data
  useEffect(() => {
    if (item?.stock !== undefined) {
      setCurrentStock(item.stock);
      // Don't set fallback stock message here - rely on API data for accurate reservation status
    }
  }, [item?.stock]);

  // Initialize session and check availability
  useEffect(() => {
    if (productId) {
      SessionManager.refreshSessionIfNeeded();
      checkAvailability();
      fetchRealTimeStock();
    }
  }, [productId, checkAvailability, fetchRealTimeStock]);

  // Fetch real-time stock when availability changes
  useEffect(() => {
    if (isAvailable && productId) {
      fetchRealTimeStock();
    }
  }, [isAvailable, productId, fetchRealTimeStock]);

  // Poll for stock updates every 30 seconds to catch cart changes (reduced from 5 seconds for better performance)
  useEffect(() => {
    if (isAvailable && productId) {
      const interval = setInterval(() => {
        fetchRealTimeStock();
      }, 30000); // Poll every 30 seconds (optimized for concurrent users)

      return () => clearInterval(interval);
    }
  }, [isAvailable, productId, fetchRealTimeStock]);

  if (!productId) {
    return <ProductDetailsSkeleton />;
  }

  if (loading) {
    return <ProductDetailsSkeleton />;
  }

  if (error) {
    return (
      <p className="text-center mt-32 text-sm text-red-500">
        Error loading product.
      </p>
    );
  }

  if (!item) {
    return (
      <div className="w-full flex flex-1 items-center justify-center flex-col">
        <Frown size={50} color="68191E" />
        <p className="text-center mt-32 text-sm">Product not found.</p>
      </div>
    );
  }

  return (
    <motion.div
      className="w-full min-h-screen pb-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="w-full flex items-center justify-start gap-3 mt-[123px] px-[23px] lg:px-[120px] ">
        <ChevronLeft
          onClick={() => {
            router.back();
          }}
          color="#68191E"
          size={18}
          className="cursor-pointer"
        />
        <p
          onClick={() => {
            router.back();
          }}
          className="text-[#68191E] text-sm  cursor-pointer font-activo uppercase"
        >
          Back
        </p>
      </div>

      <motion.div
        className="w-full mt-[61px] px-[23px] lg:px-[120px] flex flex-col items-center justify-center"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <motion.div
          className="w-auto mx-auto"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <SanityImageComponent
            image={item.mainImage || "/placeholder.svg"}
            width={227}
            height={250}
            alt="product-img"
          />
        </motion.div>

        <motion.div
          className="w-full mt-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <p className="font-activo text-[#1E1E1E80] text-xs font-normal text-center uppercase">
            {item?.category}
          </p>
          <p className="font-activo text-[#1E1E1E] mt-2 text-[16px] font-normal text-center uppercase">
            {item?.title}
          </p>
          <p className="font-activo text-[#1E1E1E] mt-2 text-[16px] font-normal text-center uppercase">
            ngn {item?.price}
          </p>

          {/* Stock Status */}
          {stockMessage && (
            <div
              className={`flex items-center justify-center gap-2 text-sm mt-2 ${
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

          <div className=" w-full  md:w-full lg:w-[770px] mx-auto mt-2">
            <p className="font-activo text-[#1E1E1ECC] text-[13px] font-normal text-center uppercase">
              {item?.description}
            </p>
          </div>

          <div className="w-full flex items-center justify-center mt-[26px] gap-4">
            {item?.size && (
              <motion.div
                whileHover={{ scale: isAvailable ? 1.1 : 1 }}
                whileTap={{ scale: isAvailable ? 0.95 : 1 }}
                onClick={() => {
                  if (!isAvailable) {
                    toast.error(availabilityMessage);
                    return;
                  }
                  if (isReserving) {
                    toast.info("Reserving product...");
                    return;
                  }
                  setShowSizes((prev) => !prev);
                }}
                className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  isAvailable
                    ? "cursor-pointer bg-[#F4F4F4]"
                    : "cursor-not-allowed bg-gray-300"
                }`}
              >
                <Plus size={14} color={isAvailable ? "#1E1E1E" : "#999"} />
              </motion.div>
            )}

            <AnimatePresence>
              {showSizes && (
                <motion.div
                  className="flex gap-4"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 50 }}
                  transition={{ duration: 0.4 }}
                >
                  {item?.size?.map((size) => (
                    <motion.div
                      onClick={async () => {
                        // Check if product is available (this includes out of stock check)
                        if (!isAvailable) {
                          toast.error(availabilityMessage);
                          return;
                        }

                        setIsReserving(true);
                        try {
                          const sessionId = SessionManager.getSessionId();

                          // Get current cart quantity for this specific size
                          const currentCartQuantity = cartQuantities[size] || 0;
                          const newTotalQuantity = currentCartQuantity + 1;

                          // Reserve product via API
                          const controller = new AbortController();
                          const timeoutId = setTimeout(
                            () => controller.abort(),
                            15000
                          ); // 15 second timeout (matching ProductCard)

                          const response = await fetch(
                            `/api/products/reserve/${item._id}`,
                            {
                              method: "POST",
                              headers: {
                                "Content-Type": "application/json",
                              },
                              body: JSON.stringify({
                                sessionId,
                                quantity: newTotalQuantity, // Reserve the new total quantity
                                size: size,
                                isUpdate: currentCartQuantity > 0, // Mark as update if item already in cart
                              }),
                              signal: controller.signal,
                            }
                          );

                          clearTimeout(timeoutId);

                          const reservationResult = await response.json();

                          if (!reservationResult.success) {
                            // Check if it's a reservation conflict
                            if (
                              reservationResult.error &&
                              reservationResult.error.includes(
                                "already reserved"
                              )
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
                            } else if (
                              reservationResult.error &&
                              (reservationResult.error.includes(
                                "out of stock"
                              ) ||
                                reservationResult.error.includes(
                                  "not available"
                                ))
                            ) {
                              toast.error(
                                "This product is currently out of stock"
                              );
                            } else {
                              toast.error(
                                reservationResult.error ||
                                  "Failed to reserve product. Please try again."
                              );
                            }
                            return;
                          }

                          toast.success("Product reserved and added to cart");

                          // Update availability after successful reservation
                          await checkAvailability();
                          await fetchRealTimeStock();

                          // Broadcast stock update to other tabs
                          localStorage.setItem(
                            CACHE_KEYS.STOCK_UPDATE,
                            Date.now().toString()
                          );

                          const cartData = {
                            _id: item._id,
                            title: item.title,
                            category: item.category,
                            mainImage: item.mainImage,
                            price: item.price,
                            size: size,
                            stock: item.stock || 0, // Include stock information
                            reservationId: reservationResult?.reservationId, // Include reservation ID
                          };
                          dispatch(addItem(cartData));
                          setShowSizes((prev) => !prev);
                        } catch (error) {
                          console.error("Reservation error:", error);

                          if (error instanceof Error) {
                            if (error.name === "AbortError") {
                              toast.error(
                                "Reservation timed out. Please try again."
                              );
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
                      }}
                      key={size}
                      className="px-4 py-2 font-medium bg-[#F4F4F4] rounded-full flex items-center justify-center text-sm font-activo uppercase text-[#1E1E1E] cursor-pointer hover:bg-[#DADADA] transition"
                      whileHover={{ scale: 1.1 }}
                    >
                      {size}
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default ProductDetails;
