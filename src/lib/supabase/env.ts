export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("Supabase environment variables are not configured.");
  }
  return { url, anonKey };
}

export function isPayPalConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID);
}

/** Web OAuth client ID (ends with .apps.googleusercontent.com) — required for in-app Google on Android. */
export function getGoogleWebClientId(): string | null {
  const id = process.env.NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim();
  return id || null;
}
