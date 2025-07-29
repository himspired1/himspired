// Stock update utility functions
interface StockUpdateResult {
  success: boolean;
  error?: string;
  previousStock?: number;
  newStock?: number;
}

interface StockUpdateParams {
  productId: string;
  quantity: number;
  orderId: string;
}

import { StockAuth } from "./stock-auth";

// Validate environment variables when function is called
const validateEnvironmentVariables = (): void => {
  const requiredVars = {
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
  };

  const missingVars = Object.entries(requiredVars)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    console.error(
      `Missing required environment variables: ${missingVars.join(", ")}`
    );
    throw new Error(
      `Missing required environment variables: ${missingVars.join(", ")}`
    );
  }

  // Validate stock auth environment variables
  StockAuth.validateEnvironmentVariables();
};

/**
 * Decrement stock for a product after payment confirmation
 */
export async function decrementStockForOrder(
  params: StockUpdateParams
): Promise<StockUpdateResult> {
  // Validate environment variables
  validateEnvironmentVariables();

  const { productId, quantity, orderId } = params;

  try {
    // Use the productId directly - it's already the correct Sanity product ID
    // from the order items (item._id from cart items)
    const baseProductId = productId;

    console.log(`🔄 Starting stock decrement process for order ${orderId}`);
    console.log(
      `📦 Product: ${baseProductId}, Quantity to decrement: ${quantity}`
    );

    // Get current stock
    const stockCheckResponse = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/products/stock/${baseProductId}?sessionId=order-${orderId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!stockCheckResponse.ok) {
      const errorText = await stockCheckResponse.text();
      console.error(`❌ Failed to get current stock: ${errorText}`);
      return {
        success: false,
        error: `Failed to get current stock for product ${baseProductId}: ${errorText}`,
      };
    }

    const stockData = await stockCheckResponse.json();
    const currentStock = stockData.stock || 0;
    const newStock = Math.max(0, currentStock - quantity);

    console.log(`📊 Stock calculation:`);
    console.log(`   - Current stock in Sanity: ${currentStock}`);
    console.log(`   - Quantity to decrement: ${quantity}`);
    console.log(`   - New stock will be: ${newStock}`);

    // Update stock using the update API
    const stockResponse = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/products/update-stock/${baseProductId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${StockAuth.getValidTokens()[0]}`,
        },
        body: JSON.stringify({
          newStock: newStock,
        }),
      }
    );

    if (!stockResponse.ok) {
      const errorText = await stockResponse.text();
      console.error(`❌ Stock update failed: ${errorText}`);
      return {
        success: false,
        error: `Failed to update stock for product ${baseProductId}: ${errorText}`,
      };
    }

    const updateResult = await stockResponse.json();
    console.log(`✅ Stock update successful:`, updateResult);

    // Trigger stock update notification
    try {
      console.log(`🔄 Triggering stock update notification...`);
      const triggerResponse = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/products/trigger-stock-update/${baseProductId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${StockAuth.getValidTokens()[0]}`,
          },
        }
      );

      if (triggerResponse.ok) {
        console.log(`✅ Stock update notification triggered successfully`);
      } else {
        console.warn(
          `⚠️ Stock update notification failed: ${await triggerResponse.text()}`
        );
      }
    } catch (triggerError) {
      console.error(
        `Error triggering stock update for product ${baseProductId}:`,
        triggerError
      );
      // Don't fail the entire operation if trigger fails
    }

    // Trigger frontend refresh by updating localStorage
    // This will notify all connected clients about the stock change
    try {
      console.log(`🔄 Triggering frontend refresh via localStorage...`);

      // Import the cache constants
      const { CACHE_KEYS } = await import("./cache-constants");

      // Update localStorage to trigger frontend refresh
      // This will be picked up by the storage event listeners in frontend components
      const timestamp = Date.now().toString();

      // Update stockUpdate to trigger stock refresh
      if (typeof window !== "undefined") {
        localStorage.setItem(CACHE_KEYS.STOCK_UPDATE, timestamp);
        console.log(`✅ localStorage stockUpdate triggered: ${timestamp}`);
      } else {
        // Server-side: we can't directly update localStorage, but we can log it
        console.log(
          `ℹ️ Server-side stock update - frontend will refresh on next poll`
        );
      }
    } catch (localStorageError) {
      console.error(`Error triggering localStorage update:`, localStorageError);
      // Don't fail the entire operation if localStorage update fails
    }

    // Verify the stock was actually updated
    console.log(`🔍 Verifying stock update...`);
    const verifyResponse = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/products/stock/${baseProductId}?sessionId=verify-${orderId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (verifyResponse.ok) {
      const verifyData = await verifyResponse.json();
      console.log(`✅ Stock verification:`, {
        productId: baseProductId,
        stockInSanity: verifyData.stock,
        availableStock: verifyData.availableStock,
        reservedQuantity: verifyData.reservedQuantity,
        message: verifyData.stockMessage,
      });
    } else {
      console.warn(
        `⚠️ Could not verify stock update: ${await verifyResponse.text()}`
      );
    }

    return {
      success: true,
      previousStock: currentStock,
      newStock: newStock,
    };
  } catch (error) {
    console.error(`❌ Error in decrementStockForOrder:`, error);
    return {
      success: false,
      error: `Error updating stock for product ${productId}: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}
