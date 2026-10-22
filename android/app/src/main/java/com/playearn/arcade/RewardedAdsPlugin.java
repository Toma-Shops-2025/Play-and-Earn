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
import com.unity3d.mediation.rewarded.LevelPlayRewardedAd;
import com.unity3d.mediation.rewarded.LevelPlayRewardedAdListener;

@CapacitorPlugin(name = "RewardedAds")
public class RewardedAdsPlugin extends Plugin {

    private static final String TAG = "RewardedAds";
    private boolean sdkInitialized = false;
    private LevelPlayRewardedAd rewardedAd;
    private PluginCall pendingCall;
    private boolean rewardGrantedThisShow = false;

    @PluginMethod
    public void initialize(PluginCall call) {
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("No activity");
            return;
        }

        String appKey = activity.getString(R.string.levelplay_app_key);
        String adUnitId = activity.getString(R.string.levelplay_rewarded_ad_unit_id);

        if (appKey.contains("REPLACE") || adUnitId.contains("REPLACE")) {
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

        LevelPlayInitRequest initRequest =
            new LevelPlayInitRequest.Builder(appKey).build();

        LevelPlay.init(
            activity.getApplicationContext(),
            initRequest,
            new LevelPlayInitListener() {
                @Override
                public void onInitSuccess(@NonNull LevelPlayConfiguration configuration) {
                    sdkInitialized = true;
                    createRewardedAd(adUnitId);
                    JSObject ret = new JSObject();
                    ret.put("ok", true);
                    call.resolve(ret);
                }

                @Override
                public void onInitFailed(@NonNull LevelPlayInitError error) {
                    Log.e(TAG, "LevelPlay init failed: " + error.getErrorMessage());
                    JSObject ret = new JSObject();
                    ret.put("ok", false);
                    ret.put("message", error.getErrorMessage());
                    call.resolve(ret);
                }
            }
        );
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
                    Log.e(TAG, "Rewarded ad load failed: " + error.getErrorMessage());
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
                    finishPending(false, error.getErrorMessage());
                }

                @Override
                public void onAdRewarded(
                    @NonNull LevelPlayReward reward,
                    @NonNull LevelPlayAdInfo adInfo
                ) {
                    rewardGrantedThisShow = true;
                    finishPending(true, null);
                }

                @Override
                public void onAdClicked(@NonNull LevelPlayAdInfo adInfo) {}

                @Override
                public void onAdClosed(@NonNull LevelPlayAdInfo adInfo) {
                    if (pendingCall != null && !rewardGrantedThisShow) {
                        finishPending(false, "Ad closed before reward");
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

    @PluginMethod
    public void isRewardedAdReady(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("ready", rewardedAd != null && rewardedAd.isAdReady());
        call.resolve(ret);
    }

    @PluginMethod
    public void showRewardedAd(PluginCall call) {
        if (!sdkInitialized || rewardedAd == null) {
            call.reject("LevelPlay not initialized");
            return;
        }
        if (!rewardedAd.isAdReady()) {
            rewardedAd.loadAd();
            call.reject("Ad not ready yet. Try again in a few seconds.");
            return;
        }
        if (pendingCall != null) {
            call.reject("Ad already in progress");
            return;
        }
        pendingCall = call;
        rewardGrantedThisShow = false;
        Activity activity = getActivity();
        if (activity == null) {
            pendingCall = null;
            call.reject("No activity");
            return;
        }
        rewardedAd.showAd(activity);
    }

    private void finishPending(boolean rewarded, String message) {
        if (pendingCall == null) return;
        JSObject ret = new JSObject();
        ret.put("rewarded", rewarded);
        if (message != null) {
            ret.put("message", message);
        }
        pendingCall.resolve(ret);
        pendingCall = null;
    }
}
