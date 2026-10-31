import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { getPayPalAccessToken, paypalApiBase } from "../_shared/paypal.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const cronSecret = Deno.env.get("CRON_SECRET");
  const headerSecret = req.headers.get("x-cron-secret");
  const authHeader = req.headers.get("Authorization");
  const bearerOk =
    cronSecret && authHeader === `Bearer ${cronSecret}`;
  const headerOk = cronSecret && headerSecret === cronSecret;

  if (!cronSecret || (!bearerOk && !headerOk)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (Deno.env.get("PAYPAL_PAYOUTS_ENABLED") !== "true") {
    return new Response(
      JSON.stringify({
        ok: true,
        skipped: true,
        message: "Set PAYPAL_PAYOUTS_ENABLED=true to run automatic payouts.",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRole) {
    return new Response(JSON.stringify({ error: "Missing Supabase config" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const admin = createClient(supabaseUrl, serviceRole);
  const { data: rows, error } = await admin
    .from("withdrawals")
    .select("id, amount, payout_email")
    .eq("status", "pending")
    .not("payout_email", "is", null)
    .order("created_at", { ascending: true })
    .limit(20);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!rows?.length) {
    return new Response(JSON.stringify({ ok: true, processed: 0 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const token = await getPayPalAccessToken();
  let processed = 0;
  const results: Array<{ id: string; status: string }> = [];

  for (const row of rows) {
    const email = row.payout_email as string;
    const amount = Number(row.amount).toFixed(2);
    const withdrawalId = row.id as string;

    const { data: marked } = await admin.rpc("mark_withdrawal_processing", {
      p_withdrawal_id: withdrawalId,
    });
    if (!marked) continue;

    const batchId = `wd_${withdrawalId}_${Date.now()}`;
    const payoutRes = await fetch(`${paypalApiBase()}/v1/payments/payouts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender_batch_header: {
          sender_batch_id: batchId,
          email_subject: "Your Play N' Earn payout",
          email_message: "You received a payout. Thank you for playing!",
        },
        items: [
          {
            recipient_type: "EMAIL",
            amount: { value: amount, currency: "USD" },
            receiver: email,
            note: "Play N' Earn withdrawal",
            sender_item_id: withdrawalId,
          },
        ],
      }),
    });

    if (payoutRes.ok) {
      const body = await payoutRes.json();
      const paypalBatchId = body.batch_header?.payout_batch_id ?? batchId;
      await admin.rpc("complete_withdrawal_payout", {
        p_withdrawal_id: withdrawalId,
        p_batch_id: String(paypalBatchId),
        p_success: true,
        p_failure_reason: null,
      });
      processed += 1;
      results.push({ id: withdrawalId, status: "completed" });
    } else {
      const errText = await payoutRes.text();
      await admin.rpc("complete_withdrawal_payout", {
        p_withdrawal_id: withdrawalId,
        p_batch_id: batchId,
        p_success: false,
        p_failure_reason: errText.slice(0, 500),
      });
      results.push({ id: withdrawalId, status: "failed" });
    }
  }

  return new Response(JSON.stringify({ ok: true, processed, results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
