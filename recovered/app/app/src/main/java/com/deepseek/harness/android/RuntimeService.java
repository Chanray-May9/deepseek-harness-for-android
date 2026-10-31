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
    private volatile Process process;
    private PowerManager.WakeLock wake;
    private final java.util.concurrent.atomic.AtomicBoolean started=new java.util.concurrent.atomic.AtomicBoolean();
    public interface Observer { void changed(); }
    public static final CopyOnWriteArrayList<Observer> observers=new CopyOnWriteArrayList<>();
    static synchronized void log(String text){
        String clean=text.replaceAll("https?://127\\.0\\.0\\.1:[^\\s]+","[本地会话地址]").replaceAll("(?i)(api[_-]?key|authorization|bearer)[=: ]+[^\\s]+","$1=[已隐藏]");
        LOG.append(clean).append('\n');if(LOG.length()>100000)LOG.delete(0,LOG.length()-80000);
        for(Observer o:observers)o.changed();
    }
    public static synchronized String logs(){return LOG.toString();}
    static void state(String text){status=text;log(text);}
    @Override public void onCreate(){
        super.onCreate();NotificationManager m=getSystemService(NotificationManager.class);
        m.createNotificationChannel(new NotificationChannel("runtime","本地运行环境",NotificationManager.IMPORTANCE_LOW));
        PendingIntent open=PendingIntent.getActivity(this,0,new Intent(this,MainActivity.class),PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
        PendingIntent stop=PendingIntent.getService(this,1,new Intent(this,RuntimeService.class).setAction("STOP"),PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
        Notification n=new Notification.Builder(this,"runtime").setSmallIcon(android.R.drawable.ic_menu_manage).setContentTitle("DeepSeek Harness").setContentText("在手机本地运行 · 点击打开").setContentIntent(open).setOngoing(true).addAction(new Notification.Action.Builder(null,"停止运行",stop).build()).build();
        startForeground(1,n);
    }
    @Override public int onStartCommand(Intent i,int flags,int id){
        if(i!=null&&"STOP".equals(i.getAction())){stopSelf();return START_NOT_STICKY;}
        if(started.compareAndSet(false,true))new Thread(this::run,"harness-runtime").start();
        return START_STICKY;
    }
    private void run(){
        busy=true;launchUrl=null;
        try{
            wake=((PowerManager)getSystemService(POWER_SERVICE)).newWakeLock(PowerManager.PARTIAL_WAKE_LOCK,"harness:runtime");wake.acquire();
            RuntimeInstaller.install(this,RuntimeService::state);
            state("正在启动原版 DeepSeek Harness…");
            process=RuntimeInstaller.command(this,"/usr/local/bin/node","/opt/harness/node_modules/@deepseek-ai/dsh/lib/bin.js","--profile","web","--no-open","--host","127.0.0.1","--port","3080").start();
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
    @Override public void onDestroy(){if(process!=null)process.destroy();if(wake!=null&&wake.isHeld())wake.release();busy=false;launchUrl=null;status="已停止";super.onDestroy();}
    @Override public IBinder onBind(Intent intent){return null;}
}
