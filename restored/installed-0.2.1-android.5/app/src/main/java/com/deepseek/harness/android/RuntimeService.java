package com.deepseek.harness.android;

import android.R;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.graphics.drawable.Icon;
import android.os.IBinder;
import android.os.PowerManager;
import android.util.Log;
import com.deepseek.harness.android.RuntimeInstaller;
import java.io.BufferedReader;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.Iterator;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.apache.commons.lang3.StringUtils;

/* loaded from: D:\deepseek harness workspace\dsh-android\build\apk-unpack\classes.dex */
public final class RuntimeService extends Service {
    private static volatile File logFile;
    private volatile Process process;
    private volatile Process toolsProcess;
    private PowerManager.WakeLock wake;
    public static volatile String status = "准备启动…";
    public static volatile String launchUrl = null;
    public static volatile boolean busy = false;
    /* Loopback port is chosen at start-up so a second copy of the app, or a host
       that already owns 3080, does not kill the engine on bind. */
    public static volatile int port = 3080;

    static int findFreePort() {
        for (int candidate = 3080; candidate <= 3099; candidate++) {
            java.net.ServerSocket probe = null;
            try {
                probe = new java.net.ServerSocket();
                probe.setReuseAddress(false);
                probe.bind(new java.net.InetSocketAddress(java.net.InetAddress.getByName("127.0.0.1"), candidate), 1);
                return candidate;
            } catch (Exception ignored) {
            } finally {
                if (probe != null) {
                    try {
                        probe.close();
                    } catch (Exception ignored) {
                    }
                }
            }
        }
        return 3099;
    }
    private static final StringBuilder LOG = new StringBuilder();
    public static final CopyOnWriteArrayList<Observer> observers = new CopyOnWriteArrayList<>();
    private final AtomicBoolean toolsRunning = new AtomicBoolean();
    private final AtomicBoolean started = new AtomicBoolean();

    public interface Observer {
        void changed();
    }

    static synchronized void log(String str) {
        synchronized (RuntimeService.class) {
            String replaceAll = str.replaceAll("https?://127\\.0\\.0\\.1:[^\\s]+", "[本地会话地址]").replaceAll("(?i)(api[_-]?key|authorization|bearer)[=: ]+[^\\s]+", "$1=[已隐藏]");
            Log.i("HarnessRuntime", replaceAll);
            try {
                if (logFile != null) {
                    FileOutputStream fileOutputStream = new FileOutputStream(logFile, true);
                    try {
                        fileOutputStream.write((replaceAll + StringUtils.LF).getBytes(StandardCharsets.UTF_8));
                        fileOutputStream.close();
                    } catch (Throwable th) {
                        try {
                            fileOutputStream.close();
                        } catch (Throwable th2) {
                            th.addSuppressed(th2);
                        }
                        throw th;
                    }
                }
            } catch (IOException e) {
            }
            LOG.append(replaceAll).append('\n');
            if (LOG.length() > 100000) {
                LOG.delete(0, LOG.length() - 80000);
            }
            Iterator<Observer> it = observers.iterator();
            while (it.hasNext()) {
                it.next().changed();
            }
        }
    }

    public static synchronized String logs() {
        String sb;
        synchronized (RuntimeService.class) {
            sb = LOG.toString();
        }
        return sb;
    }

    static void state(String str) {
        status = str;
        log(str);
    }

    @Override // android.app.Service
    public void onCreate() {
        super.onCreate();
        logFile = new File(getFilesDir(), "runtime.log");
        if (logFile.length() > 2000000) {
            try {
                new FileOutputStream(logFile).close();
            } catch (IOException e) {
            }
        }
        ((NotificationManager) getSystemService(NotificationManager.class)).createNotificationChannel(new NotificationChannel("runtime", "本地运行环境", 2));
        startForeground(1, new Notification.Builder(this, "runtime").setSmallIcon(R.drawable.ic_menu_manage).setContentTitle("DeepSeek Harness").setContentText("在手机本地运行 · 点击打开").setContentIntent(PendingIntent.getActivity(this, 0, new Intent(this, (Class<?>) MainActivity.class), 201326592)).setOngoing(true).addAction(new Notification.Action.Builder((Icon) null, "停止运行", PendingIntent.getService(this, 1, new Intent(this, (Class<?>) RuntimeService.class).setAction("STOP"), 201326592)).build()).build());
    }

