package com.playearn.arcade;

import android.app.Activity;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;

import androidx.annotation.Nullable;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.unity3d.ads.AdExpiredListener;
import com.unity3d.ads.InitializationConfiguration;
import com.unity3d.ads.InitializationListener;
import com.unity3d.ads.InterstitialAd;
import com.unity3d.ads.InterstitialShowListener;
import com.unity3d.ads.LoadConfiguration;
import com.unity3d.ads.LoadListener;
import com.unity3d.ads.RewardedAd;
import com.unity3d.ads.RewardedShowListener;
import com.unity3d.ads.ShowConfiguration;
import com.unity3d.ads.ShowFinishState;
import com.unity3d.ads.UnityAds;
import com.unity3d.ads.UnityAdsError;

@CapacitorPlugin(name = "RewardedAds")
public class RewardedAdsPlugin extends Plugin {

    private static final String TAG = "RewardedAds";
    private static final long READY_WAIT_MS = 12_000L;
    private static final long READY_POLL_MS = 250L;

    private final Handler mainHandler = new Handler(Looper.getMainLooper());

    private boolean unityInitialized = false;
    private boolean unityInitInProgress = false;
    private final java.util.ArrayList<PluginCall> pendingInitCalls =
        new java.util.ArrayList<>();

    private String gameId;
    private String rewardedPlacementId;
    private String interstitialPlacementId;
    private boolean testMode;

    @Nullable private RewardedAd rewardedAd;
    @Nullable private InterstitialAd interstitialAd;

    private PluginCall pendingRewardedCall;
    private PluginCall pendingInterstitialCall;

    @PluginMethod
    public void initialize(PluginCall call) {
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("No activity");
            return;
        }

        gameId = activity.getString(R.string.levelplay_app_key);
        rewardedPlacementId = activity.getString(R.string.levelplay_rewarded_ad_unit_id);
        interstitialPlacementId = activity.getString(R.string.levelplay_interstitial_ad_unit_id);
        testMode = activity.getResources().getBoolean(R.bool.unity_ads_test_mode);

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

        InitializationConfiguration configuration =
            new InitializationConfiguration.Builder(gameId).withTestMode(testMode).build();

