package com.playearn.arcade;

import android.app.Activity;
import android.util.Log;
import androidx.annotation.NonNull;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.unity3d.mediation.LevelPlay;
import com.unity3d.mediation.LevelPlayAdError;
import com.unity3d.mediation.LevelPlayAdInfo;
import com.unity3d.mediation.LevelPlayConfiguration;
import com.unity3d.mediation.LevelPlayInitError;
import com.unity3d.mediation.LevelPlayInitListener;
import com.unity3d.mediation.LevelPlayInitRequest;
import com.unity3d.mediation.rewarded.LevelPlayReward;
import com.unity3d.mediation.interstitial.LevelPlayInterstitialAd;
import com.unity3d.mediation.interstitial.LevelPlayInterstitialAdListener;
import com.unity3d.mediation.rewarded.LevelPlayRewardedAd;
import com.unity3d.mediation.rewarded.LevelPlayRewardedAdListener;

@CapacitorPlugin(name = "RewardedAds")
public class RewardedAdsPlugin extends Plugin {

    private static final String TAG = "RewardedAds";
    private boolean sdkInitialized = false;
    private boolean sdkInitInProgress = false;
    private final java.util.ArrayList<PluginCall> pendingInitCalls =
        new java.util.ArrayList<>();
    private LevelPlayRewardedAd rewardedAd;
    private LevelPlayInterstitialAd interstitialAd;
    private PluginCall pendingRewardedCall;
    private PluginCall pendingInterstitialCall;
    private boolean rewardGrantedThisShow = false;
    private boolean interstitialWasShown = false;

    @PluginMethod
    public void initialize(PluginCall call) {
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("No activity");
            return;
        }

        String appKey = activity.getString(R.string.levelplay_app_key);
        String rewardedAdUnitId = activity.getString(R.string.levelplay_rewarded_ad_unit_id);

        if (appKey.contains("REPLACE") || rewardedAdUnitId.contains("REPLACE")) {
            JSObject ret = new JSObject();
            ret.put("ok", false);
            ret.put(
                "message",
                "Set levelplay_app_key and levelplay_rewarded_ad_unit_id in res/values/levelplay.xml"
            );
            call.resolve(ret);
            return;
        }

        if (sdkInitialized) {
            JSObject ret = new JSObject();
            ret.put("ok", true);
            call.resolve(ret);
            return;
        }

        if (sdkInitInProgress) {
            pendingInitCalls.add(call);
            return;
        }
        sdkInitInProgress = true;
        pendingInitCalls.add(call);

        LevelPlayInitRequest initRequest =
            new LevelPlayInitRequest.Builder(appKey).build();

