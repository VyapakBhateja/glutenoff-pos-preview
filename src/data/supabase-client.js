/**
 * Supabase client factory.
 * Owns SDK-to-client construction; authentication and application startup stay in app.js.
 */
export function createSupabaseClient(config, sdk = globalThis.supabase) {
  if (!config?.url || !config?.publishableKey) {
    throw new Error("Supabase URL and publishable key are required.");
  }
  if (!sdk || typeof sdk.createClient !== "function") {
    throw new Error("Supabase browser SDK is unavailable. Check the SDK script in index.html.");
  }
  return sdk.createClient(config.url, config.publishableKey);
}
