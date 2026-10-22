import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { getPayPalAccessToken, paypalApiBase } from "../_shared/paypal.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function parseCustomId(customId: string) {
  const [userId, packId, coinsStr] = customId.split("|");
  const coins = Number.parseInt(coinsStr ?? "0", 10);
  if (!userId || !packId || coins < 1) return null;
  return { userId, packId, coins };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseAnon || !serviceRole) {
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

    const { orderId } = await req.json();
    if (!orderId) {
      return new Response(JSON.stringify({ error: "orderId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = await getPayPalAccessToken();
    const captureRes = await fetch(
      `${paypalApiBase()}/v2/checkout/orders/${orderId}/capture`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!captureRes.ok) {
      const errText = await captureRes.text();
      throw new Error(`PayPal capture failed: ${errText}`);
    }

    const capture = await captureRes.json();
    const unit = capture.purchase_units?.[0];
    const customId = unit?.payments?.captures?.[0]?.custom_id ?? unit?.custom_id;
    if (!customId || typeof customId !== "string") {
      throw new Error("Missing PayPal custom_id");
    }

    const parsed = parseCustomId(customId);
    if (!parsed || parsed.userId !== userData.user.id) {
      return new Response(JSON.stringify({ error: "Order does not match user" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceRole);
    const { data: credited, error: creditError } = await admin.rpc(
      "credit_purchased_coins",
      {
        p_user_id: parsed.userId,
        p_coins: parsed.coins,
        p_payment_reference: orderId,
      },
    );

    if (creditError) {
      throw creditError;
    }

    return new Response(
      JSON.stringify({
        ok: true,
        credited: Boolean(credited),
        coins: parsed.coins,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Capture error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
