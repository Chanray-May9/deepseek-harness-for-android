package com.deepseek.harness.android;

import android.R;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.ActivityNotFoundException;
import android.content.DialogInterface;
import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.Message;
import android.util.Base64;
import android.view.View;
import android.webkit.CookieManager;
import android.webkit.DownloadListener;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.URLUtil;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;
import com.deepseek.harness.android.MainActivity;
import com.deepseek.harness.android.RuntimeService;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Iterator;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;
import org.apache.commons.codec.digest.MessageDigestAlgorithms;
import org.apache.commons.compress.harmony.unpack200.IcTuple;
import org.apache.commons.io.IOUtils;
import org.json.JSONObject;

/* loaded from: D:\deepseek harness workspace\dsh-android\build\apk-unpack\classes.dex */
public final class MainActivity extends Activity implements RuntimeService.Observer {
    private static final int AUDIO = 13;
    private static final int FILE_UPLOAD = 10;
    private static final int IMPORT = 11;
    private static final int SAVE = 12;
    private PermissionRequest audioRequest;
    private ValueCallback<Uri[]> fileCallback;
    private String loadedUrl;
    private LinearLayout loading;
    private LinearLayout loadingActions;
    private ProgressBar loadingProgress;
    private File pendingExport;
    private TextView status;
    private WebView web;
    private int startupPhase = 0;
    private String launchHash = "";
    private final Handler main = new Handler(Looper.getMainLooper());

    @Override // android.app.Activity
    public void onCreate(Bundle bundle) {
        super.onCreate(bundle);
        if ((getApplicationInfo().flags & 2) != 0) {
            WebView.setWebContentsDebuggingEnabled(true);
        }
        FrameLayout frameLayout = new FrameLayout(this);
        this.web = new WebView(this);
        /* The composer is a contenteditable div inside the page: the WebView itself
           has to own focus, otherwise the IME never attaches and no soft keyboard
           appears on tap. */
        this.web.setFocusable(true);
        this.web.setFocusableInTouchMode(true);
        this.web.requestFocusFromTouch();
        this.web.setOnTouchListener(new View.OnTouchListener() {
            @Override
            public boolean onTouch(View view, android.view.MotionEvent motionEvent) {
                if (motionEvent.getAction() == android.view.MotionEvent.ACTION_DOWN) {
                    view.requestFocus();
                }
                return false;
            }
        });
        WebSettings settings = this.web.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(true);
        settings.setAllowFileAccessFromFileURLs(false);
        settings.setAllowUniversalAccessFromFileURLs(false);
        settings.setMixedContentMode(1);
        settings.setSupportMultipleWindows(true);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        settings.setMediaPlaybackRequiresUserGesture(true);
        settings.setTextZoom(100);
        CookieManager.getInstance().setAcceptCookie(true);
        this.web.setWebViewClient(new WebViewClient() { // from class: com.deepseek.harness.android.MainActivity.1
            @Override // android.webkit.WebViewClient
            public boolean shouldOverrideUrlLoading(WebView webView, WebResourceRequest webResourceRequest) {
                if (MainActivity.local(webResourceRequest.getUrl()) || !webResourceRequest.isForMainFrame()) {
                    return false;
                }
                MainActivity.this.external(webResourceRequest.getUrl());
                return true;
            }

            @Override // android.webkit.WebViewClient
            public void onPageFinished(WebView webView, String str) {
                if (MainActivity.local(Uri.parse(str))) {
                    CookieManager.getInstance().flush();
                    injectSystemInsets(webView);
                }
            }

            @Override // android.webkit.WebViewClient
            public void onReceivedError(WebView webView, WebResourceRequest webResourceRequest, WebResourceError webResourceError) {
                if (webResourceRequest.isForMainFrame()) {
                    MainActivity.this.showStartupFailure("暂时无法打开本地工作区");
                    RuntimeService.log("WebView: " + String.valueOf(webResourceError.getDescription()));
                }
            }
        });
        this.web.setWebChromeClient(new AnonymousClass2());
        this.web.addJavascriptInterface(new ExportBridge(), "HarnessAndroidExport");
        this.web.setDownloadListener(new DownloadListener() { // from class: com.deepseek.harness.android.MainActivity$$ExternalSyntheticLambda7
            @Override // android.webkit.DownloadListener
            public final void onDownloadStart(String str, String str2, String str3, String str4, long j) {
                MainActivity.this.lambda$onCreate$1(str, str2, str3, str4, j);
            }
        });
        frameLayout.addView(this.web, new FrameLayout.LayoutParams(-1, -1));
        this.loading = new LinearLayout(this);
        this.loading.setOrientation(1);
        this.loading.setGravity(17);
        this.loading.setPadding(dp(28), dp(28), dp(28), dp(28));
        this.loading.setBackgroundColor(-1);
        ImageView imageView = new ImageView(this);
        imageView.setImageResource(getResources().getIdentifier("ic_whale", "drawable", getPackageName()));
        imageView.setContentDescription("DeepSeek");
        this.loading.addView(imageView, new LinearLayout.LayoutParams(dp(64), dp(64)));
        this.status = new TextView(this);
        this.status.setGravity(17);
        this.status.setTextSize(14.0f);
        this.status.setTextColor(-9866366);
        this.status.setVisibility(8);
        LinearLayout.LayoutParams layoutParams = new LinearLayout.LayoutParams(-2, -2);
        layoutParams.topMargin = dp(24);
        this.loading.addView(this.status, layoutParams);
        this.loadingActions = new LinearLayout(this);
        this.loadingActions.setGravity(17);
        this.loadingActions.setVisibility(8);
        Button button = new Button(this, null, R.attr.borderlessButtonStyle);
        button.setText("重试");
        button.setTextColor(-11703298);
        button.setOnClickListener(new View.OnClickListener() { // from class: com.deepseek.harness.android.MainActivity$$ExternalSyntheticLambda8
            @Override // android.view.View.OnClickListener
            public final void onClick(View view) {
                MainActivity.this.lambda$onCreate$2(view);
            }
        });
        this.loadingActions.addView(button);
        Button button2 = new Button(this, null, R.attr.borderlessButtonStyle);
        button2.setText("查看详情");
        button2.setTextColor(-9866366);
        button2.setOnClickListener(new View.OnClickListener() { // from class: com.deepseek.harness.android.MainActivity$$ExternalSyntheticLambda9
            @Override // android.view.View.OnClickListener
            public final void onClick(View view) {
                MainActivity.this.lambda$onCreate$3(view);
            }
        });
        this.loadingActions.addView(button2);
        this.loading.addView(this.loadingActions);
        frameLayout.addView(this.loading, new FrameLayout.LayoutParams(-1, -1));
        applyStartupTheme(getPreferences(0).getBoolean("startup_dark", (getResources().getConfiguration().uiMode & 48) == 32));
        setContentView(frameLayout);
        applyEdgeToEdge();
        RuntimeService.observers.add(this);
        changed();
        startRuntime();
    }

