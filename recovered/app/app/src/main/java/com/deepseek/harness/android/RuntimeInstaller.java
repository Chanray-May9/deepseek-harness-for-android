package com.deepseek.harness.android;

import android.content.Context;
import android.os.Build;
import android.system.Os;
import org.apache.commons.compress.archivers.tar.TarArchiveEntry;
import org.apache.commons.compress.archivers.tar.TarArchiveInputStream;
import java.io.*;
import java.util.*;
import java.util.zip.GZIPInputStream;

final class RuntimeInstaller {
    interface Progress { void update(String text); }
    static String arch() {
        for (String abi : Build.SUPPORTED_ABIS) {
            if (abi.equals("arm64-v8a")) return "arm64";
            if (abi.equals("x86_64")) return "x64";
        }
        throw new IllegalStateException("需要 64 位安卓系统（ARM64 或 x86_64）");
    }
    static File root(Context c) { return new File(c.getFilesDir(), "linux"); }
    static void install(Context c, Progress p) throws Exception {
        File root=root(c), marker=new File(root,".harness-runtime-v1");
        if(marker.isFile()) return;
        root.mkdirs();
        String arch=arch();
        p.update("正在解压手机本地运行环境，首次启动需要几分钟…");
        extract(c,"rootfs-"+arch+".tar.gz",root,0,p);
        p.update("正在安装 Node.js 24…");
        extract(c,"node-"+arch+".tar.gz",new File(root,"usr/local"),1,p);
        p.update("正在安装原版 DeepSeek Harness…");
        extract(c,"harness-"+arch+".tar.gz",new File(root,"opt/harness"),0,p);
        for(String n: new String[]{"tmp","proc","sys","dev","root/workspace","root/.dsh","etc"})new File(root,n).mkdirs();
        write(new File(root,"etc/resolv.conf"),"nameserver 1.1.1.1\nnameserver 8.8.8.8\n");
        write(new File(root,"etc/hosts"),"127.0.0.1 localhost\n::1 localhost\n");
        write(new File(root,"root/.hushlogin"),"");
        write(marker,"0.2.1-rc.2\n"+arch+"\n");
    }
    static void write(File file,String text) throws Exception {
        file.getParentFile().mkdirs();
        try(FileOutputStream o=new FileOutputStream(file)){o.write(text.getBytes(java.nio.charset.StandardCharsets.UTF_8));}
    }
    private static File safe(File base,String name,boolean follow) throws Exception {
        File f=new File(base,name).getAbsoluteFile();
        String prefix=base.getCanonicalPath()+File.separator;
        String actual=follow?f.getCanonicalPath():f.toPath().normalize().toString();
        if(!actual.equals(base.getCanonicalPath())&&!actual.startsWith(prefix))throw new IOException("Unsafe archive path: "+name);
        return f;
    }
    private static void extract(Context c,String asset,File base,int strip,Progress progress) throws Exception {
        base.mkdirs();
        ArrayList<String[]> hardlinks=new ArrayList<>(); int count=0;
        try(TarArchiveInputStream tar=new TarArchiveInputStream(new GZIPInputStream(c.getAssets().open(asset),262144))){
            TarArchiveEntry e;
            byte[] buffer=new byte[262144];
            while((e=tar.getNextTarEntry())!=null){
                String name=e.getName().replaceFirst("^\\./", "");
                for(int i=0;i<strip;i++){int slash=name.indexOf('/');name=slash<0?"":name.substring(slash+1);}
                if(name.isEmpty()||name.equals("."))continue;
                File out=safe(base,name,!e.isSymbolicLink());
                out.getParentFile().mkdirs();
                if(e.isSymbolicLink()) {
                    try { Os.lstat(out.getAbsolutePath()); Os.unlink(out.getAbsolutePath()); } catch(android.system.ErrnoException ignored){}
                    Os.symlink(e.getLinkName(),out.getAbsolutePath());
                } else if(e.isLink()) {
                    hardlinks.add(new String[]{name,e.getLinkName().replaceFirst("^\\./", "")});
                } else if(e.isDirectory())out.mkdirs();
                else if(e.isFile()) {
                    try(FileOutputStream stream=new FileOutputStream(out)){int n;while((n=tar.read(buffer))!=-1)stream.write(buffer,0,n);}
                    Os.chmod(out.getAbsolutePath(),e.getMode()&0777);
                }
                if(++count%2000==0)progress.update("正在准备本地环境… "+count+" 个文件");
            }
        }
        for(String[] link:hardlinks){File out=safe(base,link[0],true),target=safe(base,link[1],true);out.getParentFile().mkdirs();try{Os.link(target.getPath(),out.getPath());}catch(android.system.ErrnoException ex){if(!out.isFile())throw ex;}}
    }
    static ProcessBuilder command(Context c, String... argv) throws Exception {
        File root=root(c), lib=new File(c.getApplicationInfo().nativeLibraryDir),tmp=new File(c.getCacheDir(),"proot");tmp.mkdirs();
        ArrayList<String> a=new ArrayList<>();
        Collections.addAll(a,new File(lib,"libproot.so").getAbsolutePath(),"--link2symlink","--kill-on-exit","-0","-r",root.getAbsolutePath(),"-b","/dev","-b","/proc","-b","/sys","-w","/root/workspace","/usr/bin/env","-i","HOME=/root","USER=root","LOGNAME=root","LANG=C.UTF-8","LC_ALL=C.UTF-8","TERM=xterm-256color","TMPDIR=/tmp","PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin","DSH_HOME=/root/.dsh","SHELL=/bin/bash");
        Collections.addAll(a,argv);
        ProcessBuilder b=new ProcessBuilder(a);b.redirectErrorStream(true);
        Map<String,String> env=b.environment();env.put("LD_LIBRARY_PATH",lib.getAbsolutePath());env.put("PROOT_TMP_DIR",tmp.getAbsolutePath());env.put("PROOT_LOADER",new File(lib,"libloader.so").getAbsolutePath());env.put("PROOT_LOADER_32",new File(lib,"libloader32.so").getAbsolutePath());env.put("PROOT_NO_SECCOMP","1");
        return b;
    }
}
