import { NextRequest, NextResponse } from "next/server";
import { client } from "@/sanity/client";

type Reservation = {
  sessionId: string;
  quantity: number;
  reservedUntil: string;
};

type StockResponse = {
  success: boolean;
  productId: string;
  title: string;
  stock: number;
  availableStock: number;
  reservedQuantity: number;
  reservedByCurrentUser: number;
  reservedByOthers: number;
  isOutOfStock: boolean;
  stockMessage: string;
  reservations: Reservation[];
};

// In-memory cache for stock data
const stockCache = new Map<
  string,
  { data: StockResponse; timestamp: number }
>();
const CACHE_TTL = 30000; // 30 seconds

function getCachedStock(
  productId: string,
  sessionId: string | null
): StockResponse | null {
  const cacheKey = `${productId}-${sessionId || "anonymous"}`;
  const cached = stockCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

function setCachedStock(
  productId: string,
  sessionId: string | null,
  data: StockResponse
): void {
  const cacheKey = `${productId}-${sessionId || "anonymous"}`;
  stockCache.set(cacheKey, { data, timestamp: Date.now() });
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await context.params;
    const sessionId = req.nextUrl.searchParams.get("sessionId");

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    // Check cache first
    const cached = getCachedStock(productId, sessionId);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Get current stock and reservations from Sanity
    const product = await client.fetch(
      `*[_type == "clothingItem" && _id == $productId][0]{
        _id, title, stock, reservations
      }`,
      { productId }
    );

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Clean up expired reservations
    const now = new Date();
    const reservations: Reservation[] = (product.reservations || []).filter(
      (r: Reservation) => r.reservedUntil && new Date(r.reservedUntil) > now
    );

    // Calculate reserved quantity and available stock
    const reservedQuantity = reservations.reduce(
      (sum, r) => sum + (r.quantity || 0),
      0
    );
    const availableStock = Math.max(0, (product.stock || 0) - reservedQuantity);
    const userReservation = reservations.find((r) => r.sessionId === sessionId);
    const reservedByCurrentUser = userReservation
      ? userReservation.quantity
      : 0;
    const reservedByOthers = reservedQuantity - reservedByCurrentUser;

    // Generate stock message
    let stockMessage = "";
    if ((product.stock || 0) <= 0) {
      stockMessage = "Out of Stock";
    } else if (reservedByCurrentUser > 0) {
      stockMessage = `You reserved ${reservedByCurrentUser} item${reservedByCurrentUser > 1 ? "s" : ""}`;
    } else if (availableStock === 0) {
      stockMessage = "Item currently reserved by another customer";
    } else if (availableStock === 1) {
      stockMessage = "Only 1 left!";
    } else if (availableStock <= 3) {
      stockMessage = `Only ${availableStock} left!`;
    } else {
      stockMessage = `${availableStock} in stock`;
    }

    if (reservedByOthers > 0 && availableStock > 0) {
      stockMessage += `, ${reservedByOthers} currently reserved by others`;
    }

    const response: StockResponse = {
      success: true,
      productId: product._id,
      title: product.title,
      stock: product.stock || 0,
      availableStock: availableStock,
      reservedQuantity: reservedQuantity,
      reservedByCurrentUser,
      reservedByOthers,
      isOutOfStock: availableStock <= 0,
      stockMessage: stockMessage,
      reservations,
    };

    // Cache the response
    setCachedStock(productId, sessionId, response);

    return NextResponse.json(response);
  } catch (error) {
    console.error("Stock fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stock information" },
      { status: 500 }
    );
  }
}
