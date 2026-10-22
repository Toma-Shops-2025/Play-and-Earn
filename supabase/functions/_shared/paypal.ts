export type PayPalPack = {
  coins: number;
  name: string;
  priceUsd: string;
};

export const PAYPAL_PACKS: Record<string, PayPalPack> = {
  coins_100: { coins: 100, name: "Starter coin pack", priceUsd: "0.99" },
  coins_500: { coins: 500, name: "Pro coin pack", priceUsd: "3.99" },
  coins_1200: { coins: 1200, name: "Mega coin pack", priceUsd: "7.99" },
};

export function paypalApiBase(): string {
  const mode = Deno.env.get("PAYPAL_MODE") ?? "sandbox";
  return mode === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

export async function getPayPalAccessToken(): Promise<string> {
  const clientId = Deno.env.get("PAYPAL_CLIENT_ID");
  const secret = Deno.env.get("PAYPAL_CLIENT_SECRET");
  if (!clientId || !secret) {
    throw new Error("PayPal credentials not configured");
  }
  const credentials = btoa(`${clientId}:${secret}`);
  const res = await fetch(`${paypalApiBase()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) {
    throw new Error(`PayPal auth failed: ${res.status}`);
  }
  const data = await res.json();
  return data.access_token as string;
}
