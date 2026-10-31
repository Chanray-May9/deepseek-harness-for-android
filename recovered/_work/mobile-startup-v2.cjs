const fs=require('fs');const file='outputs/DeepSeekHarness-Android-source/app/src/main/java/com/deepseek/harness/android/MainActivity.java';let s=fs.readFileSync(file,'utf8');s=s.replace('private LinearLayout loading;','private LinearLayout loading, loadingActions;\n    private ProgressBar loadingProgress;\n    private int startupPhase=0;\n    private String launchHash="";');const a=s.indexOf('        loading=new LinearLayout(this);'),b=s.indexOf('        setContentView(frame);',a);s=s.slice(0,a)+`        loading=new LinearLayout(this);loading.setOrientation(LinearLayout.VERTICAL);loading.setGravity(Gravity.CENTER);loading.setPadding(dp(28),dp(28),dp(28),dp(28));loading.setBackgroundColor(0xfffafbfc);
        ImageView mark=new ImageView(this);mark.setImageResource(getResources().getIdentifier("launcher","drawable",getPackageName()));LinearLayout.LayoutParams icon=new LinearLayout.LayoutParams(dp(64),dp(64));icon.bottomMargin=dp(18);loading.addView(mark,icon);
        TextView title=new TextView(this);title.setText("DeepSeek Harness");title.setTextSize(24);title.setTextColor(0xff202124);title.setGravity(Gravity.CENTER);loading.addView(title);
        TextView subtitle=new TextView(this);subtitle.setText("你的本地 AI 工作区");subtitle.setTextSize(13);subtitle.setTextColor(0xff7b8491);subtitle.setGravity(Gravity.CENTER);LinearLayout.LayoutParams sub=new LinearLayout.LayoutParams(-2,-2);sub.topMargin=dp(8);loading.addView(subtitle,sub);
        loadingProgress=new ProgressBar(this,null,android.R.attr.progressBarStyleHorizontal);loadingProgress.setMax(100);loadingProgress.setProgressTintList(android.content.res.ColorStateList.valueOf(0xff4d6bfe));LinearLayout.LayoutParams pp=new LinearLayout.LayoutParams(dp(180),dp(4));pp.topMargin=dp(32);pp.bottomMargin=dp(16);loading.addView(loadingProgress,pp);
        status=new TextView(this);status.setGravity(Gravity.CENTER);status.setTextSize(13);status.setTextColor(0xff697382);loading.addView(status);
        loadingActions=new LinearLayout(this);loadingActions.setGravity(Gravity.CENTER);loadingActions.setVisibility(View.GONE);
        Button retry=new Button(this,null,android.R.attr.borderlessButtonStyle);retry.setText("重试");retry.setTextColor(0xff4d6bfe);retry.setOnClickListener(v->{loadedUrl=null;loadingActions.setVisibility(View.GONE);loadingProgress.setVisibility(View.VISIBLE);status.setText("正在重新启动…");startRuntime();});loadingActions.addView(retry);
        Button logs=new Button(this,null,android.R.attr.borderlessButtonStyle);logs.setText("查看详情");logs.setTextColor(0xff697382);logs.setOnClickListener(v->showLogs());loadingActions.addView(logs);loading.addView(loadingActions);
        frame.addView(loading,new FrameLayout.LayoutParams(-1,-1));
`+s.slice(b);
s=s.replace('if(local(Uri.parse(url))){loading.setVisibility(View.GONE);CookieManager.getInstance().flush();}','if(local(Uri.parse(url)))CookieManager.getInstance().flush();');s=s.replace('loading.setVisibility(View.VISIBLE);status.setText("页面加载失败："+error.getDescription()+"\\n可点菜单重新加载或查看运行日志。");','showStartupFailure("暂时无法打开本地工作区");RuntimeService.log("WebView: "+error.getDescription());');s=s.replace('main.post(()->Toast.makeText(this,message,Toast.LENGTH_LONG).show())','main.post(()->Toast.makeText(this,message,Toast.LENGTH_LONG).show())');
const start=s.indexOf('    @Override public void changed(){'),end=s.indexOf('    private void menu(){',start);
s=s.slice(0,start)+`    private void showStartupFailure(String text){loading.setVisibility(View.VISIBLE);loadingProgress.setVisibility(View.GONE);loadingActions.setVisibility(View.VISIBLE);status.setText(text);}
    private String hash(String value){try{byte[] bytes=java.security.MessageDigest.getInstance("SHA-256").digest(value.getBytes(java.nio.charset.StandardCharsets.UTF_8));StringBuilder out=new StringBuilder();for(byte item:bytes)out.append(String.format("%02x",item&255));return out.toString();}catch(Exception e){throw new IllegalStateException(e);}}
    private void updateStartup(String raw){
        if(raw.contains("失败")||raw.contains("已退出")||raw.equals("已停止")){showStartupFailure("启动未完成，请重试");return;}
        String text="正在启动…";int progress=4;
        if(raw.contains("解压")){startupPhase=0;text="首次启动，正在准备本地环境";progress=8;}
        else if(raw.contains("安装 Node")){startupPhase=1;text="正在准备本地环境";progress=12;}
        else if(raw.contains("安装原版")){startupPhase=2;text="正在准备你的工作区";progress=24;}
        else if(raw.contains("个文件")){text=startupPhase==2?"正在准备你的工作区":"首次启动，正在准备本地环境";java.util.regex.Matcher m=java.util.regex.Pattern.compile("(\\\\d+) 个文件").matcher(raw);if(m.find()){int n=Integer.parseInt(m.group(1));progress=startupPhase==2?24+Math.min(64,n*64/68000):startupPhase==1?12+Math.min(10,n*10/5700):4+Math.min(7,n*7/3400);}}
        else if(raw.contains("检查本地")){text="正在检查本地环境";progress=92;}
        else if(raw.contains("启动原版")||raw.equals("运行中")){text="正在打开你的工作区";progress=97;}
        status.setText(text);loadingProgress.setProgress(progress);
    }
    @Override public void changed(){main.post(()->{
        if(isFinishing())return;updateStartup(RuntimeService.status);
        String url=RuntimeService.launchUrl;
        if(url!=null&&!url.equals(loadedUrl)){
            loadedUrl=url;launchHash=hash(url);
            boolean used=getPreferences(MODE_PRIVATE).getString("last_launch_hash","").equals(launchHash);
            web.loadUrl(used?"http://127.0.0.1:3080/":url);
            main.postDelayed(()->{if(loading.getVisibility()==View.VISIBLE&&RuntimeService.launchUrl!=null)showStartupFailure("工作区连接较慢，请重试");},45000);
        }
        if(url==null)loading.setVisibility(View.VISIBLE);
    });}
`+s.slice(end);
s=s.replace('@Override public void onBackPressed(){if(web.canGoBack()&&loading.getVisibility()==View.GONE)web.goBack();else menu();}',`@Override public void onBackPressed(){if(loading.getVisibility()!=View.GONE){moveTaskToBack(true);return;}web.evaluateJavascript("Boolean(window.HarnessMobile&&HarnessMobile.back())",value->{if(!"true".equals(value)){if(web.canGoBack())web.goBack();else moveTaskToBack(true);}});}`);
s=s.replace('public final class ExportBridge {','public final class ExportBridge {\n        @JavascriptInterface public void openMenu(){main.post(()->menu());}\n        @JavascriptInterface public void ready(){main.post(()->{loading.setVisibility(View.GONE);CookieManager.getInstance().flush();if(!launchHash.isEmpty())getPreferences(MODE_PRIVATE).edit().putString("last_launch_hash",launchHash).apply();});}');
fs.writeFileSync(file,s);
const service='outputs/DeepSeekHarness-Android-source/app/src/main/java/com/deepseek/harness/android/RuntimeService.java';s=fs.readFileSync(service,'utf8');s=s.replace('private static final StringBuilder LOG=new StringBuilder();','private static final StringBuilder LOG=new StringBuilder();\n    private static volatile File logFile;');s=s.replace('android.util.Log.i("HarnessRuntime",clean);','android.util.Log.i("HarnessRuntime",clean);\n        try{if(logFile!=null){try(FileOutputStream file=new FileOutputStream(logFile,true)){file.write((clean+"\\n").getBytes(java.nio.charset.StandardCharsets.UTF_8));}}}catch(IOException ignored){}');s=s.replace('super.onCreate();NotificationManager','super.onCreate();logFile=new File(getFilesDir(),"runtime.log");if(logFile.length()>2000000)try{new FileOutputStream(logFile).close();}catch(IOException ignored){}NotificationManager');fs.writeFileSync(service,s);
