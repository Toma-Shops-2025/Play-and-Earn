import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import Stripe from "https://esm.sh/stripe@17.7.0?target=deno";

const PACKS: Record<
  string,
  { coins: number; name: string; unitAmount: number }
> = {
  coins_100: { coins: 100, name: "Starter coin pack", unitAmount: 99 },
  coins_500: { coins: 500, name: "Pro coin pack", unitAmount: 399 },
  coins_1200: { coins: 1200, name: "Mega coin pack", unitAmount: 799 },
};

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
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY");
    if (!stripeKey || !supabaseUrl || !supabaseAnon) {
      throw new Error("Missing Stripe or Supabase env configuration.");
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
    const pack = PACKS[packId as string];
    if (!pack) {
      return new Response(JSON.stringify({ error: "Invalid pack" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2024-12-18.acacia" });
    const origin = req.headers.get("origin") ?? "http://localhost:43123";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: `${origin}/?checkout=success`,
      cancel_url: `${origin}/?checkout=cancel`,
      client_reference_id: userData.user.id,
      metadata: {
        user_id: userData.user.id,
        pack_id: packId,
        coins: String(pack.coins),
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: pack.unitAmount,
            product_data: { name: pack.name },
          },
        },
      ],
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Checkout error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