        LevelPlay.init(
            activity.getApplicationContext(),
            initRequest,
            new LevelPlayInitListener() {
                @Override
                public void onInitSuccess(@NonNull LevelPlayConfiguration configuration) {
                    sdkInitialized = true;
                    sdkInitInProgress = false;
                    createRewardedAd(rewardedAdUnitId);
                    createInterstitialAd(activity.getString(R.string.levelplay_interstitial_ad_unit_id));
                    finishInitCalls(true, null);
                }

                @Override
                public void onInitFailed(@NonNull LevelPlayInitError error) {
                    sdkInitInProgress = false;
                    String msg = humanizeLevelPlayError(error.getErrorMessage());
                    Log.e(TAG, "LevelPlay init failed: " + error.getErrorMessage());
                    finishInitCalls(false, msg);
                }
            }
        );
    }

    private void finishInitCalls(boolean ok, String message) {
        for (PluginCall pending : pendingInitCalls) {
            JSObject ret = new JSObject();
            ret.put("ok", ok);
            if (message != null) {
                ret.put("message", message);
            }
            pending.resolve(ret);
        }
        pendingInitCalls.clear();
    }

    private static String humanizeLevelPlayError(String raw) {
        if (raw == null || raw.isEmpty()) {
            return "Could not load ads. Check Unity LevelPlay setup.";
        }
        String lower = raw.toLowerCase();
        if (lower.contains("bad request") || lower.contains("400")) {
            return "Unity LevelPlay rejected the request (400). "
                + "Confirm levelplay.xml has your real App key and rewarded ad unit ID, "
                + "package name com.playearn.arcade matches the Unity dashboard, then rebuild the APK.";
        }
        if (lower.contains("replace_with")) {
            return "Set levelplay_app_key and ad unit IDs in res/values/levelplay.xml, then rebuild.";
        }
        return raw;
    }

    private void createRewardedAd(String adUnitId) {
        rewardedAd = new LevelPlayRewardedAd(adUnitId);
        rewardedAd.setListener(
            new LevelPlayRewardedAdListener() {
                @Override
                public void onAdLoaded(@NonNull LevelPlayAdInfo adInfo) {
                    Log.d(TAG, "Rewarded ad loaded");
                }

                @Override
                public void onAdLoadFailed(@NonNull LevelPlayAdError error) {
                    String msg = error.getErrorMessage();
                    Log.e(TAG, "Rewarded ad load failed: " + msg);
                    if (pendingRewardedCall != null) {
                        finishRewarded(false, humanizeLevelPlayError(msg));
                    }
                }

                @Override
                public void onAdDisplayed(@NonNull LevelPlayAdInfo adInfo) {
                    Log.d(TAG, "Rewarded ad displayed");
                }

                @Override
                public void onAdDisplayFailed(
                    @NonNull LevelPlayAdError error,
                    @NonNull LevelPlayAdInfo adInfo
                ) {
                    finishRewarded(false, humanizeLevelPlayError(error.getErrorMessage()));
                }

                @Override
                public void onAdRewarded(
                    @NonNull LevelPlayReward reward,
                    @NonNull LevelPlayAdInfo adInfo
                ) {
                    rewardGrantedThisShow = true;
                    finishRewarded(true, null);
                }

                @Override
                public void onAdClicked(@NonNull LevelPlayAdInfo adInfo) {}

                @Override
                public void onAdClosed(@NonNull LevelPlayAdInfo adInfo) {
                    if (pendingRewardedCall != null && !rewardGrantedThisShow) {
                        finishRewarded(false, "Ad closed before reward");
                    }
                    rewardGrantedThisShow = false;
                    if (rewardedAd != null) {
                        rewardedAd.loadAd();
                    }
                }
            }
        );
        rewardedAd.loadAd();
    }

    private void createInterstitialAd(String adUnitId) {
        if (adUnitId == null || adUnitId.contains("REPLACE")) {
            Log.w(TAG, "Interstitial ad unit not configured");
            return;
        }
        interstitialAd = new LevelPlayInterstitialAd(adUnitId);
        interstitialAd.setListener(
            new LevelPlayInterstitialAdListener() {
                @Override
                public void onAdLoaded(@NonNull LevelPlayAdInfo adInfo) {
                    Log.d(TAG, "Interstitial loaded");
                }

                @Override
                public void onAdLoadFailed(@NonNull LevelPlayAdError error) {
                    Log.e(TAG, "Interstitial load failed: " + error.getErrorMessage());
                }

                @Override
                public void onAdDisplayed(@NonNull LevelPlayAdInfo adInfo) {
                    interstitialWasShown = true;
                }

                @Override
                public void onAdDisplayFailed(
                    @NonNull LevelPlayAdError error,
                    @NonNull LevelPlayAdInfo adInfo
                ) {
                    finishInterstitial(false, error.getErrorMessage());
                }

                @Override
                public void onAdClicked(@NonNull LevelPlayAdInfo adInfo) {}

                @Override
                public void onAdClosed(@NonNull LevelPlayAdInfo adInfo) {
                    finishInterstitial(interstitialWasShown, null);
                    interstitialWasShown = false;
                    if (interstitialAd != null) {
                        interstitialAd.loadAd();
                    }
                }
            }
        );
        interstitialAd.loadAd();
    }

    @PluginMethod
    public void isRewardedAdReady(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("ready", rewardedAd != null && rewardedAd.isAdReady());
        call.resolve(ret);
    }

    @PluginMethod
    public void showRewardedAd(PluginCall call) {
        if (!sdkInitialized || rewardedAd == null) {
            JSObject ret = new JSObject();
            ret.put("rewarded", false);
            ret.put(
                "message",
                sdkInitInProgress
                    ? "Ads are still starting. Wait a moment and try again."
                    : "Ads not ready. Open Profile and confirm LevelPlay keys in levelplay.xml, then reinstall."
            );
            call.resolve(ret);
            return;
        }
        if (!rewardedAd.isAdReady()) {
            rewardedAd.loadAd();
            JSObject ret = new JSObject();
            ret.put("rewarded", false);
            ret.put(
                "message",
                "No ad loaded yet — connect to the internet, wait a few seconds, and tap again."
            );
            call.resolve(ret);
            return;
        }
        if (pendingRewardedCall != null || pendingInterstitialCall != null) {
            JSObject ret = new JSObject();
            ret.put("rewarded", false);
            ret.put("message", "An ad is already playing.");
            call.resolve(ret);
            return;
        }
        pendingRewardedCall = call;
        rewardGrantedThisShow = false;
        Activity activity = getActivity();
        if (activity == null) {
            pendingRewardedCall = null;
            JSObject ret = new JSObject();
            ret.put("rewarded", false);
            ret.put("message", "App is not in the foreground.");
            call.resolve(ret);
            return;
        }
        rewardedAd.showAd(activity);
    }

    @PluginMethod
    public void isInterstitialAdReady(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("ready", interstitialAd != null && interstitialAd.isAdReady());
        call.resolve(ret);
    }

    @PluginMethod
    public void showInterstitialAd(PluginCall call) {
        if (!sdkInitialized || interstitialAd == null) {
            call.reject("Interstitial not configured");
            return;
        }
        if (!interstitialAd.isAdReady()) {
            interstitialAd.loadAd();
            call.reject("Interstitial not ready yet");
            return;
        }
        if (pendingInterstitialCall != null || pendingRewardedCall != null) {
            call.reject("Ad already in progress");
            return;
        }
        pendingInterstitialCall = call;
        interstitialWasShown = false;
        Activity activity = getActivity();
        if (activity == null) {
            pendingInterstitialCall = null;
            call.reject("No activity");
            return;
        }
        interstitialAd.showAd(activity);
    }

    private void finishRewarded(boolean rewarded, String message) {
        if (pendingRewardedCall == null) return;
        JSObject ret = new JSObject();
        ret.put("rewarded", rewarded);
        if (message != null) {
            ret.put("message", message);
        }
        pendingRewardedCall.resolve(ret);
        pendingRewardedCall = null;
    }

    private void finishInterstitial(boolean shown, String message) {
        if (pendingInterstitialCall == null) return;
        JSObject ret = new JSObject();
        ret.put("shown", shown);
        if (message != null) {
            ret.put("message", message);
        }
        pendingInterstitialCall.resolve(ret);
        pendingInterstitialCall = null;
    }
}
