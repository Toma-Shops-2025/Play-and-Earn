package com.playearn.arcade;

import android.app.Activity;
import android.util.Log;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.unity3d.ads.IUnityAdsInitializationListener;
import com.unity3d.ads.IUnityAdsLoadListener;
import com.unity3d.ads.IUnityAdsShowListener;
import com.unity3d.ads.UnityAds;
import com.unity3d.ads.UnityAdsShowOptions;
import com.unity3d.ads.UnityAdsLoadOptions;

@CapacitorPlugin(name = "RewardedAds")
public class RewardedAdsPlugin extends Plugin {

    private static final String TAG = "RewardedAds";
    private boolean unityInitialized = false;
    private boolean unityInitInProgress = false;
    private final java.util.ArrayList<PluginCall> pendingInitCalls =
        new java.util.ArrayList<>();

    private String rewardedPlacementId;
    private String interstitialPlacementId;
    private boolean rewardedLoaded = false;
    private boolean interstitialLoaded = false;

    private PluginCall pendingRewardedCall;
    private PluginCall pendingInterstitialCall;

    @PluginMethod
    public void initialize(PluginCall call) {
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("No activity");
            return;
        }

        String gameId = activity.getString(R.string.levelplay_app_key);
        rewardedPlacementId = activity.getString(R.string.levelplay_rewarded_ad_unit_id);
        interstitialPlacementId = activity.getString(R.string.levelplay_interstitial_ad_unit_id);

        if (gameId.contains("REPLACE") || rewardedPlacementId.contains("REPLACE")) {
            JSObject ret = new JSObject();
            ret.put("ok", false);
            ret.put(
                "message",
                "Set levelplay_app_key (Android Game ID) and placement IDs in res/values/levelplay.xml"
            );
            call.resolve(ret);
            return;
        }

        if (unityInitialized) {
            JSObject ret = new JSObject();
            ret.put("ok", true);
            call.resolve(ret);
            return;
        }

        if (unityInitInProgress) {
            pendingInitCalls.add(call);
            return;
        }
        unityInitInProgress = true;
        pendingInitCalls.add(call);

        boolean testMode = activity.getResources().getBoolean(R.bool.unity_ads_test_mode);

