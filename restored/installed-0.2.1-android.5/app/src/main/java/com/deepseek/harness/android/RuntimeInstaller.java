package com.deepseek.harness.android;

import android.content.Context;
import android.net.ConnectivityManager;
import android.net.LinkProperties;
import android.os.Build;
import android.system.ErrnoException;
import android.system.Os;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.InetAddress;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Iterator;
import java.util.Map;
import java.util.zip.GZIPInputStream;
import org.apache.commons.compress.archivers.tar.TarArchiveEntry;
import org.apache.commons.compress.archivers.tar.TarArchiveInputStream;
import org.apache.commons.compress.archivers.zip.UnixStat;
import org.apache.commons.lang3.StringUtils;

/* loaded from: D:\deepseek harness workspace\dsh-android\build\apk-unpack\classes.dex */
final class RuntimeInstaller {

    interface Progress {
        void update(String str);
    }

    RuntimeInstaller() {
    }

    static String arch() {
        for (String str : Build.SUPPORTED_ABIS) {
            if (str.equals("arm64-v8a")) {
                return "arm64";
            }
            if (str.equals("x86_64")) {
                return "x64";
            }
        }
        throw new IllegalStateException("需要 64 位安卓系统（ARM64 或 x86_64）");
    }

    static File root(Context context) {
        return new File(context.getFilesDir(), "linux");
    }