    @Override // android.app.Service
    public int onStartCommand(Intent intent, int i, int i2) {
        if (intent != null && "STOP".equals(intent.getAction())) {
            stopSelf();
            return 2;
        }
        if (intent == null || !"TOOLS".equals(intent.getAction())) {
            if (this.started.compareAndSet(false, true)) {
                new Thread(new Runnable() { // from class: com.deepseek.harness.android.RuntimeService$$ExternalSyntheticLambda1
                    @Override // java.lang.Runnable
                    public final void run() {
                        RuntimeService.this.run();
                    }
                }, "harness-runtime").start();
            }
            return 1;
        }
        installTools();
        return 1;
    }

    /* JADX INFO: Access modifiers changed from: private */
    public void run() {
        busy = true;
        launchUrl = null;
        try {
            try {
                this.wake = ((PowerManager) getSystemService("power")).newWakeLock(1, "harness:runtime");
                this.wake.acquire();
                RuntimeInstaller.install(this, new RuntimeInstaller.Progress() { // from class: com.deepseek.harness.android.RuntimeService$$ExternalSyntheticLambda2
                    @Override // com.deepseek.harness.android.RuntimeInstaller.Progress
                    public final void update(String str) {
                        RuntimeService.state(str);
                    }
                });
                RuntimeInstaller.installWebCompat(this);
                state("正在检查本地 Node、文件锁、SQLite 和终端…");
                File file = new File(RuntimeInstaller.root(this), "opt/harness/android-smoke.mjs");
                InputStream open = getAssets().open("android-smoke.mjs");
                try {
                    FileOutputStream fileOutputStream = new FileOutputStream(file);
                    try {
                        byte[] bArr = new byte[8192];
                        while (true) {
                            int read = open.read(bArr);
                            if (read == -1) {
                                break;
                            } else {
                                fileOutputStream.write(bArr, 0, read);
                            }
                        }
                        fileOutputStream.close();
                        if (open != null) {
                            open.close();
                        }
                        this.process = RuntimeInstaller.command(this, "/usr/local/bin/node", "/opt/harness/android-smoke.mjs").start();
                        BufferedReader bufferedReader = new BufferedReader(new InputStreamReader(this.process.getInputStream()));
                        while (true) {
                            try {
                                String readLine = bufferedReader.readLine();
                                if (readLine == null) {
                                    break;
                                } else {
                                    log(readLine);
                                }
                            } finally {
                            }
                        }
                        bufferedReader.close();
                        if (this.process.waitFor() != 0) {
                            throw new IOException("本地原生模块检查未通过，请查看运行日志。");
                        }
                        state("正在启动原版 DeepSeek Harness…");
                        port = findFreePort();
                        this.process = RuntimeInstaller.command(this, "/usr/local/bin/node", "/opt/harness/node_modules/@deepseek-ai/dsh/lib/bin.js", "--profile", "web", "--patch", "/opt/harness/android.cordis.patch.yml", "--no-open", "--host", "127.0.0.1", "--port", String.valueOf(port)).start();
                        Pattern compile = Pattern.compile("https?://127\\.0\\.0\\.1:(\\d+)/[^\\s\\u001B]*");
                        bufferedReader = new BufferedReader(new InputStreamReader(this.process.getInputStream()));
                        while (true) {
                            try {
                                String readLine2 = bufferedReader.readLine();
                                if (readLine2 == null) {
                                    break;
                                }
                                String replaceAll = readLine2.replaceAll("\\u001B\\[[;\\d]*m", "");
                                if (replaceAll.contains("dsh web:")) {
                                    Matcher matcher = compile.matcher(replaceAll);
                                    if (matcher.find()) {
                                        launchUrl = matcher.group();
                                        try {
                                            if (matcher.groupCount() >= 1) {
                                                port = Integer.parseInt(matcher.group(1));
                                            }
                                        } catch (NumberFormatException ignored) {
                                        }
                                        status = "运行中";
                                    }
                                }
                                log(replaceAll);
                            } finally {
                            }
                        }
                        bufferedReader.close();
                        state("运行环境已退出（" + this.process.waitFor() + "），可在菜单中重新启动。");
                        busy = false;
                        this.started.set(false);
                        launchUrl = null;
                        if (this.wake != null && this.wake.isHeld()) {
                            this.wake.release();
                        }
                        Iterator<Observer> it = observers.iterator();
                        while (it.hasNext()) {
                            it.next().changed();
                        }
                    } finally {
                    }
                } catch (Throwable th) {
                    if (open != null) {
                        try {
                            open.close();
                        } catch (Throwable th2) {
                            th.addSuppressed(th2);
                        }
                    }
                    throw th;
                }
            } catch (Exception e) {
                state("启动失败：" + e.getMessage());
                log(Log.getStackTraceString(e));
                busy = false;
                this.started.set(false);
                launchUrl = null;
                if (this.wake != null && this.wake.isHeld()) {
                    this.wake.release();
                }
                Iterator<Observer> it2 = observers.iterator();
                while (it2.hasNext()) {
                    it2.next().changed();
                }
            }
        } catch (Throwable th3) {
            busy = false;
            this.started.set(false);
            launchUrl = null;
            if (this.wake != null && this.wake.isHeld()) {
                this.wake.release();
            }
            Iterator<Observer> it3 = observers.iterator();
            while (it3.hasNext()) {
                it3.next().changed();
            }
            throw th3;
        }
    }

