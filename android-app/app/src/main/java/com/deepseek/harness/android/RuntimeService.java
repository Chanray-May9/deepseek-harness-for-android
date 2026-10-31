package com.deepseek.harness.android;

import android.app.*;
import android.content.*;
import android.os.*;
import java.io.*;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.regex.*;

public final class RuntimeService extends Service {
    public static volatile String status="准备启动…",launchUrl=null;
    public static volatile boolean busy=false;
    private static final StringBuilder LOG=new StringBuilder();
    private static volatile File logFile;
    private volatile java.lang.Process process, toolsProcess;
    private final java.util.concurrent.atomic.AtomicBoolean toolsRunning=new java.util.concurrent.atomic.AtomicBoolean();
    private PowerManager.WakeLock wake;
    private final java.util.concurrent.atomic.AtomicBoolean started=new java.util.concurrent.atomic.AtomicBoolean();
    public interface Observer { void changed(); }
    public static final CopyOnWriteArrayList<Observer> observers=new CopyOnWriteArrayList<>();
    static synchronized void log(String text){
        String clean=text.replaceAll("https?://127\\.0\\.0\\.1:[^\\s]+","[本地会话地址]").replaceAll("(?i)(api[_-]?key|authorization|bearer)[=: ]+[^\\s]+","$1=[已隐藏]");
        android.util.Log.i("HarnessRuntime",clean);
        try{if(logFile!=null){try(FileOutputStream file=new FileOutputStream(logFile,true)){file.write((clean+"\n").getBytes(java.nio.charset.StandardCharsets.UTF_8));}}}catch(IOException ignored){}
        LOG.append(clean).append('\n');if(LOG.length()>100000)LOG.delete(0,LOG.length()-80000);
        for(Observer o:observers)o.changed();
    }
    public static synchronized String logs(){return LOG.toString();}
    static void state(String text){status=text;log(text);}
    @Override public void onCreate(){
        super.onCreate();logFile=new File(getFilesDir(),"runtime.log");if(logFile.length()>2000000)try{new FileOutputStream(logFile).close();}catch(IOException ignored){}NotificationManager m=getSystemService(NotificationManager.class);
        m.createNotificationChannel(new NotificationChannel("runtime","本地运行环境",NotificationManager.IMPORTANCE_LOW));
        PendingIntent open=PendingIntent.getActivity(this,0,new Intent(this,MainActivity.class),PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
        PendingIntent stop=PendingIntent.getService(this,1,new Intent(this,RuntimeService.class).setAction("STOP"),PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
        Notification n=new Notification.Builder(this,"runtime").setSmallIcon(android.R.drawable.ic_menu_manage).setContentTitle("DeepSeek Harness").setContentText("在手机本地运行 · 点击打开").setContentIntent(open).setOngoing(true).addAction(new Notification.Action.Builder(null,"停止运行",stop).build()).build();
        startForeground(1,n);
    }
    @Override public int onStartCommand(Intent i,int flags,int id){
        if(i!=null&&"STOP".equals(i.getAction())){stopSelf();return START_NOT_STICKY;}
        if(i!=null&&"TOOLS".equals(i.getAction())){installTools();return START_STICKY;}
        if(started.compareAndSet(false,true))new Thread(this::run,"harness-runtime").start();
        return START_STICKY;
    }
    private void run(){
        busy=true;launchUrl=null;
        try{
            wake=((PowerManager)getSystemService(POWER_SERVICE)).newWakeLock(PowerManager.PARTIAL_WAKE_LOCK,"harness:runtime");wake.acquire();
            RuntimeInstaller.install(this,RuntimeService::state);
            RuntimeInstaller.installWebCompat(this);
            state("正在检查本地 Node、文件锁、SQLite 和终端…");
            File smoke=new File(RuntimeInstaller.root(this),"opt/harness/android-smoke.mjs");
            try(InputStream in=getAssets().open("android-smoke.mjs");OutputStream out=new FileOutputStream(smoke)){byte[] bytes=new byte[8192];int n;while((n=in.read(bytes))!=-1)out.write(bytes,0,n);}
            process=RuntimeInstaller.command(this,"/usr/local/bin/node","/opt/harness/android-smoke.mjs").start();
            try(BufferedReader check=new BufferedReader(new InputStreamReader(process.getInputStream()))){String line;while((line=check.readLine())!=null)log(line);}
            if(process.waitFor()!=0)throw new IOException("本地原生模块检查未通过，请查看运行日志。");
            state("正在启动原版 DeepSeek Harness…");
            process=RuntimeInstaller.command(this,"/usr/local/bin/node","/opt/harness/node_modules/@deepseek-ai/dsh/lib/bin.js","--profile","web","--patch","/opt/harness/android.cordis.patch.yml","--no-open","--host","127.0.0.1","--port","3080").start();
            Pattern url=Pattern.compile("https?://127\\.0\\.0\\.1:3080/[^\\s\\u001B]*");
            try(BufferedReader reader=new BufferedReader(new InputStreamReader(process.getInputStream()))){
                String line;while((line=reader.readLine())!=null){
                    line=line.replaceAll("\\u001B\\[[;\\d]*m","");
                    if(line.contains("dsh web:")){Matcher match=url.matcher(line);if(match.find()){launchUrl=match.group();status="运行中";}}
                    log(line);
                }
            }
            int code=process.waitFor();state("运行环境已退出（"+code+"），可在菜单中重新启动。");
        }catch(Exception e){state("启动失败："+e.getMessage());log(android.util.Log.getStackTraceString(e));}
        finally{busy=false;started.set(false);launchUrl=null;if(wake!=null&&wake.isHeld())wake.release();for(Observer o:observers)o.changed();}
    }
    private void installTools(){
        if(!toolsRunning.compareAndSet(false,true))return;
        new Thread(()->{try{
            log("正在为手机本地工作区安装 Git / Python / tmux / curl 等工具，需要联网…");
            toolsProcess=RuntimeInstaller.command(this,"/bin/bash","-lc","export DEBIAN_FRONTEND=noninteractive; apt-get -o APT::Sandbox::User=root update && apt-get -o APT::Sandbox::User=root -o Dpkg::Use-Pty=0 install -y --no-install-recommends git python3 python3-venv tmux curl ca-certificates unzip zip procps patch openssh-client").start();
            try(BufferedReader r=new BufferedReader(new InputStreamReader(toolsProcess.getInputStream()))){String line;while((line=r.readLine())!=null)log(line);}
            int code=toolsProcess.waitFor();log(code==0?"开发工具安装完成。":"开发工具安装失败（"+code+"），可联网后重试。");
        }catch(Exception e){log("开发工具安装失败："+e.getMessage());}finally{toolsRunning.set(false);}},"harness-tools").start();
    }
    @Override public void onDestroy(){if(process!=null)process.destroy();if(toolsProcess!=null)toolsProcess.destroy();if(wake!=null&&wake.isHeld())wake.release();busy=false;launchUrl=null;status="已停止";super.onDestroy();}
    @Override public IBinder onBind(Intent intent){return null;}
}