        UnityAds.initialize(
            activity.getApplicationContext(),
            gameId,
            testMode,
            new IUnityAdsInitializationListener() {
                @Override
                public void onInitializationComplete() {
                    unityInitialized = true;
                    unityInitInProgress = false;
                    loadRewarded();
                    loadInterstitial();
                    finishInitCalls(true, null);
                }

                @Override
                public void onInitializationFailed(
                    UnityAds.UnityAdsInitializationError error,
                    String message
                ) {
                    unityInitInProgress = false;
                    String msg = "Unity Ads init failed: " + error + " — " + message;
                    Log.e(TAG, msg);
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

    private void loadRewarded() {
        if (rewardedPlacementId == null || rewardedPlacementId.contains("REPLACE")) return;
        rewardedLoaded = false;
        UnityAds.load(
            rewardedPlacementId,
            new UnityAdsLoadOptions(),
            new IUnityAdsLoadListener() {
                @Override
                public void onUnityAdsAdLoaded(String placementId) {
                    rewardedLoaded = true;
                    Log.d(TAG, "Rewarded placement loaded");
                }

                @Override
                public void onUnityAdsFailedToLoad(
                    String placementId,
                    UnityAds.UnityAdsLoadError error,
                    String message
                ) {
                    rewardedLoaded = false;
                    Log.e(TAG, "Rewarded load failed: " + error + " " + message);
                }
            }
        );
    }

    private void loadInterstitial() {
        if (interstitialPlacementId == null || interstitialPlacementId.contains("REPLACE")) {
            return;
        }
        interstitialLoaded = false;
        UnityAds.load(
            interstitialPlacementId,
            new UnityAdsLoadOptions(),
            new IUnityAdsLoadListener() {
                @Override
                public void onUnityAdsAdLoaded(String placementId) {
                    interstitialLoaded = true;
                    Log.d(TAG, "Interstitial placement loaded");
                }

                @Override
                public void onUnityAdsFailedToLoad(
                    String placementId,
                    UnityAds.UnityAdsLoadError error,
                    String message
                ) {
                    interstitialLoaded = false;
                    Log.e(TAG, "Interstitial load failed: " + error + " " + message);
                }
            }
        );
    }

    @PluginMethod
    public void isRewardedAdReady(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("ready", unityInitialized && rewardedLoaded);
        call.resolve(ret);
    }

    @PluginMethod
    public void showRewardedAd(PluginCall call) {
        if (!unityInitialized) {
            JSObject ret = new JSObject();
            ret.put("rewarded", false);
            ret.put("message", "Ads not ready. Wait a moment and try again.");
            call.resolve(ret);
            return;
        }
        if (!rewardedLoaded) {
            loadRewarded();
            JSObject ret = new JSObject();
            ret.put("rewarded", false);
            ret.put(
                "message",
                "No ad loaded yet. Wait a few seconds on Wi‑Fi and try again. Enable Test mode in Unity → Settings."
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

        Activity activity = getActivity();
        if (activity == null) {
            JSObject ret = new JSObject();
            ret.put("rewarded", false);
            ret.put("message", "App is not in the foreground.");
            call.resolve(ret);
            return;
        }

        pendingRewardedCall = call;
        UnityAds.show(
            activity,
            rewardedPlacementId,
            new UnityAdsShowOptions(),
            new IUnityAdsShowListener() {
                @Override
                public void onUnityAdsShowFailure(
                    String placementId,
                    UnityAds.UnityAdsShowError error,
                    String message
                ) {
                    finishRewarded(false, "Show failed: " + message);
                    rewardedLoaded = false;
                    loadRewarded();
                }

                @Override
                public void onUnityAdsShowStart(String placementId) {
                    Log.d(TAG, "Rewarded show start");
                }

                @Override
                public void onUnityAdsShowClick(String placementId) {}

                @Override
                public void onUnityAdsShowComplete(
                    String placementId,
                    UnityAds.UnityAdsShowCompletionState state
                ) {
                    boolean rewarded =
                        state == UnityAds.UnityAdsShowCompletionState.COMPLETED;
                    finishRewarded(
                        rewarded,
                        rewarded ? null : "Ad closed before reward"
                    );
                    rewardedLoaded = false;
                    loadRewarded();
                }
            }
        );
    }

    @PluginMethod
    public void isInterstitialAdReady(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("ready", unityInitialized && interstitialLoaded);
        call.resolve(ret);
    }

    @PluginMethod
    public void showInterstitialAd(PluginCall call) {
        if (!unityInitialized || interstitialPlacementId == null) {
            call.reject("Interstitial not configured");
            return;
        }
        if (!interstitialLoaded) {
            loadInterstitial();
            call.reject("Interstitial not ready yet");
            return;
        }
        if (pendingInterstitialCall != null || pendingRewardedCall != null) {
            call.reject("Ad already in progress");
            return;
        }

        Activity activity = getActivity();
        if (activity == null) {
            call.reject("No activity");
            return;
        }

        pendingInterstitialCall = call;
        final boolean[] shown = {false};
        UnityAds.show(
            activity,
            interstitialPlacementId,
            new UnityAdsShowOptions(),
            new IUnityAdsShowListener() {
                @Override
                public void onUnityAdsShowFailure(
                    String placementId,
                    UnityAds.UnityAdsShowError error,
                    String message
                ) {
                    finishInterstitial(false, message);
                    interstitialLoaded = false;
                    loadInterstitial();
                }

                @Override
                public void onUnityAdsShowStart(String placementId) {
                    shown[0] = true;
                }

                @Override
                public void onUnityAdsShowClick(String placementId) {}

                @Override
                public void onUnityAdsShowComplete(
                    String placementId,
                    UnityAds.UnityAdsShowCompletionState state
                ) {
                    finishInterstitial(shown[0], null);
                    interstitialLoaded = false;
                    loadInterstitial();
                }
            }
        );
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
