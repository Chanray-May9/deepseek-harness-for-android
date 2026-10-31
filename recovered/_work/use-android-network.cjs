const fs=require('fs'),p='outputs/DeepSeekHarness-Android-source/app/src/main/java/com/deepseek/harness/android/RuntimeInstaller.java';let s=fs.readFileSync(p,'utf8');s=s.replace('    static void installWebCompat(Context c) throws Exception {','    static void installWebCompat(Context c) throws Exception {\n        configureNetwork(c);');s=s.replace('    static void write(File file,String text)',`    static void configureNetwork(Context c) throws Exception {
        android.net.ConnectivityManager network=c.getSystemService(android.net.ConnectivityManager.class);
        android.net.LinkProperties link=network.getLinkProperties(network.getActiveNetwork());
        if(link!=null&&!link.getDnsServers().isEmpty()){
            StringBuilder dns=new StringBuilder();for(java.net.InetAddress server:link.getDnsServers())dns.append("nameserver ").append(server.getHostAddress()).append('\\n');
            dns.append("options timeout:2 attempts:2\\n");write(new File(root(c),"etc/resolv.conf"),dns.toString());
        }
    }
    static void write(File file,String text)`);fs.writeFileSync(p,s);
