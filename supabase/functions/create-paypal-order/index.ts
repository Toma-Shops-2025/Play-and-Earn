import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import {
  PAYPAL_PACKS,
  getPayPalAccessToken,
  paypalApiBase,
} from "../_shared/paypal.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !supabaseAnon) {
      throw new Error("Missing Supabase configuration");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { packId } = await req.json();
    const pack = PAYPAL_PACKS[packId as string];
    if (!pack) {
      return new Response(JSON.stringify({ error: "Invalid pack" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const origin = req.headers.get("origin") ?? "http://localhost:43123";
    const token = await getPayPalAccessToken();
    const customId = `${userData.user.id}|${packId}|${pack.coins}`;

    const orderRes = await fetch(`${paypalApiBase()}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            custom_id: customId,
            description: pack.name,
            amount: {
              currency_code: "USD",
              value: pack.priceUsd,
            },
          },
        ],
        application_context: {
          brand_name: "Play Earn Arcade",
          user_action: "PAY_NOW",
          return_url: `${origin}/?paypal=success`,
          cancel_url: `${origin}/?paypal=cancel`,
        },
      }),
    });

    if (!orderRes.ok) {
      const errText = await orderRes.text();
      throw new Error(`PayPal order failed: ${errText}`);
    }

    const order = await orderRes.json();
    const approveUrl = (order.links as Array<{ rel: string; href: string }>).find(
      (l) => l.rel === "approve",
    )?.href;

    if (!approveUrl) {
      throw new Error("PayPal approve URL missing");
    }

    return new Response(
      JSON.stringify({ url: approveUrl, orderId: order.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "PayPal order error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
