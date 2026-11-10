# Paste LIVE PayPal credentials and your CRON_SECRET, then run from repo root.
# Requires: supabase CLI logged in and linked to this project.
#
# Usage:
#   cd C:\Users\SexyMimi\.app-store\play-and-earn
#   notepad scripts\go-live-payouts.ps1   # fill the three variables below
#   .\scripts\go-live-payouts.ps1

$ErrorActionPreference = "Stop"

$PayPalLiveClientId = "PASTE_LIVE_CLIENT_ID"
$PayPalLiveSecret = "PASTE_LIVE_SECRET"
$CronSecret = "PASTE_SAME_VALUE_AS_GITHUB_CRON_SECRET"

if ($PayPalLiveClientId -like "PASTE_*" -or $PayPalLiveSecret -like "PASTE_*" -or $CronSecret -like "PASTE_*") {
  Write-Host "Edit this script and set PayPal live Client ID, Secret, and CRON_SECRET first." -ForegroundColor Yellow
  exit 1
}

Write-Host "Setting Supabase secrets (LIVE payouts ON)..."
supabase secrets set `
  PAYPAL_MODE=live `
  PAYPAL_CLIENT_ID=$PayPalLiveClientId `
  PAYPAL_CLIENT_SECRET=$PayPalLiveSecret `
  PAYPAL_PAYOUTS_ENABLED=true `
  CRON_SECRET=$CronSecret

Write-Host "Deploying process-pending-payouts..."
supabase functions deploy process-pending-payouts --no-verify-jwt --yes

Write-Host "Done. Confirm GitHub secret CRON_SECRET matches. Run a smoke-test payout (see docs/GO_LIVE_ADS_AND_PAYOUTS.md)."
