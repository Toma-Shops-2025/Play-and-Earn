import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

function parseCustomId(customId: string) {
  const [userId, , coinsStr] = customId.split("|");
  const coins = Number.parseInt(coinsStr ?? "0", 10);
  if (!userId || coins < 1) return null;
  return { userId, coins };
}

Deno.serve(async (req) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRole) {
    return new Response("Missing configuration", { status: 500 });
  }

  try {
    const event = await req.json();
    const eventType = event.event_type as string;

    if (
      eventType !== "PAYMENT.CAPTURE.COMPLETED" &&
      eventType !== "CHECKOUT.ORDER.COMPLETED"
    ) {
      return new Response(JSON.stringify({ received: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const resource = event.resource ?? {};
    const orderId =
      resource.supplementary_data?.related_ids?.order_id ??
      resource.id ??
      resource.order_id;
    const customId =
      resource.custom_id ??
      resource.purchase_units?.[0]?.custom_id ??
      resource.purchase_units?.[0]?.payments?.captures?.[0]?.custom_id;

    if (!orderId || !customId || typeof customId !== "string") {
      return new Response(JSON.stringify({ received: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const parsed = parseCustomId(customId);
    if (!parsed) {
      return new Response("Invalid custom_id", { status: 400 });
    }

    const admin = createClient(supabaseUrl, serviceRole);
    await admin.rpc("credit_purchased_coins", {
      p_user_id: parsed.userId,
      p_coins: parsed.coins,
      p_payment_reference: String(orderId),
    });

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response("Webhook error", { status: 500 });
  }
});