    private void installTools() {
        if (this.toolsRunning.compareAndSet(false, true)) {
            new Thread(new Runnable() { // from class: com.deepseek.harness.android.RuntimeService$$ExternalSyntheticLambda0
                @Override // java.lang.Runnable
                public final void run() {
                    RuntimeService.this.lambda$installTools$0();
                }
            }, "harness-tools").start();
        }
    }

    /* JADX INFO: Access modifiers changed from: private */
    public /* synthetic */ void lambda$installTools$0() {
        try {
            try {
                log("正在为手机本地工作区安装 Git / Python / tmux / curl 等工具，需要联网…");
                this.toolsProcess = RuntimeInstaller.command(this, "/bin/bash", "-lc", "export DEBIAN_FRONTEND=noninteractive; apt-get -o APT::Sandbox::User=root update && apt-get -o APT::Sandbox::User=root -o Dpkg::Use-Pty=0 install -y --no-install-recommends git python3 python3-venv tmux curl ca-certificates unzip zip procps patch openssh-client").start();
                BufferedReader bufferedReader = new BufferedReader(new InputStreamReader(this.toolsProcess.getInputStream()));
                while (true) {
                    try {
                        String readLine = bufferedReader.readLine();
                        if (readLine == null) {
                            break;
                        } else {
                            log(readLine);
                        }
                    } catch (Throwable th) {
                        try {
                            bufferedReader.close();
                        } catch (Throwable th2) {
                            th.addSuppressed(th2);
                        }
                        throw th;
                    }
                }
                bufferedReader.close();
                int waitFor = this.toolsProcess.waitFor();
                log(waitFor == 0 ? "开发工具安装完成。" : "开发工具安装失败（" + waitFor + "），可联网后重试。");
            } catch (Exception e) {
                log("开发工具安装失败：" + e.getMessage());
            }
        } finally {
            this.toolsRunning.set(false);
        }
    }

    @Override // android.app.Service
    public void onDestroy() {
        if (this.process != null) {
            this.process.destroy();
        }
        if (this.toolsProcess != null) {
            this.toolsProcess.destroy();
        }
        if (this.wake != null && this.wake.isHeld()) {
            this.wake.release();
        }
        busy = false;
        launchUrl = null;
        status = "已停止";
        super.onDestroy();
    }

    @Override // android.app.Service
    public IBinder onBind(Intent intent) {
        return null;
    }
}