    /* renamed from: com.deepseek.harness.android.MainActivity$2, reason: invalid class name */
    class AnonymousClass2 extends WebChromeClient {
        AnonymousClass2() {
        }

        @Override // android.webkit.WebChromeClient
        public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> valueCallback, WebChromeClient.FileChooserParams fileChooserParams) {
            if (MainActivity.this.fileCallback != null) {
                MainActivity.this.fileCallback.onReceiveValue(null);
            }
            MainActivity.this.fileCallback = valueCallback;
            Intent type = new Intent("android.intent.action.OPEN_DOCUMENT").addCategory("android.intent.category.OPENABLE").setType("*/*");
            type.putExtra("android.intent.extra.ALLOW_MULTIPLE", fileChooserParams.getMode() == 1);
            MainActivity.this.startActivityForResult(type, 10);
            return true;
        }

        @Override // android.webkit.WebChromeClient
        public void onPermissionRequest(final PermissionRequest permissionRequest) {
            MainActivity.this.main.post(new Runnable() { // from class: com.deepseek.harness.android.MainActivity$2$$ExternalSyntheticLambda0
                @Override // java.lang.Runnable
                public final void run() {
                    MainActivity.AnonymousClass2.this.lambda$onPermissionRequest$0(permissionRequest);
                }
            });
        }

        /* JADX INFO: Access modifiers changed from: private */
        public /* synthetic */ void lambda$onPermissionRequest$0(PermissionRequest permissionRequest) {
            if (!MainActivity.local(permissionRequest.getOrigin()) || !Arrays.asList(permissionRequest.getResources()).contains("android.webkit.resource.AUDIO_CAPTURE")) {
                permissionRequest.deny();
            } else if (MainActivity.this.checkSelfPermission("android.permission.RECORD_AUDIO") != 0) {
                MainActivity.this.audioRequest = permissionRequest;
                MainActivity.this.requestPermissions(new String[]{"android.permission.RECORD_AUDIO"}, 13);
            } else {
                permissionRequest.grant(new String[]{"android.webkit.resource.AUDIO_CAPTURE"});
            }
        }