    static void install(Context context, Progress progress) throws Exception {
        File root = root(context);
        try {
            appEnvironmentBrief(root);
        } catch (Exception e) {
            progress.update("环境提示词写入失败：" + e.getMessage());
        }
        File file = new File(root, ".harness-runtime-v1");
        String arch = arch();
        File file2 = new File(context.getFilesDir(), "native/loader32");
        file2.getParentFile().mkdirs();
        if (!file2.isFile()) {
            InputStream open = context.getAssets().open("loader32-" + arch + ".bin");
            try {
                FileOutputStream fileOutputStream = new FileOutputStream(file2);
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
                    Os.chmod(file2.getAbsolutePath(), 448);
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
        }
        if (file.isFile()) {
            // Termux 环境后加入：标记存在时也确保它已安装（幂等、增量）。
            File termuxBash = new File(context.getFilesDir(), "usr/bin/bash");
            if (!termuxBash.isFile()) {
                progress.update("正在安装 Termux 环境…");
                try {
                    extract(context, "termux-" + arch + ".tar.gz", context.getFilesDir(), 0, progress);
                } catch (Exception e) {
                    progress.update("Termux 环境安装失败：" + e.getMessage());
                }
            }
            try {
                termuxIdentity(context, root);
            } catch (Exception e) {
                progress.update("Termux 身份写入失败：" + e.getMessage());
            }
            return;
        }
        root.mkdirs();
        progress.update("正在解压手机本地运行环境，首次启动需要几分钟…");
        extract(context, "rootfs-" + arch + ".tar.gz", root, 0, progress);
        progress.update("正在安装 Termux 环境…");
        try {
            extract(context, "termux-" + arch + ".tar.gz", context.getFilesDir(), 0, progress);
        } catch (Exception e) {
            progress.update("Termux 环境安装失败：" + e.getMessage());
        }
        progress.update("正在安装 Node.js 24…");
        extract(context, "node-" + arch + ".tar.gz", new File(root, "usr/local"), 1, progress);
        progress.update("正在安装原版 DeepSeek Harness…");
        extract(context, "harness-" + arch + ".tar.gz", new File(root, "opt/harness"), 0, progress);
        String[] strArr = {"tmp", "proc", "sys", "dev", "root/workspace", "root/.dsh", "etc"};
        for (int i = 0; i < 7; i++) {
            new File(root, strArr[i]).mkdirs();
        }
        write(new File(root, "etc/resolv.conf"), "nameserver 1.1.1.1\nnameserver 8.8.8.8\n");
        write(new File(root, "etc/hosts"), "127.0.0.1 localhost\n::1 localhost\n");
        write(new File(root, "root/.hushlogin"), "");
        termuxIdentity(context, root);
                appEnvironmentBrief(root);

        write(file, "0.2.1-rc.2\n" + arch + StringUtils.LF);
    }

    static void installWebCompat(Context context) throws Exception {
        configureNetwork(context);
        try {
            File patchOut = new File(root(context), "opt/harness/android.cordis.patch.yml");
            patchOut.getParentFile().mkdirs();
            InputStream patchIn = context.getAssets().open("android.cordis.patch.yml");
            try {
                FileOutputStream patchOs = new FileOutputStream(patchOut);
                try {
                    byte[] buf = new byte[8192];
                    int n;
                    while ((n = patchIn.read(buf)) != -1) {
                        patchOs.write(buf, 0, n);
                    }
                } finally {
                    patchOs.close();
                }
            } finally {
                patchIn.close();
            }
        } catch (Exception ignored) {
        }
        File file = new File(root(context), "opt/harness/node_modules/@deepseek-ai/dsh-web-frontend/dist");
        String[] strArr = {"android-web-compat.js", "android-abort-compat.js", "android-mobile.css", "android-mobile.js", "android.cordis.patch.yml"};
        for (int i = 0; i < strArr.length; i++) {
            String str = strArr[i];
            File file2 = new File(file, "assets/" + str);
            InputStream open = context.getAssets().open(str);
            try {
                FileOutputStream fileOutputStream = new FileOutputStream(file2);
                try {
                    byte[] bArr = new byte[16384];
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
        }
        write(new File(root(context), "opt/harness/android.cordis.patch.yml"), "- id: workspace-controller\n  config:\n    documentsDirectory: /root/workspace\n");
        File file3 = new File(file, "index.html");
        write(file3, new String(Files.readAllBytes(file3.toPath()), StandardCharsets.UTF_8).replaceAll("<script[^>]*data-harness-android-compat[^>]*></script>", "").replaceAll("<script[^>]*android-(abort-compat|mobile)\\.js[^>]*></script>", "").replaceAll("<link[^>]*android-mobile\\.css[^>]*>", "").replace("<head>", "<head>\n<script data-harness-android-compat src=\"./assets/android-web-compat.js\"></script>\n<script src=\"./assets/android-abort-compat.js\"></script>\n<link rel=\"stylesheet\" href=\"./assets/android-mobile.css\">\n<script src=\"./assets/android-mobile.js\"></script>"));
    }

    static void configureNetwork(Context context) throws Exception {
        ConnectivityManager connectivityManager = (ConnectivityManager) context.getSystemService(ConnectivityManager.class);
        LinkProperties linkProperties = connectivityManager.getLinkProperties(connectivityManager.getActiveNetwork());
        if (linkProperties != null && !linkProperties.getDnsServers().isEmpty()) {
            StringBuilder sb = new StringBuilder();
            Iterator<InetAddress> it = linkProperties.getDnsServers().iterator();
            while (it.hasNext()) {
                sb.append("nameserver ").append(it.next().getHostAddress()).append('\n');
            }
            sb.append("options timeout:2 attempts:2\n");
            write(new File(root(context), "etc/resolv.conf"), sb.toString());
        }
    }

    static void write(File file, String str) throws Exception {
        file.getParentFile().mkdirs();
        FileOutputStream fileOutputStream = new FileOutputStream(file);
        try {
            fileOutputStream.write(str.getBytes(StandardCharsets.UTF_8));
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

    private static File safe(File file, String str, boolean z) throws Exception {
        File absoluteFile = new File(file, str).getAbsoluteFile();
        String str2 = file.getCanonicalPath() + File.separator;
        String canonicalPath = z ? absoluteFile.getCanonicalPath() : absoluteFile.toPath().normalize().toString();
        if (canonicalPath.equals(file.getCanonicalPath()) || canonicalPath.startsWith(str2)) {
            return absoluteFile;
        }
        throw new IOException("Unsafe archive path: " + str);
    }

    private static void extract(Context context, String str, File file, int i, Progress progress) throws Exception {
        file.mkdirs();
        ArrayList arrayList = new ArrayList();
        TarArchiveInputStream tarArchiveInputStream = new TarArchiveInputStream(new GZIPInputStream(context.getAssets().open(str), 262144));
        try {
            byte[] bArr = new byte[262144];
            int i2 = 0;
            while (true) {
                TarArchiveEntry nextTarEntry = tarArchiveInputStream.getNextTarEntry();
                boolean z = true;
                if (nextTarEntry == null) {
                    break;
                }
                String replaceFirst = nextTarEntry.getName().replaceFirst("^\\./", "");
                for (int i3 = 0; i3 < i; i3++) {
                    int indexOf = replaceFirst.indexOf(47);
                    replaceFirst = indexOf < 0 ? "" : replaceFirst.substring(indexOf + 1);
                }
                if (!replaceFirst.isEmpty() && !replaceFirst.equals(".")) {
                    if (nextTarEntry.isSymbolicLink()) {
                        z = false;
                    }
                    File safe = safe(file, replaceFirst, z);
                    safe.getParentFile().mkdirs();
                    if (nextTarEntry.isSymbolicLink()) {
                        Files.deleteIfExists(safe.toPath());
                        Os.symlink(nextTarEntry.getLinkName(), safe.getAbsolutePath());
                    } else if (nextTarEntry.isLink()) {
                        arrayList.add(new String[]{replaceFirst, nextTarEntry.getLinkName().replaceFirst("^\\./", "")});
                    } else if (nextTarEntry.isDirectory()) {
                        safe.mkdirs();
                    } else if (nextTarEntry.isFile()) {
                        FileOutputStream fileOutputStream = new FileOutputStream(safe);
                        while (true) {
                            try {
                                int read = tarArchiveInputStream.read(bArr);
                                if (read == -1) {
                                    break;
                                } else {
                                    fileOutputStream.write(bArr, 0, read);
                                }
                            } finally {
                            }
                        }
                        fileOutputStream.close();
                        Os.chmod(safe.getAbsolutePath(), nextTarEntry.getMode() & UnixStat.DEFAULT_LINK_PERM);
                    }
                    i2++;
                    if (i2 % 2000 == 0) {
                        progress.update("正在准备本地环境… " + i2 + " 个文件");
                    }
                }
            }
            tarArchiveInputStream.close();
            Iterator it = arrayList.iterator();
            while (it.hasNext()) {
                String[] strArr = (String[]) it.next();
                File safe2 = safe(file, strArr[0], true);
                File safe3 = safe(file, strArr[1], true);
                safe2.getParentFile().mkdirs();
                try {
                    Os.link(safe3.getPath(), safe2.getPath());
                } catch (ErrnoException e) {
                    if (!safe2.isFile()) {
                        throw e;
                    }
                }
            }
        } catch (Throwable th) {
            try {
                tarArchiveInputStream.close();
            } catch (Throwable th2) {
                th.addSuppressed(th2);
            }
            throw th;
        }
    }

    /**
     * dsh 的终端跑在 glibc 的 PRoot 里，无法执行 bionic 的 Termux 二进制，
     * 所以把环境身份做成 Termux：/etc/os-release、PREFIX、pkg、termux-info。
     */
    static void termuxIdentity(Context context, File root) throws Exception {
        String prefix = new File(context.getFilesDir(), "usr").getAbsolutePath();
        write(new File(root, "etc/os-release"),
                "PRETTY_NAME=\"Termux\"\n" +
                "NAME=\"Termux\"\n" +
                "ID=termux\n" +
                "ID_LIKE=android\n" +
                "VERSION_ID=0.118.0\n" +
                "HOME_URL=\"https://termux.dev/\"\n" +
                "SUPPORT_URL=\"https://termux.dev/\"\n");
        write(new File(root, "etc/termux-version"), "TERMUX_VERSION=0.118.0\nPREFIX=" + prefix + "\n");
        write(new File(root, "usr/local/bin/termux-info"),
                "#!/bin/sh\n" +
                "echo \"Termux 0.118.0\"\n" +
                "echo \"Android $(getprop ro.build.version.release 2>/dev/null)\"\n" +
                "echo \"PREFIX=" + prefix + "\"\n" +
                "echo \"Host: $(uname -m) (inside PRoot Ubuntu for Node.js)\"\n");
        write(new File(root, "usr/local/bin/pkg"),
                "#!/bin/sh\n" +
                "echo \"Termux 包管理在 proot 内不可用；此环境使用 apt。\" >&2\n" +
                "exec apt \"$@\"\n");
        Os.chmod(new File(root, "usr/local/bin/termux-info").getAbsolutePath(), 493);
        Os.chmod(new File(root, "usr/local/bin/pkg").getAbsolutePath(), 493);
        write(new File(root, "usr/local/bin/bash"),
                "#!/bin/sh\n" +
                "if [ \"$1\" = \"--version\" ]; then\n" +
                "  echo 'GNU bash, version 5.3.20(1)-release (aarch64-android)'\n" +
                "  exit 0\n" +
                "fi\n" +
                "exec /usr/bin/bash \"$@\"\n");
        write(new File(root, "usr/local/bin/sh"),
                "#!/bin/sh\n" +
                "if [ \"$1\" = \"--version\" ]; then\n" +
                "  echo 'sh (GNU bash) 5.3.20(1)-release'\n" +
                "  exit 0\n" +
                "fi\n" +
                "exec /usr/bin/sh \"$@\"\n");
        Os.chmod(new File(root, "usr/local/bin/bash").getAbsolutePath(), 493);
        Os.chmod(new File(root, "usr/local/bin/sh").getAbsolutePath(), 493);
        write(new File(root, "etc/profile.d/termux.sh"),
                "export PREFIX=" + prefix + "\n" +
                "export TERMUX_VERSION=0.118.0\n" +
                "export PS1='\\[\\e[0;32m\\]~\\[\\e[0m\\] '\n");
    }

    /** 运行环境说明，写入 DSH_HOME/AGENTS.md（不触碰系统提示词注册表）。 */
    static void appEnvironmentBrief(File root) throws Exception {
        File dshHome = new File(root, "root/.dsh");
        dshHome.mkdirs();
        write(new File(dshHome, "AGENTS.md"),
                "# 运行环境\n" +
                "\n" +
                "- 你在 Android 手机上的 DeepSeek Harness 安卓版里运行，不是桌面 Linux，也不是云服务器。\n" +
                "- 对外环境身份是 Termux 0.118.0（Android 终端环境）：cat /etc/os-release 显示 Termux，shell 为 bash 5.3.20。\n" +
                "- 实际命令执行发生在 PRoot 提供的 glibc 用户态中（为了运行 Node.js 及其原生模块），\n" +
                "  因此 uname -a、/proc 会显示 Linux 宿主信息，这是正常的，不要据此认为自己在普通服务器上。\n" +
                "- 包管理用 apt（pkg 已映射到 apt）；PREFIX 指向应用私有目录下的 Termux 根。\n" +
                "- 工作目录默认 /root/workspace。网络出口是手机自身网络，没有公网 IP。\n" +
                "\n");
    }

    static ProcessBuilder command(Context context, String... strArr) throws Exception {
        File root = root(context);
        File file = new File(context.getApplicationInfo().nativeLibraryDir);
        File file2 = new File(context.getCacheDir(), "proot");
        file2.mkdirs();
        File file3 = new File(context.getFilesDir(), "native/links");
        file3.mkdirs();
        File file4 = new File(file3, "libtalloc.so.2");
        String absolutePath = new File(file, "libtalloc.so").getAbsolutePath();
        if (!Files.isSymbolicLink(file4.toPath()) || !Os.readlink(file4.getAbsolutePath()).equals(absolutePath)) {
            Files.deleteIfExists(file4.toPath());
            Os.symlink(absolutePath, file4.getAbsolutePath());
        }
        ArrayList arrayList = new ArrayList();
        Collections.addAll(arrayList, new File(file, "libproot.so").getAbsolutePath(), "--link2symlink", "--kill-on-exit", "-0", "-r", root.getAbsolutePath(), "-b", "/dev", "-b", "/proc", "-b", "/sys", "-b", "/proc/self/fd:/dev/fd", "-b", "/proc/self/fd/0:/dev/stdin", "-b", "/proc/self/fd/1:/dev/stdout", "-b", "/proc/self/fd/2:/dev/stderr", "-w", "/root/workspace", "/usr/bin/env", "-i", "HOME=/root", "USER=root", "LOGNAME=root", "LANG=C.UTF-8", "LC_ALL=C.UTF-8", "TERM=xterm-256color", "TMPDIR=/tmp", "PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin", "DSH_HOME=/root/.dsh", "SHELL=/bin/bash", "TERMUX_VERSION=0.118.0", "PREFIX=" + new File(context.getFilesDir(), "usr").getAbsolutePath());
        Collections.addAll(arrayList, strArr);
        ProcessBuilder processBuilder = new ProcessBuilder(arrayList);
        processBuilder.redirectErrorStream(true);
        Map<String, String> environment = processBuilder.environment();
        environment.put("LD_LIBRARY_PATH", file3.getAbsolutePath() + ":" + file.getAbsolutePath());
        environment.put("PROOT_TMP_DIR", file2.getAbsolutePath());
        environment.put("PROOT_LOADER", new File(file, "libloader.so").getAbsolutePath());
        environment.put("PROOT_LOADER_32", new File(context.getFilesDir(), "native/loader32").getAbsolutePath());
        environment.put("PROOT_NO_SECCOMP", "1");
        // The native addon loader copies .node files into a temp cache before
        // requiring them; that materialization is what fails inside PRoot. The
        // loader ships a switch to require the source path directly.
        environment.put("NARB_DISABLE_NATIVE_CACHE", "1");
        environment.put("NARB_NATIVE_CACHE_DIR", new File(context.getFilesDir(), "native/cache").getAbsolutePath());
        return processBuilder;
    }
}




