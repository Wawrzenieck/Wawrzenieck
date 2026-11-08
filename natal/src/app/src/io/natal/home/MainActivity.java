package io.natal.home;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.pm.ActivityInfo;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.drawable.Drawable;
import android.net.Uri;
import android.os.Bundle;
import android.provider.Settings;
import android.view.KeyEvent;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * A Christmas home screen for a small Android TV box: a web page (assets/web) in a WebView, with the family photos
 * (pushed to the app's own folder, files/fotos, never inside the app) and the TV's apps reached through window.TV.
 */
public class MainActivity extends Activity {
    // Murici, AL: the weather card's city.
    static final String LAT = "-9.3069", LON = "-35.9428";

    private WebView web;
    private boolean loaded;
    private final Map<String, byte[]> icons = new ConcurrentHashMap<>();

    /** Not in "Todos os apps": this screen itself and the box's own launchers. */
    private static final Set<String> HIDDEN = new HashSet<>(Arrays.asList(
            "io.natal.home", "com.droidlogic.mboxlauncher", "com.android.tv.launcher", "com.google.android.tvlauncher",
            "com.android.launcher3", "com.android.launcher"));

    @Override protected void onCreate(Bundle state) {
        super.onCreate(state);
        web = new WebView(this);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(true);
        s.setTextZoom(100);
        s.setMinimumFontSize(1);
        s.setUseWideViewPort(true);        // laid out at 1920 x 1080, scaled to the screen
        s.setLoadWithOverviewMode(true);
        s.setMediaPlaybackRequiresUserGesture(true);
        web.setBackgroundColor(Color.rgb(32, 10, 8));
        web.setVerticalScrollBarEnabled(false);
        web.setHorizontalScrollBarEnabled(false);
        web.setFocusable(true);
        web.setFocusableInTouchMode(true);
        web.addJavascriptInterface(new Bridge(), "TV");
        web.setWebChromeClient(new android.webkit.WebChromeClient() {
            @Override public boolean onConsoleMessage(android.webkit.ConsoleMessage m) {
                if (m.messageLevel() == android.webkit.ConsoleMessage.MessageLevel.ERROR) android.util.Log.w("NatalHome", m.message());
                return true;
            }
        });
        web.setWebViewClient(new WebViewClient() {
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest req) {
                Uri u = req.getUrl();
                if (!"tv.local".equals(u.getHost()) || u.getPath() == null) return null;
                try {
                    String name = u.getLastPathSegment();
                    if (u.getPath().startsWith("/icon/")) {
                        byte[] png = icon(name);
                        if (png != null) return new WebResourceResponse("image/png", null, new ByteArrayInputStream(png));
                    } else if (u.getPath().startsWith("/photo/")) {
                        File f = new File(photoDir(), name);
                        if (f.isFile() && f.getParentFile().equals(photoDir())) {
                            return new WebResourceResponse("image/jpeg", null, new FileInputStream(f));
                        }
                    }
                } catch (Exception ignored) {
                }
                return new WebResourceResponse("text/plain", "utf-8", 404, "Not Found", null, null);
            }

            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest req) {
                return true;
            }

            @Override public void onPageFinished(WebView view, String url) {
                loaded = true;
                web.requestFocus();
            }
        });
        setContentView(web);
        web.loadUrl("file:///android_asset/web/index.html");
    }

    private File photoDir() {
        File d = getExternalFilesDir("fotos");
        if (d != null && !d.exists()) d.mkdirs();
        return d;
    }

    @Override protected void onResume() {
        super.onResume();
        web.onResume();
        web.resumeTimers();
        web.requestFocus();
        js("window.onResume && onResume()");
    }

    @Override protected void onPause() {
        js("window.onPause && onPause()");
        web.onPause();
        super.onPause();
    }

    @Override protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        js("window.reset && reset()");   // Home pressed on the home screen
    }

    @Override protected void onDestroy() {
        web.destroy();
        super.onDestroy();
    }

    @Override public boolean dispatchKeyEvent(KeyEvent e) {
        if (e.getKeyCode() == KeyEvent.KEYCODE_BACK) {   // the home screen never closes: the page decides
            if (e.getAction() == KeyEvent.ACTION_UP) js("window.onBack && onBack()");
            return true;
        }
        return super.dispatchKeyEvent(e);
    }

    private void js(String code) {
        if (loaded) web.evaluateJavascript(code, null);
    }

    private Intent launchIntent(String pkg) {
        PackageManager pm = getPackageManager();
        Intent i = pm.getLeanbackLaunchIntentForPackage(pkg);
        return i != null ? i : pm.getLaunchIntentForPackage(pkg);
    }

    /** The app's TV banner (or its icon on a white card), 320 x 180. */
    private byte[] icon(String pkg) {
        byte[] cached = icons.get(pkg);
        if (cached != null) return cached;
        PackageManager pm = getPackageManager();
        Drawable banner = null, icon = null;
        try {
            Intent launch = launchIntent(pkg);
            if (launch != null && launch.getComponent() != null) {
                ActivityInfo ai = pm.getActivityInfo(launch.getComponent(), 0);
                banner = ai.loadBanner(pm);
                if (banner == null) icon = ai.loadIcon(pm);
            }
            if (banner == null) banner = pm.getApplicationBanner(pkg);
            if (banner == null && icon == null) icon = pm.getApplicationIcon(pkg);
        } catch (PackageManager.NameNotFoundException | RuntimeException e) {
            return null;
        }
        Bitmap b = Bitmap.createBitmap(640, 360, Bitmap.Config.ARGB_8888);
        Canvas c = new Canvas(b);
        if (banner != null) {
            banner.setBounds(0, 0, 640, 360);
            banner.draw(c);
        } else {
            c.drawColor(Color.WHITE);
            icon.setBounds(320 - 110, 180 - 110, 320 + 110, 180 + 110);
            icon.draw(c);
        }
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        b.compress(Bitmap.CompressFormat.PNG, 100, out);
        byte[] png = out.toByteArray();
        icons.put(pkg, png);
        return png;
    }

    private final class Bridge {
        /** Every app the box can open, by name. */
        @JavascriptInterface public String apps() {
            JSONArray out = new JSONArray();
            Set<String> seen = new HashSet<>();
            PackageManager pm = getPackageManager();
            try {
                String[] cats = {Intent.CATEGORY_LEANBACK_LAUNCHER, Intent.CATEGORY_LAUNCHER};
                for (String cat : cats) {
                    List<ResolveInfo> list = pm.queryIntentActivities(new Intent(Intent.ACTION_MAIN).addCategory(cat), 0);
                    for (ResolveInfo ri : list) {
                        String pkg = ri.activityInfo.packageName;
                        if (HIDDEN.contains(pkg) || !seen.add(pkg)) continue;
                        boolean system = (ri.activityInfo.applicationInfo.flags & ApplicationInfo.FLAG_SYSTEM) != 0;
                        out.put(new JSONObject().put("pkg", pkg).put("label", String.valueOf(ri.loadLabel(pm))).put("system", system));
                    }
                }
            } catch (Exception ignored) {
            }
            return out.toString();
        }

        @JavascriptInterface public boolean installed(String pkg) {
            return launchIntent(pkg) != null;
        }

        @JavascriptInterface public String photos() {
            JSONArray out = new JSONArray();
            File[] files = photoDir() == null ? null : photoDir().listFiles();
            if (files != null) {
                Arrays.sort(files);
                for (File f : files) {
                    String n = f.getName().toLowerCase();
                    if (f.isFile() && (n.endsWith(".jpg") || n.endsWith(".jpeg") || n.endsWith(".png") || n.endsWith(".webp"))) out.put(f.getName());
                }
            }
            return out.toString();
        }

        @JavascriptInterface public void open(final String pkg) {
            runOnUiThread(() -> {
                try {
                    Intent i = "settings".equals(pkg) ? new Intent(Settings.ACTION_SETTINGS) : launchIntent(pkg);
                    if (i == null) return;
                    i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED);
                    startActivity(i);
                } catch (ActivityNotFoundException | SecurityException ignored) {
                }
            });
        }

        /** Today's weather (Open-Meteo), handed back to window.onWeather(json). */
        @JavascriptInterface public void weather() {
            new Thread(() -> {
                String body = null;
                try {
                    URL url = new URL("https://api.open-meteo.com/v1/forecast?latitude=" + LAT + "&longitude=" + LON
                            + "&current=temperature_2m,weather_code,is_day&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=1");
                    HttpURLConnection c = (HttpURLConnection) url.openConnection();
                    c.setConnectTimeout(10000);
                    c.setReadTimeout(10000);
                    try (InputStream in = c.getInputStream()) {
                        ByteArrayOutputStream out = new ByteArrayOutputStream();
                        byte[] buf = new byte[8192];
                        int n;
                        while ((n = in.read(buf)) > 0) out.write(buf, 0, n);
                        body = out.toString("UTF-8");
                    }
                } catch (Exception ignored) {
                }
                final String json = body == null ? "null" : JSONObject.quote(body);
                // Straight to the page: the first answer can come before onPageFinished.
                runOnUiThread(() -> web.evaluateJavascript("window.onWeather && onWeather(" + json + ")", null));
            }).start();
        }
    }
}
