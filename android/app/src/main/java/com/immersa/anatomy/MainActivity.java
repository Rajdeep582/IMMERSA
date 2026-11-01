package com.immersa.anatomy;

import android.os.Build;
import android.os.Bundle;
import android.view.WindowManager;
import android.webkit.WebSettings;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // GPU-composited window for the WebGL canvas.
        getWindow().setFlags(
            WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED,
            WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED
        );
        WebView webView = getBridge().getWebView();
        WebSettings settings = webView.getSettings();
        // The UI sizes itself in CSS px; Android's font-scale setting would otherwise inflate text and break layouts.
        settings.setTextZoom(100);
        // Pinch is handled by the 3D viewer, not page zoom.
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setMediaPlaybackRequiresUserGesture(true);
        // Keep the renderer process at foreground priority while visible so the GPU process is not throttled;
        // it drops automatically when the app goes to the background (frees memory for other apps).
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            webView.setRendererPriorityPolicy(WebView.RENDERER_PRIORITY_IMPORTANT, true);
        }
        webView.setOverScrollMode(WebView.OVER_SCROLL_NEVER);
    }
}
