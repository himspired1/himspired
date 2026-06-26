// Stock update utility functions
export interface StockUpdateParams {
  productId: string;
  quantity: number;
  orderId: string;
}

export interface StockUpdateResult {
  success: boolean;
  previousStock?: number;
  newStock?: number;
  error?: string;
}

import { StockAuth } from "@/lib/stock-auth";

/**
 * Validate environment variables at runtime
 */
function validateEnvironmentVariables(): void {
  const requiredVars = {
    BASE_URL: process.env.BASE_URL || process.env.NEXT_PUBLIC_BASE_URL,
  };

  const missingVars = Object.entries(requiredVars)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(", ")}`
    );
  }
}

/**
 * Get the base URL for API calls
 */
function getBaseUrl(): string {
  return (
    process.env.BASE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    "http://localhost:3000"
  );
}

/**
 * Decrement stock for an order and update Sanity
 */
export async function decrementStockForOrder(
  params: StockUpdateParams
): Promise<StockUpdateResult> {
  // Validate environment variables
  validateEnvironmentVariables();

  // Validate that we have valid tokens
  if (!StockAuth.hasValidTokens()) {
    return {
      success: false,
      error: "No valid stock modification tokens available",
    };
  }

  const { productId, quantity, orderId } = params;

  try {
    const baseProductId = productId; // Fixed: Use productId directly

    console.log(`🔄 Starting stock decrement process for order ${orderId}`);
    console.log(
      `📦 Product: ${baseProductId}, Quantity to decrement: ${quantity}`
    );

    // Get current stock
    const stockCheckResponse = await fetch(
      `${getBaseUrl()}/api/products/stock/${baseProductId}?sessionId=order-${orderId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${StockAuth.getFirstValidToken()}`,
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
      `${getBaseUrl()}/api/products/update-stock/${baseProductId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${StockAuth.getFirstValidToken()}`,
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
        `${getBaseUrl()}/api/products/trigger-stock-update/${baseProductId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${StockAuth.getFirstValidToken()}`,
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

    // Verify the stock was actually updated
    console.log(`🔍 Verifying stock update...`);
    const verifyResponse = await fetch(
      `${getBaseUrl()}/api/products/stock/${baseProductId}?sessionId=verify-${orderId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${StockAuth.getFirstValidToken()}`,
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
