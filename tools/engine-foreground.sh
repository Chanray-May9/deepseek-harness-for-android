#!/system/bin/sh
# Foreground engine run with a clean environment: no Termux libs on the path.
ROOT="$(pwd)"
PREFIX="$ROOT/files/usr"
export PATH=/system/bin
# proot itself links against Termux libs; the guest gets a clean env via env -i
export LD_LIBRARY_PATH="$PREFIX/lib"
export PROOT_TMP_DIR="$ROOT/files/tmp/proot"
export PROOT_LOADER="$PREFIX/libexec/proot/loader"
export PROOT_LOADER_32="$PREFIX/libexec/proot/loader32"
export TMPDIR="$ROOT/files/tmp"
mkdir -p "$PROOT_TMP_DIR" 2>/dev/null

"$PREFIX/bin/proot" \
  --rootfs="$ROOT/files/linux" \
  --cwd=/root/workspace \
  --kill-on-exit \
  -0 \
  -b /dev -b /proc -b /sys -b /data \
  /usr/bin/env -i \
    HOME=/root USER=root LOGNAME=root LANG=C.UTF-8 LC_ALL=C.UTF-8 \
    TERM=xterm-256color TMPDIR=/tmp \
    PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin \
    DSH_HOME=/root/.dsh SHELL=/bin/bash \
    PROOT_TMP_DIR="$PROOT_TMP_DIR" \
  /usr/local/bin/node /opt/harness/node_modules/@deepseek-ai/dsh/lib/bin.js \
    --profile web --patch /opt/harness/android.cordis.patch.yml \
    --no-open --host 127.0.0.1 --port 3097 > "$ROOT/files/engine-fg.log" 2>&1

echo "engine_exit=$?"
/system/bin/tail -n 20 "$ROOT/files/engine-fg.log" 2>/dev/null

