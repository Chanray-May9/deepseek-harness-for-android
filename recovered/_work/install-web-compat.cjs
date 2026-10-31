const fs=require('fs');const base='outputs/DeepSeekHarness-Android-source/app/src/main/java/com/deepseek/harness/android/';let p=base+'RuntimeInstaller.java',s=fs.readFileSync(p,'utf8');s=s.replace('    static void write(File file,String text)',`    static void installWebCompat(Context c) throws Exception {
        File frontend=new File(root(c),"opt/harness/node_modules/@deepseek-ai/dsh-web-frontend/dist");
        for(String name:new String[]{"android-web-compat.js","android-abort-compat.js"}){
            File target=new File(frontend,"assets/"+name);
            try(InputStream in=c.getAssets().open(name);OutputStream out=new FileOutputStream(target)){byte[] b=new byte[16384];int n;while((n=in.read(b))!=-1)out.write(b,0,n);}
        }
        File index=new File(frontend,"index.html");
        String html=new String(java.nio.file.Files.readAllBytes(index.toPath()),java.nio.charset.StandardCharsets.UTF_8);
        if(!html.contains("data-harness-android-compat")){
            html=html.replace("<head>","<head>\\n<script data-harness-android-compat src=\\"./assets/android-web-compat.js\\"></script>\\n<script src=\\"./assets/android-abort-compat.js\\"></script>");
            write(index,html);
        }
    }
    static void write(File file,String text)`);s=s.replace('java.nio.file.Files.deleteIfExists(talloc.toPath());Os.symlink(new File(lib,"libtalloc.so").getAbsolutePath(),talloc.getAbsolutePath());',`String tallocTarget=new File(lib,"libtalloc.so").getAbsolutePath();
        if(!java.nio.file.Files.isSymbolicLink(talloc.toPath())||!Os.readlink(talloc.getAbsolutePath()).equals(tallocTarget)){java.nio.file.Files.deleteIfExists(talloc.toPath());Os.symlink(tallocTarget,talloc.getAbsolutePath());}`);fs.writeFileSync(p,s);
p=base+'RuntimeService.java';s=fs.readFileSync(p,'utf8').replace('RuntimeInstaller.install(this,RuntimeService::state);','RuntimeInstaller.install(this,RuntimeService::state);\n            RuntimeInstaller.installWebCompat(this);');fs.writeFileSync(p,s);
