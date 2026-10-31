const fs=require('fs');const base='outputs/DeepSeekHarness-Android-source/app/src/main/java/com/deepseek/harness/android/';let p=base+'RuntimeService.java',s=fs.readFileSync(p,'utf8');s=s.replace('private volatile java.lang.Process process;','private volatile java.lang.Process process, toolsProcess;\n    private final java.util.concurrent.atomic.AtomicBoolean toolsRunning=new java.util.concurrent.atomic.AtomicBoolean();');s=s.replace('if(started.compareAndSet(false,true))',`if(i!=null&&"TOOLS".equals(i.getAction())){installTools();return START_STICKY;}
        if(started.compareAndSet(false,true))`);s=s.replace('    @Override public void onDestroy()',`    private void installTools(){
        if(!toolsRunning.compareAndSet(false,true))return;
        new Thread(()->{try{
            log("正在为手机本地工作区安装 Git / Python / tmux / curl 等工具，需要联网…");
            toolsProcess=RuntimeInstaller.command(this,"/bin/bash","-lc","export DEBIAN_FRONTEND=noninteractive; apt-get -o APT::Sandbox::User=root update && apt-get -o APT::Sandbox::User=root -o Dpkg::Use-Pty=0 install -y --no-install-recommends git python3 python3-venv tmux curl ca-certificates unzip zip procps patch openssh-client").start();
            try(BufferedReader r=new BufferedReader(new InputStreamReader(toolsProcess.getInputStream()))){String line;while((line=r.readLine())!=null)log(line);}
            int code=toolsProcess.waitFor();log(code==0?"开发工具安装完成。":"开发工具安装失败（"+code+"），可联网后重试。");
        }catch(Exception e){log("开发工具安装失败："+e.getMessage());}finally{toolsRunning.set(false);}},"harness-tools").start();
    }
    @Override public void onDestroy()`);s=s.replace('if(process!=null)process.destroy();','if(process!=null)process.destroy();if(toolsProcess!=null)toolsProcess.destroy();');fs.writeFileSync(p,s);
p=base+'MainActivity.java';s=fs.readFileSync(p,'utf8');s=s.replace('"停止运行环境","版本与运行环境"','"停止运行环境","安装 Git/Python 等开发工具","版本与运行环境"');s=s.replace('case 6:new AlertDialog.Builder', 'case 6:startForegroundService(new Intent(this,RuntimeService.class).setAction("TOOLS"));toast("正在安装开发工具，进度可在运行日志查看。");break;\n            case 7:new AlertDialog.Builder');fs.writeFileSync(p,s);