        @Override // android.webkit.WebChromeClient
        public boolean onCreateWindow(WebView webView, boolean z, boolean z2, Message message) {
            if (!z2) {
                return false;
            }
            WebView webView2 = new WebView(MainActivity.this);
            webView2.setWebViewClient(new WebViewClient() { // from class: com.deepseek.harness.android.MainActivity.2.1
                @Override // android.webkit.WebViewClient
                public boolean shouldOverrideUrlLoading(WebView webView3, WebResourceRequest webResourceRequest) {
                    MainActivity.this.external(webResourceRequest.getUrl());
                    webView3.destroy();
                    return true;
                }
            });
            ((WebView.WebViewTransport) message.obj).setWebView(webView2);
            message.sendToTarget();
            return true;
        }
    }

    /* JADX INFO: Access modifiers changed from: private */
    public /* synthetic */ void lambda$onCreate$1(final String str, String str2, final String str3, final String str4, long j) {
        if (!str.startsWith("blob:")) {
            if (local(Uri.parse(str))) {
                new Thread(new Runnable() { // from class: com.deepseek.harness.android.MainActivity$$ExternalSyntheticLambda11
                    @Override // java.lang.Runnable
                    public final void run() {
                        MainActivity.this.lambda$onCreate$0(str, str3, str4);
                    }
                }, "harness-download").start();
                return;
            } else {
                external(Uri.parse(str));
                return;
            }
        }
        String quote = JSONObject.quote(str);
        String mime = str4 == null ? "application/octet-stream" : str4;
        this.web.evaluateJavascript("(async()=>{try{const r=await fetch(" + quote + ");const b=await r.blob();if(b.size>33554432)throw Error('文件超过 32 MB，请通过工作区导出');const f=new FileReader();f.onload=()=>HarnessAndroidExport.save(String(f.result).split(',')[1],'download'," + JSONObject.quote(mime) + ");f.readAsDataURL(b);}catch(e){HarnessAndroidExport.error(String(e));}})()", null);
    }

    /* JADX INFO: Access modifiers changed from: private */
    public /* synthetic */ void lambda$onCreate$2(View view) {
        this.loadedUrl = null;
        this.loadingActions.setVisibility(8);
        this.status.setVisibility(8);
        startRuntime();
    }

    /* JADX INFO: Access modifiers changed from: private */
    public /* synthetic */ void lambda$onCreate$3(View view) {
        showLogs();
    }

    private void tapWeb(int x, int y) {
        try {
            long now = android.os.SystemClock.uptimeMillis();
            android.view.MotionEvent down = android.view.MotionEvent.obtain(now, now, android.view.MotionEvent.ACTION_DOWN, x, y, 0);
            this.web.dispatchTouchEvent(down);
            down.recycle();
            android.view.MotionEvent up = android.view.MotionEvent.obtain(now, now + 60, android.view.MotionEvent.ACTION_UP, x, y, 0);
            this.web.dispatchTouchEvent(up);
            up.recycle();
        } catch (Throwable ignored) {
        }
    }

    private int dp(int i) {
        return Math.round(i * getResources().getDisplayMetrics().density);
    }

    /* JADX INFO: Access modifiers changed from: private */
    public static boolean local(Uri uri) {
        return "http".equals(uri.getScheme()) && "127.0.0.1".equals(uri.getHost()) && uri.getPort() == RuntimeService.port;
    }

    /* JADX INFO: Access modifiers changed from: private */
    public void external(Uri uri) {
        if (Arrays.asList("http", "https", "mailto", "tel").contains(uri.getScheme())) {
            try {
                startActivity(new Intent("android.intent.action.VIEW", uri));
            } catch (ActivityNotFoundException e) {
                toast("没有可以打开此链接的应用");
            }
        }
    }

    private void startRuntime() {
        startForegroundService(new Intent(this, (Class<?>) RuntimeService.class));
    }

    /* Edge-to-edge: the page owns the whole window, including the strips under
       the status and navigation bars. Insets are handed to CSS so content can
       keep clear of them while overlays still cover the full screen. */
    private void applyEdgeToEdge() {
        android.view.Window window = getWindow();
        window.addFlags(android.view.WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
        window.setStatusBarColor(0);
        window.setNavigationBarColor(0);
        window.getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                        | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                        | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                        | View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR
                        | View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR);
        int top = systemBars();
        this.web.setPadding(0, 0, 0, 0);
        this.loading.setPadding(dp(28), dp(28) + top, dp(28), dp(28));
    }

    private int dimension(String name) {
        int id = getResources().getIdentifier(name, "dimen", "android");
        return id > 0 ? getResources().getDimensionPixelSize(id) : 0;
    }

    private int systemBars() {
        int top = dimension("status_bar_height");
        if (top <= 0) {
            android.util.DisplayMetrics metrics = new android.util.DisplayMetrics();
            getWindowManager().getDefaultDisplay().getMetrics(metrics);
            top = Math.round(24 * metrics.density);
        }
        return top;
    }

    /* Real bottom inset: the resource is a fixed 48dp even under gesture
       navigation, which leaves the composer floating. Cap it so the send button
       stays clear of a three-button bar while gesture phones get a tight edge. */
    private int bottomInset() {
        int bottom = 0;
        android.view.WindowInsets insets = getWindow().getDecorView().getRootWindowInsets();
        if (insets != null) {
            bottom = insets.getSystemWindowInsetBottom();
        }
        if (bottom <= 0) {
            bottom = dimension("navigation_bar_height");
        }
        return Math.min(bottom, dp(28));
    }

    private void injectSystemInsets(WebView target) {
        if (target == null) {
            return;
        }
        int top = systemBars();
        int bottom = bottomInset();
        String css = "document.documentElement.style.setProperty('--hm-inset-top','" + top + "px');"
                + "document.documentElement.style.setProperty('--hm-inset-bottom','" + bottom + "px');";
        target.evaluateJavascript(css, null);
    }

    /* JADX INFO: Access modifiers changed from: private */
    public void applyStartupTheme(boolean z) {
        int i = z ? -15658475 : -1;
        this.loading.setBackgroundColor(i);
        for (int i2 = 0; i2 < this.loading.getChildCount(); i2++) {
            View childAt = this.loading.getChildAt(i2);
            if (childAt instanceof TextView) {
                ((TextView) childAt).setTextColor(z ? -5656647 : -9866366);
            }
        }
        getWindow().setStatusBarColor(0);
        getWindow().setNavigationBarColor(0);
        int systemUiVisibility = getWindow().getDecorView().getSystemUiVisibility();
        int themed = z ? systemUiVisibility & (-8209) : systemUiVisibility | 8192 | 16;
        /* Keep edge-to-edge across theme switches; otherwise the theme callback
           resets the flags and the bars get an opaque grey fill. */
        themed |= View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION;
        getWindow().getDecorView().setSystemUiVisibility(themed);
    }

    /* JADX INFO: Access modifiers changed from: private */
    public void showStartupFailure(String str) {
        this.loading.setVisibility(0);
        this.loadingActions.setVisibility(0);
        this.status.setVisibility(0);
        this.status.setText(str);
    }

    private String hash(String str) {
        try {
            byte[] digest = MessageDigest.getInstance(MessageDigestAlgorithms.SHA_256).digest(str.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : digest) {
                sb.append(String.format("%02x", Integer.valueOf(b & 255)));
            }
            return sb.toString();
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    private void updateStartup(String str) {
        if (str.contains("失败") || str.contains("已退出") || str.equals("已停止")) {
            showStartupFailure("启动未完成，请重试");
        }
    }

    @Override // com.deepseek.harness.android.RuntimeService.Observer
    public void changed() {
        this.main.post(new Runnable() { // from class: com.deepseek.harness.android.MainActivity$$ExternalSyntheticLambda3
            @Override // java.lang.Runnable
            public final void run() {
                MainActivity.this.lambda$changed$5();
            }
        });
    }

    /* JADX INFO: Access modifiers changed from: private */
    public /* synthetic */ void lambda$changed$5() {
        if (isFinishing()) {
            return;
        }
        updateStartup(RuntimeService.status);
        String str = RuntimeService.launchUrl;
        if (str != null && !str.equals(this.loadedUrl)) {
            this.loadedUrl = str;
            this.launchHash = hash(str);
            /* dsh issues a fresh token on every engine start, so the cached
               token-less URL is never valid: always load the current launch URL. */
            this.web.loadUrl(str);
            /* harnessNativeReveal: the overlay is only dismissed by the page's own
               ready() call, which is timing dependent. Reveal unconditionally after
               a short grace period so a slow or silent bridge can never leave the
               app stuck on "connection is slow". */
            this.main.postDelayed(new Runnable() {
                @Override // java.lang.Runnable
                public final void run() {
                    if (MainActivity.this.loading.getVisibility() == 0) {
                        MainActivity.this.loading.setVisibility(8);
                        RuntimeService.log("ANDROID_NATIVE_REVEAL");
                    }
                }
            }, 12000L);
            /* harnessTouchWarmup: the model picker stays inert until the sidebar has
               been opened and closed once by a real touch. Synthetic .click() is
               ignored by React, so replay genuine MotionEvents at the drawer
               button's position. */
            this.main.postDelayed(new Runnable() {
                @Override // java.lang.Runnable
                public final void run() {
                    MainActivity.this.tapWeb(dp(40), dp(42));
                    MainActivity.this.main.postDelayed(new Runnable() {
                        @Override // java.lang.Runnable
                        public final void run() {
                            /* close via the scrim area, not the toggle: while the
                               drawer is open the toggle is covered by it. */
                            MainActivity.this.tapWeb(dp(360), dp(420));
                        }
                    }, 900L);
                }
            }, 6000L);
            this.main.postDelayed(new Runnable() { // from class: com.deepseek.harness.android.MainActivity$$ExternalSyntheticLambda6
                @Override // java.lang.Runnable
                public final void run() {
                    MainActivity.this.lambda$changed$4();
                }
            }, 45000L);
        }
        if (str == null) {
            this.loading.setVisibility(0);
        }
    }

    /* JADX INFO: Access modifiers changed from: private */
    public /* synthetic */ void lambda$changed$4() {
        if (this.loading.getVisibility() != 0 || RuntimeService.launchUrl == null) {
            return;
        }
        showStartupFailure("工作区连接较慢，请重试");
    }

    /* JADX INFO: Access modifiers changed from: private */
    public void menu() {
        new AlertDialog.Builder(this).setTitle("DeepSeek Harness").setItems(new String[]{"重新加载界面", "导入文件到默认工作区", "导出默认工作区 ZIP", "查看运行日志", "启动运行环境", "停止运行环境", "安装 Git/Python 等开发工具", "版本与运行环境"}, new DialogInterface.OnClickListener() { // from class: com.deepseek.harness.android.MainActivity$$ExternalSyntheticLambda10
            @Override // android.content.DialogInterface.OnClickListener
            public final void onClick(DialogInterface dialogInterface, int i) {
                MainActivity.this.lambda$menu$6(dialogInterface, i);
            }
        }).show();
    }

    /* JADX INFO: Access modifiers changed from: private */
    public /* synthetic */ void lambda$menu$6(DialogInterface dialogInterface, int i) {
        switch (i) {
            case 0:
                if (RuntimeService.launchUrl == null) {
                    startRuntime();
                    break;
                } else {
                    this.web.reload();
                    break;
                }
            case 1:
                startActivityForResult(new Intent("android.intent.action.OPEN_DOCUMENT").addCategory("android.intent.category.OPENABLE").setType("*/*").putExtra("android.intent.extra.ALLOW_MULTIPLE", true), 11);
                break;
            case 2:
                new Thread(new Runnable() { // from class: com.deepseek.harness.android.MainActivity$$ExternalSyntheticLambda12
                    @Override // java.lang.Runnable
                    public final void run() {
                        MainActivity.this.exportWorkspace();
                    }
                }, "harness-export").start();
                break;
            case 3:
                showLogs();
                break;
            case 4:
                startRuntime();
                break;
            case 5:
                stopService(new Intent(this, (Class<?>) RuntimeService.class));
                showStartupFailure("运行环境已停止");
                break;
            case 6:
                startForegroundService(new Intent(this, (Class<?>) RuntimeService.class).setAction("TOOLS"));
                toast("正在安装开发工具，进度可在运行日志查看。");
                break;
            case 7:
                new AlertDialog.Builder(this).setTitle("版本与运行环境").setMessage("DeepSeek Harness 0.2.1-rc.2\n非官方 Android 移植版 0.2.1-android.5\n\n运行时与文件均在手机本地。模型调用需要网络及你自己的账户或 API Key。\n\n使用 DeepSeek Harness（MIT）及 PRoot（GPLv2）。\n安装包附带源代码和第三方许可。\n\n当前构建仍需按功能对照清单验收。").setPositiveButton("关闭", (DialogInterface.OnClickListener) null).show();
                break;
        }
    }

    private void showLogs() {
        TextView textView = new TextView(this);
        textView.setTextIsSelectable(true);
        textView.setPadding(24, 16, 24, 16);
        textView.setTextSize(11.0f);
        textView.setText(RuntimeService.logs());
        ScrollView scrollView = new ScrollView(this);
        scrollView.addView(textView);
        new AlertDialog.Builder(this).setTitle("本地运行日志").setView(scrollView).setPositiveButton("关闭", (DialogInterface.OnClickListener) null).show();
    }

    /* JADX INFO: Access modifiers changed from: private */
    public /* synthetic */ void lambda$toast$7(String str) {
        Toast.makeText(this, str, 1).show();
    }

    /* JADX INFO: Access modifiers changed from: private */
    public void toast(final String str) {
        this.main.post(new Runnable() { // from class: com.deepseek.harness.android.MainActivity$$ExternalSyntheticLambda5
            @Override // java.lang.Runnable
            public final void run() {
                MainActivity.this.lambda$toast$7(str);
            }
        });
    }

    @Override // android.app.Activity
    protected void onDestroy() {
        RuntimeService.observers.remove(this);
        if (this.fileCallback != null) {
            this.fileCallback.onReceiveValue(null);
        }
        this.web.destroy();
        super.onDestroy();
    }

    /* JADX INFO: Access modifiers changed from: private */
    public /* synthetic */ void lambda$onBackPressed$8(String str) {
        if ("true".equals(str)) {
            return;
        }
        if (this.web.canGoBack()) {
            this.web.goBack();
        } else {
            moveTaskToBack(true);
        }
    }

    @Override // android.app.Activity
    public void onBackPressed() {
        if (this.loading.getVisibility() != 8) {
            moveTaskToBack(true);
        } else {
            this.web.evaluateJavascript("Boolean(window.HarnessMobile&&HarnessMobile.back())", new ValueCallback() { // from class: com.deepseek.harness.android.MainActivity$$ExternalSyntheticLambda0
                @Override // android.webkit.ValueCallback
                public final void onReceiveValue(Object obj) {
                    MainActivity.this.lambda$onBackPressed$8((String) obj);
                }
            });
        }
    }

    @Override // android.app.Activity
    public void onRequestPermissionsResult(int i, String[] strArr, int[] iArr) {
        super.onRequestPermissionsResult(i, strArr, iArr);
        if (i != 13 || this.audioRequest == null) {
            return;
        }
        if (iArr.length <= 0 || iArr[0] != 0) {
            this.audioRequest.deny();
        } else {
            this.audioRequest.grant(new String[]{"android.webkit.resource.AUDIO_CAPTURE"});
        }
        this.audioRequest = null;
    }

    @Override // android.app.Activity
    protected void onActivityResult(int i, int i2, final Intent intent) {
        super.onActivityResult(i, i2, intent);
        if (i == 10) {
            if (this.fileCallback != null) {
                this.fileCallback.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(i2, intent));
                this.fileCallback = null;
                return;
            }
            return;
        }
        if (i2 != -1 || intent == null) {
            return;
        }
        if (i == 11) {
            new Thread(new Runnable() { // from class: com.deepseek.harness.android.MainActivity$$ExternalSyntheticLambda1
                @Override // java.lang.Runnable
                public final void run() {
                    MainActivity.this.lambda$onActivityResult$9(intent);
                }
            }, "harness-import").start();
        }
        if (i != 12 || this.pendingExport == null) {
            return;
        }
        final File file = this.pendingExport;
        this.pendingExport = null;
        final Uri data = intent.getData();
        new Thread(new Runnable() { // from class: com.deepseek.harness.android.MainActivity$$ExternalSyntheticLambda2
            @Override // java.lang.Runnable
            public final void run() {
                MainActivity.this.lambda$onActivityResult$10(file, data);
            }
        }, "harness-save").start();
    }

    /* JADX INFO: Access modifiers changed from: private */
    public /* synthetic */ void lambda$onActivityResult$9(Intent intent) {
        try {
            ArrayList arrayList = new ArrayList();
            if (intent.getClipData() != null) {
                for (int i = 0; i < intent.getClipData().getItemCount(); i++) {
                    arrayList.add(intent.getClipData().getItemAt(i).getUri());
                }
            } else if (intent.getData() != null) {
                arrayList.add(intent.getData());
            }
            File file = new File(RuntimeInstaller.root(this), "root/workspace/deepseek-harness/default-workspace/imports");
            file.mkdirs();
            Iterator it = arrayList.iterator();
            while (it.hasNext()) {
                Uri uri = (Uri) it.next();
                String str = "import-" + System.currentTimeMillis();
                Cursor query = getContentResolver().query(uri, new String[]{"_display_name"}, null, null, null);
                if (query != null) {
                    try {
                        if (query.moveToFirst()) {
                            str = query.getString(0);
                        }
                    } catch (Throwable th) {
                        if (query == null) {
                            throw th;
                        }
                        try {
                            query.close();
                            throw th;
                        } catch (Throwable th2) {
                            th.addSuppressed(th2);
                            throw th;
                        }
                    }
                }
                if (query != null) {
                    query.close();
                }
                String replaceAll = str.replaceAll("[^\\p{L}\\p{N}._ -]", "_");
                if (replaceAll.equals(".") || replaceAll.equals("..") || replaceAll.isEmpty()) {
                    replaceAll = "import";
                }
                File file2 = new File(file, replaceAll);
                if (file2.exists()) {
                    file2 = new File(file, System.currentTimeMillis() + "-" + replaceAll);
                }
                InputStream openInputStream = getContentResolver().openInputStream(uri);
                try {
                    FileOutputStream fileOutputStream = new FileOutputStream(file2);
                    try {
                        copy(openInputStream, fileOutputStream);
                        fileOutputStream.close();
                        if (openInputStream != null) {
                            openInputStream.close();
                        }
                    } catch (Throwable th3) {
                        try {
                            fileOutputStream.close();
                        } catch (Throwable th4) {
                            th3.addSuppressed(th4);
                        }
                        throw th3;
                    }
                } catch (Throwable th5) {
                    if (openInputStream == null) {
                        throw th5;
                    }
                    try {
                        openInputStream.close();
                        throw th5;
                    } catch (Throwable th6) {
                        th5.addSuppressed(th6);
                        throw th5;
                    }
                }
            }
            toast("已导入默认工作区的 imports 文件夹");
        } catch (Exception e) {
            toast("导入失败：" + e.getMessage());
        }
    }

    /* JADX INFO: Access modifiers changed from: private */
    public /* synthetic */ void lambda$onActivityResult$10(File file, Uri uri) {
        try {
            FileInputStream fileInputStream = new FileInputStream(file);
            try {
                OutputStream openOutputStream = getContentResolver().openOutputStream(uri);
                try {
                    copy(fileInputStream, openOutputStream);
                    toast("导出完成");
                    file.delete();
                    if (openOutputStream != null) {
                        openOutputStream.close();
                    }
                    fileInputStream.close();
                } finally {
                }
            } finally {
            }
        } catch (Exception e) {
            toast("导出失败：" + e.getMessage());
        }
    }

    /* JADX INFO: Access modifiers changed from: private */
    public /* synthetic */ void lambda$offerSave$11(File file, String str, String str2) {
        this.pendingExport = file;
        Intent addCategory = new Intent("android.intent.action.CREATE_DOCUMENT").addCategory("android.intent.category.OPENABLE");
        if (str == null) {
            str = "application/octet-stream";
        }
        startActivityForResult(addCategory.setType(str).putExtra("android.intent.extra.TITLE", str2), 12);
    }

    /* JADX INFO: Access modifiers changed from: private */
    public void offerSave(final File file, final String str, final String str2) {
        this.main.post(new Runnable() { // from class: com.deepseek.harness.android.MainActivity$$ExternalSyntheticLambda4
            @Override // java.lang.Runnable
            public final void run() {
                MainActivity.this.lambda$offerSave$11(file, str2, str);
            }
        });
    }

    /* JADX INFO: Access modifiers changed from: private */
    /* renamed from: download, reason: merged with bridge method [inline-methods] */
    public void lambda$onCreate$0(String str, String str2, String str3) {
        try {
            HttpURLConnection httpURLConnection = (HttpURLConnection) new URL(str).openConnection();
            httpURLConnection.setConnectTimeout(15000);
            httpURLConnection.setReadTimeout(60000);
            httpURLConnection.setInstanceFollowRedirects(false);
            String cookie = CookieManager.getInstance().getCookie(str);
            if (cookie != null) {
                httpURLConnection.setRequestProperty("Cookie", cookie);
            }
            if (httpURLConnection.getResponseCode() != 200) {
                throw new IOException("HTTP " + httpURLConnection.getResponseCode());
            }
            File createTempFile = File.createTempFile("download-", ".bin", getCacheDir());
            try {
                InputStream inputStream = httpURLConnection.getInputStream();
                try {
                    FileOutputStream fileOutputStream = new FileOutputStream(createTempFile);
                    try {
                        copy(inputStream, fileOutputStream);
                        fileOutputStream.close();
                        if (inputStream != null) {
                            inputStream.close();
                        }
                        httpURLConnection.disconnect();
                        offerSave(createTempFile, URLUtil.guessFileName(str, str2, str3), str3);
                    } finally {
                    }
                } finally {
                }
            } catch (Throwable th) {
                httpURLConnection.disconnect();
                throw th;
            }
        } catch (Exception e) {
            toast("下载失败：" + e.getMessage());
        }
    }

    /* JADX INFO: Access modifiers changed from: private */
    public void exportWorkspace() {
        try {
            File file = new File(RuntimeInstaller.root(this), "root/workspace/deepseek-harness/default-workspace");
            File createTempFile = File.createTempFile("workspace-", ".zip", getCacheDir());
            ZipOutputStream zipOutputStream = new ZipOutputStream(new FileOutputStream(createTempFile));
            try {
                zipTree(file, file, zipOutputStream);
                zipOutputStream.close();
                offerSave(createTempFile, "Harness-workspace.zip", "application/zip");
            } finally {
            }
        } catch (Exception e) {
            toast("导出失败：" + e.getMessage());
        }
    }

    private static void zipTree(File file, File file2, ZipOutputStream zipOutputStream) throws Exception {
        File[] listFiles = file2.listFiles();
        if (listFiles == null) {
            return;
        }
        for (File file3 : listFiles) {
            if (!Files.isSymbolicLink(file3.toPath())) {
                if (file3.isDirectory()) {
                    zipTree(file, file3, zipOutputStream);
                } else {
                    zipOutputStream.putNextEntry(new ZipEntry(file.toPath().relativize(file3.toPath()).toString().replace(IOUtils.DIR_SEPARATOR_WINDOWS, IOUtils.DIR_SEPARATOR_UNIX)));
                    FileInputStream fileInputStream = new FileInputStream(file3);
                    try {
                        copy(fileInputStream, zipOutputStream);
                        fileInputStream.close();
                        zipOutputStream.closeEntry();
                    } catch (Throwable th) {
                        try {
                            fileInputStream.close();
                        } catch (Throwable th2) {
                            th.addSuppressed(th2);
                        }
                        throw th;
                    }
                }
            }
        }
    }

    public final class ExportBridge {
        public ExportBridge() {
        }

        /* JADX INFO: Access modifiers changed from: private */
        public /* synthetic */ void lambda$theme$0(boolean z) {
            MainActivity.this.getPreferences(0).edit().putBoolean("startup_dark", z).apply();
            MainActivity.this.applyStartupTheme(z);
        }

        @JavascriptInterface
        public void theme(final boolean z) {
            MainActivity.this.main.post(new Runnable() { // from class: com.deepseek.harness.android.MainActivity$ExportBridge$$ExternalSyntheticLambda3
                @Override // java.lang.Runnable
                public final void run() {
                    MainActivity.ExportBridge.this.lambda$theme$0(z);
                }
            });
        }

        /* JADX INFO: Access modifiers changed from: private */
        public /* synthetic */ void lambda$openMenu$1() {
            MainActivity.this.menu();
        }

        @JavascriptInterface
        public void openMenu() {
            MainActivity.this.main.post(new Runnable() { // from class: com.deepseek.harness.android.MainActivity$ExportBridge$$ExternalSyntheticLambda1
                @Override // java.lang.Runnable
                public final void run() {
                    MainActivity.ExportBridge.this.lambda$openMenu$1();
                }
            });
        }

        /* JADX INFO: Access modifiers changed from: private */
        public /* synthetic */ void lambda$ready$2() {
            MainActivity.this.loading.setVisibility(8);
            RuntimeService.log("ANDROID_WEB_UI_READY");
            CookieManager.getInstance().flush();
            if (MainActivity.this.launchHash.isEmpty()) {
                return;
            }
            MainActivity.this.getPreferences(0).edit().putString("last_launch_hash", MainActivity.this.launchHash).apply();
        }

        @JavascriptInterface
        public void ready() {
            MainActivity.this.main.post(new Runnable() { // from class: com.deepseek.harness.android.MainActivity$ExportBridge$$ExternalSyntheticLambda2
                @Override // java.lang.Runnable
                public final void run() {
                    MainActivity.ExportBridge.this.lambda$ready$2();
                }
            });
        }

        /* JADX INFO: Access modifiers changed from: private */
        public /* synthetic */ void lambda$save$3(String str, String str2, String str3) {
            try {
                File createTempFile = File.createTempFile("export-", ".bin", MainActivity.this.getCacheDir());
                FileOutputStream fileOutputStream = new FileOutputStream(createTempFile);
                try {
                    fileOutputStream.write(Base64.decode(str, 0));
                    fileOutputStream.close();
                    MainActivity.this.offerSave(createTempFile, str2, str3);
                } finally {
                }
            } catch (Exception e) {
                error(e.getMessage());
            }
        }

        @JavascriptInterface
        public void save(final String str, final String str2, final String str3) {
            if (str.length() > 45000000) {
                error("文件过大，请导出工作区");
            } else {
                new Thread(new Runnable() { // from class: com.deepseek.harness.android.MainActivity$ExportBridge$$ExternalSyntheticLambda0
                    @Override // java.lang.Runnable
                    public final void run() {
                        MainActivity.ExportBridge.this.lambda$save$3(str, str2, str3);
                    }
                }, "harness-blob").start();
            }
        }

        @JavascriptInterface
        public void error(String str) {
            MainActivity.this.toast(str);
        }
    }

    private static void copy(InputStream inputStream, OutputStream outputStream) throws IOException {
        if (inputStream == null || outputStream == null) {
            throw new IOException("无法访问所选文件");
        }
        byte[] bArr = new byte[IcTuple.NESTED_CLASS_FLAG];
        while (true) {
            int read = inputStream.read(bArr);
            if (read == -1) {
                return;
            } else {
                outputStream.write(bArr, 0, read);
            }
        }
    }
}


