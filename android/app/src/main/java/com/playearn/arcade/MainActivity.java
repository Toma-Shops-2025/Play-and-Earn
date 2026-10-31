package com.playearn.arcade;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(RewardedAdsPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
