#!/system/bin/sh
ROOT="$(pwd)"
PREFIX="$ROOT/files/usr"
export PATH=/system/bin
export LD_LIBRARY_PATH="$PREFIX/lib"
export PROOT_TMP_DIR="$ROOT/files/tmp/proot"
export PROOT_LOADER="$PREFIX/libexec/proot/loader"
export PROOT_LOADER_32="$PREFIX/libexec/proot/loader32"
export TMPDIR="$ROOT/files/tmp"
mkdir -p "$PROOT_TMP_DIR" 2>/dev/null

"$PREFIX/bin/proot" \
  --rootfs="$ROOT/files/linux" \
  --cwd=/root \
  --kill-on-exit -0 \
  -b /dev -b /proc -b /sys -b /data \
  /usr/bin/env -i \
    HOME=/root LANG=C.UTF-8 PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin \
    PROOT_TMP_DIR="$PROOT_TMP_DIR" \
  /bin/sh -c '
    A=/opt/harness/node_modules/node-addon-require-builtin-linux-x64-gnu/prebuilt/linux-x64-gnu-napi-v9.node
    echo "exists=$([ -f $A ] && echo yes || echo no)"
    ls -l $A 2>/dev/null
    echo "--- ldd ---"
    ldd $A 2>&1 | head -20
    echo "--- try require ---"
    /usr/local/bin/node -e "try{require(\"$A\");console.log(\"LOAD_OK\")}catch(e){console.log(\"LOAD_FAIL:\"+e.message)}" 2>&1 | head -5
    echo "--- node abi ---"
    /usr/local/bin/node -p "process.versions.modules"
  ' 2>&1 | head -32
