/**
 * Cache key constants for localStorage
 * All cache keys should use the HIMSPIRED_NAMESPACE prefix to avoid conflicts
 */
export const CACHE_KEYS = {
  // Namespace prefix for all cache keys
  NAMESPACE: "himspired_",

  // Stock and reservation related keys
  STOCK_UPDATE: "himspired_stockUpdate",
  CART_SYNC: "himspired_cartSync",
  LAST_LOCAL_CART_CHANGE: "himspired_lastLocalCartChange",

  // Session related keys (already using namespace)
  SESSION_ID: "himspired_session_id",

  // Checkout related keys (already using namespace)
  CHECKOUT_DATA: "himspired_checkout_data",

  // Contact form related keys (already using namespace)
  LAST_CONTACT_SUBMIT: "himspired_lastContactSubmit",
} as const;

/**
 * Helper function to get a namespaced cache key
 * @param key The base key name
 * @returns The namespaced key
 */
export function getCacheKey(key: string): string {
  return `${CACHE_KEYS.NAMESPACE}${key}`;
}

/**
 * Helper function to check if a key is a namespaced cache key
 * @param key The key to check
 * @returns True if the key is namespaced
 */
export function isNamespacedKey(key: string): boolean {
  return key.startsWith(CACHE_KEYS.NAMESPACE);
}