        UnityAds.initialize(
            activity.getApplicationContext(),
            configuration,
            new InitializationListener() {
                @Override
                public void onInitializationComplete(@Nullable UnityAdsError error) {
                    unityInitInProgress = false;
                    if (error == null) {
                        unityInitialized = true;
                        loadRewarded();
                        loadInterstitial();
                        finishInitCalls(true, null);
                        Log.i(TAG, "Unity Ads initialized (testMode=" + testMode + ")");
                    } else {
                        String msg = "Unity Ads init failed: " + errorMessage(error);
                        Log.e(TAG, msg);
                        finishInitCalls(false, msg);
                    }
                }
            }
        );
    }

    private void finishInitCalls(boolean ok, @Nullable String message) {
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
        if (rewardedPlacementId == null || rewardedPlacementId.contains("REPLACE")) {
            return;
        }
        LoadConfiguration config = new LoadConfiguration.Builder(rewardedPlacementId).build();

        RewardedAd.load(
            config,
            new LoadListener<RewardedAd>() {
                @Override
                public void onAdLoaded(@Nullable RewardedAd ad, @Nullable UnityAdsError error) {
                    if (ad != null) {
                        rewardedAd = ad;
                        ad.setOnAdExpired(
                            new AdExpiredListener<RewardedAd>() {
                                @Override
                                public void onAdExpired(RewardedAd expiredAd) {
                                    if (rewardedAd == expiredAd) {
                                        rewardedAd = null;
                                    }
                                    loadRewarded();
                                }
                            }
                        );
                        Log.d(TAG, "Rewarded placement loaded");
                    } else {
                        rewardedAd = null;
                        Log.e(TAG, "Rewarded load failed: " + errorMessage(error));
                    }
                }
            }
        );
    }

    private void loadInterstitial() {
        if (interstitialPlacementId == null || interstitialPlacementId.contains("REPLACE")) {
            return;
        }
        LoadConfiguration config = new LoadConfiguration.Builder(interstitialPlacementId).build();

        InterstitialAd.load(
            config,
            new LoadListener<InterstitialAd>() {
                @Override
                public void onAdLoaded(
                    @Nullable InterstitialAd ad,
                    @Nullable UnityAdsError error
                ) {
                    if (ad != null) {
                        interstitialAd = ad;
                        ad.setOnAdExpired(
                            new AdExpiredListener<InterstitialAd>() {
                                @Override
                                public void onAdExpired(InterstitialAd expiredAd) {
                                    if (interstitialAd == expiredAd) {
                                        interstitialAd = null;
                                    }
                                    loadInterstitial();
                                }
                            }
                        );
                        Log.d(TAG, "Interstitial placement loaded");
                    } else {
                        interstitialAd = null;
                        Log.e(TAG, "Interstitial load failed: " + errorMessage(error));
                    }
                }
            }
        );
    }

    @PluginMethod
    public void isRewardedAdReady(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("ready", unityInitialized && rewardedAd != null);
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
        if (pendingRewardedCall != null || pendingInterstitialCall != null) {
            JSObject ret = new JSObject();
            ret.put("rewarded", false);
            ret.put("message", "An ad is already playing.");
            call.resolve(ret);
            return;
        }

        waitForReady(
            () -> rewardedAd != null,
            this::loadRewarded,
            ready -> {
                if (!ready || rewardedAd == null) {
                    JSObject ret = new JSObject();
                    ret.put("rewarded", false);
                    ret.put(
                        "message",
                        "No ad loaded yet. Wait a few seconds on Wi‑Fi and try again."
                    );
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
                ShowConfiguration config = new ShowConfiguration.Builder().build();

                final boolean[] resolved = {false};
                final boolean[] earnedReward = {false};
                RewardedAd adToShow = rewardedAd;
                rewardedAd = null;

                adToShow.show(
                    activity,
                    config,
                    new RewardedShowListener() {
                        @Override
                        public void onStarted(RewardedAd ad) {
                            Log.d(TAG, "Rewarded show start");
                        }

                        @Override
                        public void onClicked(RewardedAd ad) {}

                        @Override
                        public void onRewarded(RewardedAd ad) {
                            earnedReward[0] = true;
                            finishRewarded(true, null);
                        }

                        @Override
                        public void onCompleted(RewardedAd ad, ShowFinishState state) {
                            boolean rewarded =
                                earnedReward[0] || state == ShowFinishState.COMPLETED;
                            finishRewarded(
                                rewarded,
                                rewarded ? null : "Ad closed before reward"
                            );
                            loadRewarded();
                        }

                        @Override
                        public void onFailed(RewardedAd ad, UnityAdsError error) {
                            finishRewarded(false, "Show failed: " + errorMessage(error));
                            loadRewarded();
                        }
                    }
                );
            }
        );
    }

    private void finishRewarded(boolean rewarded, @Nullable String message) {
        if (pendingRewardedCall == null) return;
        JSObject ret = new JSObject();
        ret.put("rewarded", rewarded);
        if (message != null) {
            ret.put("message", message);
        }
        pendingRewardedCall.resolve(ret);
        pendingRewardedCall = null;
    }

    @PluginMethod
    public void isInterstitialAdReady(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("ready", unityInitialized && interstitialAd != null);
        call.resolve(ret);
    }

    @PluginMethod
    public void showInterstitialAd(PluginCall call) {
        if (!unityInitialized || interstitialPlacementId == null) {
            JSObject ret = new JSObject();
            ret.put("shown", false);
            ret.put("message", "Interstitial not configured");
            call.resolve(ret);
            return;
        }
        if (pendingInterstitialCall != null || pendingRewardedCall != null) {
            JSObject ret = new JSObject();
            ret.put("shown", false);
            ret.put("message", "Ad already in progress");
            call.resolve(ret);
            return;
        }

        waitForReady(
            () -> interstitialAd != null,
            this::loadInterstitial,
            ready -> {
                if (!ready || interstitialAd == null) {
                    JSObject ret = new JSObject();
                    ret.put("shown", false);
                    ret.put("message", "Interstitial not ready yet");
                    call.resolve(ret);
                    return;
                }

                Activity activity = getActivity();
                if (activity == null) {
                    JSObject ret = new JSObject();
                    ret.put("shown", false);
                    ret.put("message", "No activity");
                    call.resolve(ret);
                    return;
                }

                pendingInterstitialCall = call;
                ShowConfiguration config = new ShowConfiguration.Builder().build();
                InterstitialAd adToShow = interstitialAd;
                interstitialAd = null;
                final boolean[] shown = {false};

                adToShow.show(
                    activity,
                    config,
                    new InterstitialShowListener() {
                        @Override
                        public void onStarted(InterstitialAd ad) {
                            shown[0] = true;
                        }

                        @Override
                        public void onClicked(InterstitialAd ad) {}

                        @Override
                        public void onCompleted(InterstitialAd ad, ShowFinishState state) {
                            finishInterstitial(shown[0], null);
                            loadInterstitial();
                        }

                        @Override
                        public void onFailed(InterstitialAd ad, UnityAdsError error) {
                            finishInterstitial(false, errorMessage(error));
                            loadInterstitial();
                        }
                    }
                );
            }
        );
    }

    private void finishInterstitial(boolean shown, @Nullable String message) {
        if (pendingInterstitialCall == null) return;
        JSObject ret = new JSObject();
        ret.put("shown", shown);
        if (message != null) {
            ret.put("message", message);
        }
        pendingInterstitialCall.resolve(ret);
        pendingInterstitialCall = null;
    }

    private interface ReadyCheck {
        boolean isReady();
    }

    private interface ReadyCallback {
        void onResult(boolean ready);
    }

    private void waitForReady(ReadyCheck check, Runnable triggerLoad, ReadyCallback callback) {
        if (check.isReady()) {
            callback.onResult(true);
            return;
        }

        triggerLoad.run();
        final long deadline = System.currentTimeMillis() + READY_WAIT_MS;

        Runnable poll =
            new Runnable() {
                @Override
                public void run() {
                    if (check.isReady()) {
                        callback.onResult(true);
                        return;
                    }
                    if (System.currentTimeMillis() >= deadline) {
                        callback.onResult(false);
                        return;
                    }
                    mainHandler.postDelayed(this, READY_POLL_MS);
                }
            };
        mainHandler.postDelayed(poll, READY_POLL_MS);
    }

    private static String errorMessage(@Nullable UnityAdsError error) {
        if (error == null) {
            return "Unknown error";
        }
        String message = error.getMessage();
        if (message == null || message.isEmpty()) {
            return "UnityAdsError code=" + error.getCode();
        }
        return message;
    }
}
