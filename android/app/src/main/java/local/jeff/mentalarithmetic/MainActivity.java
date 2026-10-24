package local.jeff.mentalarithmetic;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.pm.ApplicationInfo;
import android.graphics.Color;
import android.graphics.Insets;
import android.net.Uri;
import android.net.http.SslError;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.view.WindowInsets;
import android.webkit.CookieManager;
import android.webkit.GeolocationPermissions;
import android.webkit.PermissionRequest;
import android.webkit.ServiceWorkerController;
import android.webkit.SslErrorHandler;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.TextView;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

/** Offline Android host for the unchanged Vite production frontend. */
public final class MainActivity extends Activity {
    private static final int SEPIA = Color.rgb(232, 215, 181);
    private WebView webView;
    private FrameLayout content;
    private boolean showingLoadError;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        configureSystemBars();

        content = new FrameLayout(this);
        content.setBackgroundColor(SEPIA);
        content.setOnApplyWindowInsetsListener((view, insets) -> {
            // API 35+ enforces edge-to-edge. Padding the native WebView container
            // gives the existing CSS a viewport above the keyboard and inside
            // status/navigation bars, including cutouts in either orientation.
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                Insets safe = insets.getInsets(WindowInsets.Type.systemBars()
                        | WindowInsets.Type.displayCutout() | WindowInsets.Type.ime());
                view.setPadding(safe.left, safe.top, safe.right, safe.bottom);
            } else {
                view.setPadding(insets.getSystemWindowInsetLeft(), insets.getSystemWindowInsetTop(),
                        insets.getSystemWindowInsetRight(), insets.getSystemWindowInsetBottom());
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) return WindowInsets.CONSUMED;
            return insets.consumeSystemWindowInsets();
        });
        setContentView(content);

        webView = new WebView(this);
        webView.setTag("mental-arithmetic-webview");
        webView.setBackgroundColor(SEPIA);
        configureWebView(webView);
        content.addView(webView, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        content.requestApplyInsets();
        webView.loadUrl(AssetPathPolicy.APP_URL);
    }

    @SuppressWarnings("deprecation")
    private void configureSystemBars() {
        Window window = getWindow();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            window.setDecorFitsSystemWindows(false);
        }
        // The light-bar flags also work before the decor is attached, when its
        // WindowInsetsController can still be null during Activity creation.
        window.getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR | View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            window.setNavigationBarContrastEnforced(false);
            window.setStatusBarContrastEnforced(false);
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    @SuppressWarnings("deprecation")
    private void configureWebView(WebView view) {
        // Only debug APKs expose Chrome DevTools; the delivered release does not.
        WebView.setWebContentsDebuggingEnabled(
                (getApplicationInfo().flags & ApplicationInfo.FLAG_DEBUGGABLE) != 0);
        WebSettings settings = view.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setAllowFileAccessFromFileURLs(false);
        settings.setAllowUniversalAccessFromFileURLs(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setBlockNetworkLoads(true);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        settings.setSupportMultipleWindows(false);
        settings.setGeolocationEnabled(false);
        settings.setSaveFormData(false);
        settings.setCacheMode(WebSettings.LOAD_NO_CACHE);
        settings.setMediaPlaybackRequiresUserGesture(true);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setSafeBrowsingEnabled(true);
        CookieManager.getInstance().setAcceptCookie(false);
        CookieManager.getInstance().setAcceptThirdPartyCookies(view, false);
        ServiceWorkerController.getInstance().getServiceWorkerWebSettings().setBlockNetworkLoads(true);
        ServiceWorkerController.getInstance().getServiceWorkerWebSettings().setAllowFileAccess(false);
        ServiceWorkerController.getInstance().getServiceWorkerWebSettings().setAllowContentAccess(false);

        // No JavaScript bridge, file picker, permission prompt or external intent.
        view.setDownloadListener((url, userAgent, disposition, mimeType, contentLength) -> {});
        view.setWebChromeClient(new WebChromeClient() {
            @Override public void onPermissionRequest(PermissionRequest request) { request.deny(); }
            @Override public void onGeolocationPermissionsShowPrompt(String origin,
                    GeolocationPermissions.Callback callback) { callback.invoke(origin, false, false); }
            @Override public boolean onShowFileChooser(WebView webView,
                    ValueCallback<Uri[]> callback, FileChooserParams params) { return false; }
        });
        view.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView webView, WebResourceRequest request) {
                return !request.isForMainFrame() || !AssetPathPolicy.isAppDocument(request.getUrl().toString());
            }

            @Override
            public WebResourceResponse shouldInterceptRequest(WebView webView, WebResourceRequest request) {
                if (!"GET".equals(request.getMethod())) return response(403, "Forbidden", "text/plain", empty());
                String path = AssetPathPolicy.assetPath(request.getUrl().toString());
                if (path == null) return response(403, "Forbidden", "text/plain", empty());
                try {
                    return response(200, "OK", AssetPathPolicy.mimeType(path), getAssets().open(path));
                } catch (IOException missingAsset) {
                    return response(404, "Not Found", "text/plain", empty());
                }
            }

            @Override public void onReceivedSslError(WebView webView, SslErrorHandler handler, SslError error) {
                handler.cancel();
            }

            @Override public void onReceivedError(WebView webView, WebResourceRequest request, WebResourceError error) {
                if (request.isForMainFrame()) showLoadError();
            }

            @Override public void onReceivedHttpError(WebView webView, WebResourceRequest request, WebResourceResponse error) {
                if (request.isForMainFrame()) showLoadError();
            }
        });
    }

    private static InputStream empty() { return new ByteArrayInputStream(new byte[0]); }

    private static WebResourceResponse response(int status, String reason, String mime, InputStream body) {
        Map<String, String> headers = new HashMap<>();
        headers.put("Content-Security-Policy", AssetPathPolicy.CONTENT_SECURITY_POLICY);
        headers.put("X-Content-Type-Options", "nosniff");
        headers.put("Cache-Control", "no-store");
        return new WebResourceResponse(mime, StandardCharsets.UTF_8.name(), status, reason, headers, body);
    }

    private void showLoadError() {
        if (showingLoadError || isFinishing()) return;
        showingLoadError = true;
        TextView error = new TextView(this);
        error.setText(R.string.load_error);
        error.setTextColor(Color.rgb(36, 30, 22));
        error.setTextSize(18);
        int padding = (int) (24 * getResources().getDisplayMetrics().density);
        error.setPadding(padding, padding, padding, padding);
        content.removeAllViews();
        content.addView(error);
    }

    @Override protected void onPause() {
        if (webView != null) webView.onPause();
        super.onPause();
    }

    @Override protected void onResume() {
        super.onResume();
        if (webView != null) webView.onResume();
    }

    @Override protected void onDestroy() {
        if (webView != null) {
            content.removeView(webView);
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
    }
}
