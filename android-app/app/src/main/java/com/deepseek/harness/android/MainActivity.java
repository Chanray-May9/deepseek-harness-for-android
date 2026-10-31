package com.deepseek.harness.android;

import android.Manifest;
import android.app.*;
import android.content.*;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.*;
import android.view.*;
import android.webkit.*;
import android.widget.*;
import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.file.Files;
import java.util.*;
import java.util.zip.*;
import org.json.JSONObject;

public final class MainActivity extends Activity implements RuntimeService.Observer {
    private WebView web;
    private TextView status;
    private LinearLayout loading, loadingActions;
    private ProgressBar loadingProgress;
    private int startupPhase=0;
    private String launchHash="";
    private ValueCallback<Uri[]> fileCallback;
    private PermissionRequest audioRequest;
    private String loadedUrl;
    private File pendingExport;
    private static final int FILE_UPLOAD=10,IMPORT=11,SAVE=12,AUDIO=13;
    private final Handler main=new Handler(Looper.getMainLooper());
    @Override public void onCreate(Bundle saved){
        super.onCreate(saved);
        if ((getApplicationInfo().flags & android.content.pm.ApplicationInfo.FLAG_DEBUGGABLE)!=0) WebView.setWebContentsDebuggingEnabled(true);
        FrameLayout frame=new FrameLayout(this);
        web=new WebView(this);
        WebSettings settings=web.getSettings();
        settings.setJavaScriptEnabled(true); settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false); settings.setAllowContentAccess(true);
        settings.setAllowFileAccessFromFileURLs(false); settings.setAllowUniversalAccessFromFileURLs(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setSupportMultipleWindows(true);settings.setJavaScriptCanOpenWindowsAutomatically(false);
        settings.setMediaPlaybackRequiresUserGesture(true);settings.setTextZoom(100);
        CookieManager.getInstance().setAcceptCookie(true);
        web.setWebViewClient(new WebViewClient(){
            @Override public boolean shouldOverrideUrlLoading(WebView v,WebResourceRequest r){
                if(local(r.getUrl()))return false;
                if(r.isForMainFrame()){external(r.getUrl());return true;}
                return false;
            }
            @Override public void onPageFinished(WebView v,String url){
                if(local(Uri.parse(url)))CookieManager.getInstance().flush();
            }
            @Override public void onReceivedError(WebView v,WebResourceRequest request,WebResourceError error){
                if(request.isForMainFrame()){showStartupFailure("暂时无法打开本地工作区");RuntimeService.log("WebView: "+error.getDescription());}
            }
        });
        web.setWebChromeClient(new WebChromeClient(){
            @Override public boolean onShowFileChooser(WebView view,ValueCallback<Uri[]> cb,FileChooserParams params){
                if(fileCallback!=null)fileCallback.onReceiveValue(null);fileCallback=cb;
                Intent i=new Intent(Intent.ACTION_OPEN_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType("*/*");
                i.putExtra(Intent.EXTRA_ALLOW_MULTIPLE,params.getMode()==FileChooserParams.MODE_OPEN_MULTIPLE);
                startActivityForResult(i,FILE_UPLOAD);return true;
            }
            @Override public void onPermissionRequest(PermissionRequest r){
                main.post(()->{
                    if(!local(r.getOrigin())||!Arrays.asList(r.getResources()).contains(PermissionRequest.RESOURCE_AUDIO_CAPTURE)){r.deny();return;}
                    if(checkSelfPermission(Manifest.permission.RECORD_AUDIO)==PackageManager.PERMISSION_GRANTED)r.grant(new String[]{PermissionRequest.RESOURCE_AUDIO_CAPTURE});
                    else{audioRequest=r;requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO},AUDIO);}
                });
            }
            @Override public boolean onCreateWindow(WebView v,boolean dialog,boolean gesture,android.os.Message result){
                if(!gesture)return false;
                WebView child=new WebView(MainActivity.this);
                child.setWebViewClient(new WebViewClient(){@Override public boolean shouldOverrideUrlLoading(WebView w,WebResourceRequest r){external(r.getUrl());w.destroy();return true;}});
                ((WebView.WebViewTransport)result.obj).setWebView(child);result.sendToTarget();return true;
            }
        });
        web.addJavascriptInterface(new ExportBridge(),"HarnessAndroidExport");
        web.setDownloadListener((url,userAgent,disposition,mime,size)->{
            if(url.startsWith("blob:")){
                String js="(async()=>{try{const r=await fetch("+JSONObject.quote(url)+");const b=await r.blob();if(b.size>33554432)throw Error('文件超过 32 MB，请通过工作区导出');const f=new FileReader();f.onload=()=>HarnessAndroidExport.save(String(f.result).split(',')[1],'download',"+JSONObject.quote(mime==null?"application/octet-stream":mime)+");f.readAsDataURL(b);}catch(e){HarnessAndroidExport.error(String(e));}})()";
                web.evaluateJavascript(js,null);
            }else if(local(Uri.parse(url))){
                new Thread(()->download(url,disposition,mime),"harness-download").start();
            }else external(Uri.parse(url));
        });
        frame.addView(web,new FrameLayout.LayoutParams(-1,-1));
        loading=new LinearLayout(this);loading.setOrientation(LinearLayout.VERTICAL);loading.setGravity(Gravity.CENTER);loading.setPadding(dp(28),dp(28),dp(28),dp(28));loading.setBackgroundColor(0xffffffff);
        ImageView mark=new ImageView(this);mark.setImageResource(getResources().getIdentifier("ic_whale","drawable",getPackageName()));mark.setContentDescription("DeepSeek");loading.addView(mark,new LinearLayout.LayoutParams(dp(64),dp(64)));
        status=new TextView(this);status.setGravity(Gravity.CENTER);status.setTextSize(14);status.setTextColor(0xff697382);status.setVisibility(View.GONE);LinearLayout.LayoutParams message=new LinearLayout.LayoutParams(-2,-2);message.topMargin=dp(24);loading.addView(status,message);
        loadingActions=new LinearLayout(this);loadingActions.setGravity(Gravity.CENTER);loadingActions.setVisibility(View.GONE);
        Button retry=new Button(this,null,android.R.attr.borderlessButtonStyle);retry.setText("重试");retry.setTextColor(0xff4d6bfe);retry.setOnClickListener(v->{loadedUrl=null;loadingActions.setVisibility(View.GONE);status.setVisibility(View.GONE);startRuntime();});loadingActions.addView(retry);
        Button logs=new Button(this,null,android.R.attr.borderlessButtonStyle);logs.setText("查看详情");logs.setTextColor(0xff697382);logs.setOnClickListener(v->showLogs());loadingActions.addView(logs);loading.addView(loadingActions);
        frame.addView(loading,new FrameLayout.LayoutParams(-1,-1));
        setContentView(frame);RuntimeService.observers.add(this);changed();startRuntime();
    }
    private int dp(int value){return Math.round(value*getResources().getDisplayMetrics().density);}
    private static boolean local(Uri u){return "http".equals(u.getScheme())&&"127.0.0.1".equals(u.getHost())&&u.getPort()==3080;}
    private void external(Uri u){if(!Arrays.asList("http","https","mailto","tel").contains(u.getScheme()))return;try{startActivity(new Intent(Intent.ACTION_VIEW,u));}catch(ActivityNotFoundException e){toast("没有可以打开此链接的应用");}}
    private void startRuntime(){startForegroundService(new Intent(this,RuntimeService.class));}
    private void showStartupFailure(String text){loading.setVisibility(View.VISIBLE);loadingActions.setVisibility(View.VISIBLE);status.setVisibility(View.VISIBLE);status.setText(text);}
    private String hash(String value){try{byte[] bytes=java.security.MessageDigest.getInstance("SHA-256").digest(value.getBytes(java.nio.charset.StandardCharsets.UTF_8));StringBuilder out=new StringBuilder();for(byte item:bytes)out.append(String.format("%02x",item&255));return out.toString();}catch(Exception e){throw new IllegalStateException(e);}}
    private void updateStartup(String raw){
        if(raw.contains("失败")||raw.contains("已退出")||raw.equals("已停止")){showStartupFailure("启动未完成，请重试");return;}

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
    private void menu(){new AlertDialog.Builder(this).setTitle("DeepSeek Harness").setItems(new String[]{"重新加载界面","导入文件到工作区","导出工作区 ZIP","查看运行日志","启动运行环境","停止运行环境","安装 Git/Python 等开发工具","版本与运行环境"},(dialog,which)->{
        switch(which){
            case 0:if(RuntimeService.launchUrl!=null)web.reload();else startRuntime();break;
            case 1:startActivityForResult(new Intent(Intent.ACTION_OPEN_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType("*/*").putExtra(Intent.EXTRA_ALLOW_MULTIPLE,true),IMPORT);break;
            case 2:new Thread(this::exportWorkspace,"harness-export").start();break;
            case 3:showLogs();break;
            case 4:startRuntime();break;
            case 5:stopService(new Intent(this,RuntimeService.class));showStartupFailure("运行环境已停止");break;
            case 6:startForegroundService(new Intent(this,RuntimeService.class).setAction("TOOLS"));toast("正在安装开发工具，进度可在运行日志查看。");break;
            case 7:new AlertDialog.Builder(this).setTitle("版本与运行环境").setMessage("DeepSeek Harness 0.2.1-rc.2\n非官方 Android 移植版 0.2.1-android.1\n\n运行时与文件均在手机本地。模型调用需要网络及你自己的账户或 API Key。\n\n使用 DeepSeek Harness（MIT）及 PRoot（GPLv2）。\n安装包附带源代码和第三方许可。\n\n当前构建仍需按功能对照清单验收。").setPositiveButton("关闭",null).show();break;
        }
    }).show();}
    private void showLogs(){TextView t=new TextView(this);t.setTextIsSelectable(true);t.setPadding(24,16,24,16);t.setTextSize(11);t.setText(RuntimeService.logs());ScrollView sc=new ScrollView(this);sc.addView(t);new AlertDialog.Builder(this).setTitle("本地运行日志").setView(sc).setPositiveButton("关闭",null).show();}
    private void toast(String message){main.post(()->Toast.makeText(this,message,Toast.LENGTH_LONG).show());}
    @Override protected void onDestroy(){RuntimeService.observers.remove(this);if(fileCallback!=null)fileCallback.onReceiveValue(null);web.destroy();super.onDestroy();}
    @Override public void onBackPressed(){if(loading.getVisibility()!=View.GONE){moveTaskToBack(true);return;}web.evaluateJavascript("Boolean(window.HarnessMobile&&HarnessMobile.back())",value->{if(!"true".equals(value)){if(web.canGoBack())web.goBack();else moveTaskToBack(true);}});}
    @Override public void onRequestPermissionsResult(int request,String[] permissions,int[] grants){super.onRequestPermissionsResult(request,permissions,grants);if(request==AUDIO&&audioRequest!=null){if(grants.length>0&&grants[0]==PackageManager.PERMISSION_GRANTED)audioRequest.grant(new String[]{PermissionRequest.RESOURCE_AUDIO_CAPTURE});else audioRequest.deny();audioRequest=null;}}
    @Override protected void onActivityResult(int request,int result,Intent data){
        super.onActivityResult(request,result,data);
        if(request==FILE_UPLOAD){if(fileCallback!=null){fileCallback.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(result,data));fileCallback=null;}return;}
        if(result!=RESULT_OK||data==null)return;
        if(request==IMPORT)new Thread(()->{try{
            ArrayList<Uri> uris=new ArrayList<>();if(data.getClipData()!=null)for(int i=0;i<data.getClipData().getItemCount();i++)uris.add(data.getClipData().getItemAt(i).getUri());else if(data.getData()!=null)uris.add(data.getData());
            File dir=new File(RuntimeInstaller.root(this),"root/workspace/imports");dir.mkdirs();
            for(Uri u:uris){String name="import-"+System.currentTimeMillis();try(android.database.Cursor cursor=getContentResolver().query(u,new String[]{android.provider.OpenableColumns.DISPLAY_NAME},null,null,null)){if(cursor!=null&&cursor.moveToFirst())name=cursor.getString(0);}name=name.replaceAll("[^\\p{L}\\p{N}._ -]","_");if(name.equals(".")||name.equals("..")||name.isEmpty())name="import";File file=new File(dir,name);if(file.exists())file=new File(dir,System.currentTimeMillis()+"-"+name);try(InputStream in=getContentResolver().openInputStream(u);OutputStream out=new FileOutputStream(file)){copy(in,out);}}
            toast("已导入 /root/workspace/imports");
        }catch(Exception e){toast("导入失败："+e.getMessage());}},"harness-import").start();
        if(request==SAVE&&pendingExport!=null){File file=pendingExport;pendingExport=null;Uri uri=data.getData();new Thread(()->{try(InputStream in=new FileInputStream(file);OutputStream out=getContentResolver().openOutputStream(uri)){copy(in,out);toast("导出完成");file.delete();}catch(Exception e){toast("导出失败："+e.getMessage());}},"harness-save").start();}
    }
    private void offerSave(File file,String name,String mime){main.post(()->{pendingExport=file;startActivityForResult(new Intent(Intent.ACTION_CREATE_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType(mime==null?"application/octet-stream":mime).putExtra(Intent.EXTRA_TITLE,name),SAVE);});}
    private void download(String url,String disposition,String mime){try{
        HttpURLConnection c=(HttpURLConnection)new URL(url).openConnection();c.setConnectTimeout(15000);c.setReadTimeout(60000);c.setInstanceFollowRedirects(false);String cookie=CookieManager.getInstance().getCookie(url);if(cookie!=null)c.setRequestProperty("Cookie",cookie);
        if(c.getResponseCode()!=200)throw new IOException("HTTP "+c.getResponseCode());File file=File.createTempFile("download-",".bin",getCacheDir());try(InputStream in=c.getInputStream();OutputStream out=new FileOutputStream(file)){copy(in,out);}finally{c.disconnect();}offerSave(file,URLUtil.guessFileName(url,disposition,mime),mime);
    }catch(Exception e){toast("下载失败："+e.getMessage());}}
    private void exportWorkspace(){try{
        File dir=new File(RuntimeInstaller.root(this),"root/workspace"),zip=File.createTempFile("workspace-",".zip",getCacheDir());
        try(ZipOutputStream out=new ZipOutputStream(new FileOutputStream(zip))){zipTree(dir,dir,out);}
        offerSave(zip,"Harness-workspace.zip","application/zip");
    }catch(Exception e){toast("导出失败："+e.getMessage());}}
    private static void zipTree(File base,File dir,ZipOutputStream zip)throws Exception{File[] files=dir.listFiles();if(files==null)return;for(File file:files){if(Files.isSymbolicLink(file.toPath()))continue;if(file.isDirectory())zipTree(base,file,zip);else{zip.putNextEntry(new ZipEntry(base.toPath().relativize(file.toPath()).toString().replace('\\','/')));try(InputStream in=new FileInputStream(file)){copy(in,zip);}zip.closeEntry();}}}
    private static void copy(InputStream in,OutputStream out)throws IOException{if(in==null||out==null)throw new IOException("无法访问所选文件");byte[] buf=new byte[65536];int n;while((n=in.read(buf))!=-1)out.write(buf,0,n);}
    public final class ExportBridge {
        @JavascriptInterface public void openMenu(){main.post(()->menu());}
        @JavascriptInterface public void ready(){main.post(()->{loading.setVisibility(View.GONE);CookieManager.getInstance().flush();if(!launchHash.isEmpty())getPreferences(MODE_PRIVATE).edit().putString("last_launch_hash",launchHash).apply();});}
        @JavascriptInterface public void save(String data,String name,String mime){if(data.length()>45000000){error("文件过大，请导出工作区");return;}new Thread(()->{try{File f=File.createTempFile("export-",".bin",getCacheDir());try(OutputStream out=new FileOutputStream(f)){out.write(android.util.Base64.decode(data,android.util.Base64.DEFAULT));}offerSave(f,name,mime);}catch(Exception e){error(e.getMessage());}},"harness-blob").start();}
        @JavascriptInterface public void error(String message){toast(message);}
    }
}
