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
    set -e
    BASE=/opt/harness/node_modules
    SRC=$BASE/node-addon-require-builtin-linux-x64-gnu/prebuilt/linux-x64-gnu-napi-v9.node
    for D in \
      "$BASE/node-addon-require-builtin/build/napi/napi-v9-linux-x64-gnu" \
      "$BASE/node-addon-require-builtin/build/nodeabi/node-v137-linux-x64-gnu" \
      "$BASE/node-addon-require-builtin/build/Release" ; do
      mkdir -p "$D"
      cp -f "$SRC" "$D/require_builtin.node"
      echo "placed: $D/require_builtin.node"
    done
    ls -l "$BASE/node-addon-require-builtin/build/napi/napi-v9-linux-x64-gnu/" 2>/dev/null
  ' 2>&1 | head -14
