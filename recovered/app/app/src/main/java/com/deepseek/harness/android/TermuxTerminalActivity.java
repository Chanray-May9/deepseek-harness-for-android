package com.deepseek.harness.android;

import android.app.*;
import android.content.*;
import android.graphics.Typeface;
import android.os.*;
import android.view.*;
import android.view.inputmethod.InputMethodManager;
import android.widget.*;
import com.termux.terminal.*;
import com.termux.view.*;
import java.io.File;
import java.lang.ref.WeakReference;
import java.util.*;

/** Native terminal using the upstream Termux emulator and PTY, inside the app UID. */
public final class TermuxTerminalActivity extends Activity implements TerminalViewClient {
    private static TerminalSession session;
    private static WeakReference<TermuxTerminalActivity> host=new WeakReference<>(null);
    private TerminalView terminal;
    private TextView title;
    private int textSp=16;
    private int dp(int n){return Math.round(n*getResources().getDisplayMetrics().density);}
    @Override public void onCreate(Bundle state){
        super.onCreate(state);host=new WeakReference<>(this);
        getWindow().setStatusBarColor(0xff111217);getWindow().setNavigationBarColor(0xff111217);
        getWindow().setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE);
        LinearLayout root=new LinearLayout(this);root.setOrientation(LinearLayout.VERTICAL);root.setBackgroundColor(0xff111217);
        LinearLayout bar=new LinearLayout(this);bar.setGravity(Gravity.CENTER_VERTICAL);bar.setPadding(dp(8),0,dp(8),0);
        Button back=key("返回",()->finish());bar.addView(back,new LinearLayout.LayoutParams(dp(64),dp(52)));
        title=new TextView(this);title.setText("本地终端 · Termux");title.setTextColor(0xfff0f1f4);title.setTextSize(18);bar.addView(title,new LinearLayout.LayoutParams(0,dp(52),1));title.setGravity(Gravity.CENTER_VERTICAL);
        bar.addView(key("结束",()->new AlertDialog.Builder(this).setTitle("结束终端？").setMessage("当前终端中的命令会停止。").setNegativeButton("取消",null).setPositiveButton("结束",(d,w)->{if(session!=null)session.finishIfRunning();session=null;finish();}).show()),new LinearLayout.LayoutParams(dp(64),dp(52)));
        root.addView(bar);
        terminal=new TerminalView(this,null);terminal.setTerminalViewClient(this);terminal.setTypeface(Typeface.MONOSPACE);terminal.setTextSize(Math.round(textSp*getResources().getDisplayMetrics().scaledDensity));
        terminal.setPadding(dp(8),dp(4),dp(8),dp(4));root.addView(terminal,new LinearLayout.LayoutParams(-1,0,1));
        HorizontalScrollView scroll=new HorizontalScrollView(this);scroll.setHorizontalScrollBarEnabled(false);LinearLayout keys=new LinearLayout(this);
        keys.addView(key("Esc",()->send("\u001b")));keys.addView(key("Tab",()->send("\t")));keys.addView(key("Ctrl+C",()->send("\u0003")));keys.addView(key("粘贴",this::paste));keys.addView(key("字号 +",()->font(1)));keys.addView(key("字号 −",()->font(-1)));scroll.addView(keys);root.addView(scroll,new LinearLayout.LayoutParams(-1,dp(48)));setContentView(root);
        try{
            if(!new File(RuntimeInstaller.root(this),".harness-runtime-v1").isFile())throw new IllegalStateException("请先完成本地运行环境初始化");
            if(session==null||!session.isRunning()){
                ProcessBuilder builder=RuntimeInstaller.command(this,"/bin/bash","--noprofile","--norc","-i");List<String> argv=new ArrayList<>(builder.command());
                String cwd="/root/workspace/deepseek-harness/default-workspace";new File(RuntimeInstaller.root(this),cwd.substring(1)).mkdirs();argv.set(argv.indexOf("-w")+1,cwd);
                ArrayList<String> env=new ArrayList<>();for(Map.Entry<String,String> e:builder.environment().entrySet())env.add(e.getKey()+"="+e.getValue());
                session=new TerminalSession(argv.get(0),getFilesDir().getAbsolutePath(),argv.toArray(new String[0]),env.toArray(new String[0]),10000,CALLBACKS);
            }
            terminal.attachSession(session);terminal.requestFocus();
        }catch(Throwable e){new AlertDialog.Builder(this).setTitle("终端暂时无法打开").setMessage(e.getMessage()).setPositiveButton("关闭",(d,w)->finish()).show();}
    }
    private Button key(String label,Runnable action){Button b=new Button(this,null,android.R.attr.borderlessButtonStyle);b.setText(label);b.setTextSize(16);b.setTextColor(0xffe8eaf0);b.setMinHeight(dp(48));b.setMinWidth(dp(64));b.setOnClickListener(v->action.run());return b;}
    private void send(String value){if(session!=null)session.write(value);terminal.requestFocus();}
    private void paste(){ClipboardManager c=getSystemService(ClipboardManager.class);if(c.hasPrimaryClip()&&c.getPrimaryClip().getItemCount()>0){CharSequence text=c.getPrimaryClip().getItemAt(0).coerceToText(this);if(text!=null&&session!=null&&session.getEmulator()!=null)session.getEmulator().paste(text.toString());}}
    private void font(int delta){textSp=Math.max(14,Math.min(28,textSp+delta));terminal.setTextSize(Math.round(textSp*getResources().getDisplayMetrics().scaledDensity));}
    @Override protected void onDestroy(){if(host.get()==this)host.clear();super.onDestroy();}
    @Override public float onScale(float scale){if(scale>1.1f){font(1);return 1;}if(scale<0.9f){font(-1);return 1;}return scale;}
    @Override public void onSingleTapUp(MotionEvent e){terminal.requestFocus();getSystemService(InputMethodManager.class).showSoftInput(terminal,InputMethodManager.SHOW_IMPLICIT);}
    @Override public boolean shouldBackButtonBeMappedToEscape(){return false;}
    @Override public boolean shouldEnforceCharBasedInput(){return false;}
    @Override public boolean shouldUseCtrlSpaceWorkaround(){return false;}
    @Override public boolean isTerminalViewSelected(){return true;}
    @Override public void copyModeChanged(boolean on){}
    @Override public boolean onKeyDown(int code,KeyEvent e,TerminalSession s){return false;}
    @Override public boolean onKeyUp(int code,KeyEvent e){return false;}
    @Override public boolean onLongPress(MotionEvent e){return false;}
    @Override public boolean readControlKey(){return false;}
    @Override public boolean readAltKey(){return false;}
    @Override public boolean readShiftKey(){return false;}
    @Override public boolean readFnKey(){return false;}
    @Override public boolean onCodePoint(int code,boolean ctrl,TerminalSession s){return false;}
    @Override public void onEmulatorSet(){}
    @Override public void logError(String t,String m){android.util.Log.e(t,m);}
    @Override public void logWarn(String t,String m){android.util.Log.w(t,m);}
    @Override public void logInfo(String t,String m){android.util.Log.i(t,m);}
    @Override public void logDebug(String t,String m){android.util.Log.d(t,m);}
    @Override public void logVerbose(String t,String m){android.util.Log.v(t,m);}
    @Override public void logStackTraceWithMessage(String t,String m,Exception e){android.util.Log.e(t,m,e);}
    @Override public void logStackTrace(String t,Exception e){android.util.Log.e(t,"Terminal error",e);}
    private static final TerminalSessionClient CALLBACKS=new TerminalSessionClient(){
        public void onTextChanged(TerminalSession s){TermuxTerminalActivity a=host.get();if(a!=null)a.terminal.onScreenUpdated();}
        public void onTitleChanged(TerminalSession s){}
        public void onSessionFinished(TerminalSession s){TermuxTerminalActivity a=host.get();if(a!=null){a.terminal.onScreenUpdated();a.title.setText("终端已结束 · Termux");}}
        public void onCopyTextToClipboard(TerminalSession s,String text){TermuxTerminalActivity a=host.get();if(a!=null)a.getSystemService(ClipboardManager.class).setPrimaryClip(ClipData.newPlainText("terminal",text));}
        public void onPasteTextFromClipboard(TerminalSession s){TermuxTerminalActivity a=host.get();if(a!=null)a.paste();}
        public void onBell(TerminalSession s){}
        public void onColorsChanged(TerminalSession s){onTextChanged(s);}
        public void onTerminalCursorStateChange(boolean on){}
        public Integer getTerminalCursorStyle(){return 0;}
        public void logError(String t,String m){android.util.Log.e(t,m);}
        public void logWarn(String t,String m){android.util.Log.w(t,m);}
        public void logInfo(String t,String m){android.util.Log.i(t,m);}
        public void logDebug(String t,String m){android.util.Log.d(t,m);}
        public void logVerbose(String t,String m){android.util.Log.v(t,m);}
        public void logStackTraceWithMessage(String t,String m,Exception e){android.util.Log.e(t,m,e);}
        public void logStackTrace(String t,Exception e){android.util.Log.e(t,"Terminal error",e);}
    };
}
