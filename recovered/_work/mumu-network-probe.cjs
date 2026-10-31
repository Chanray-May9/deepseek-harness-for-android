const {execFileSync}=require('child_process');const adb='D:/Program Files/Netease/MuMu/nx_main/adb.exe';const script=String.raw`set -e
BASE="$PWD/files"
TALLOC=$(readlink "$BASE/native/links/libtalloc.so.2")
LIBDIR=$(dirname "$TALLOC")
export LD_LIBRARY_PATH="$BASE/native/links:$LIBDIR"
export PROOT_LOADER="$LIBDIR/libloader.so" PROOT_LOADER_32="$BASE/native/loader32" PROOT_TMP_DIR="$PWD/cache/proot" PROOT_NO_SECCOMP=1
"$LIBDIR/libproot.so" --kill-on-exit -0 -r "$BASE/linux" -b /dev -b /proc -b /sys -w /root/workspace /usr/bin/env -i HOME=/root PATH=/usr/local/bin:/usr/bin:/bin TMPDIR=/tmp /usr/local/bin/node -e "fetch('https://api.deepseek.com/models',{signal:AbortSignal.timeout(10000)}).then(r=>console.log('ANDROID_HTTPS_CHECK '+r.status)).catch(e=>{console.error('ANDROID_HTTPS_ERROR '+e.message+' '+(e.cause?.code||''));process.exitCode=1})"
`;try{console.log(execFileSync(adb,['-s','127.0.0.1:16416','exec-out','run-as','com.deepseek.harness.android','sh'],{input:script,encoding:'utf8',timeout:20000}).trim())}catch(e){console.log(e.stdout);process.exitCode=1}
