package com.playearn.arcade;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.unity3d.mediation.LevelPlay;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(RewardedAdsPlugin.class);
        super.onCreate(savedInstanceState);
    }

    @Override
    public void onResume() {
        super.onResume();
        LevelPlay.onResume(this);
    }

    @Override
    public void onPause() {
        LevelPlay.onPause(this);
        super.onPause();
    }
}
