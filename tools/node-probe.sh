#!/system/bin/sh
ROOT="$(pwd)"
export PREFIX="$ROOT/files/usr"
export LD_LIBRARY_PATH="$PREFIX/lib"
export PATH="$PREFIX/bin:/system/bin"
export PROOT_TMP_DIR="$ROOT/files/tmp/proot"
export PROOT_LOADER="$PREFIX/libexec/proot/loader"
export PROOT_LOADER_32="$PREFIX/libexec/proot/loader32"
export TMPDIR="$ROOT/files/tmp"
mkdir -p "$PROOT_TMP_DIR" 2>/dev/null

printf '%s\n' \
 'echo "NODE=$(node --version 2>&1)"' \
 'echo "NODE_PATH=$(command -v node)"' \
 'echo "DISTRO=$(. /etc/os-release; echo $PRETTY_NAME)"' \
 'echo "UNAME=$(uname -m)"' \
 'echo "PREFIX_SEEN=${PREFIX:-none}"' \
 > "$ROOT/files/linux/root/probe2.sh"
chmod 755 "$ROOT/files/linux/root/probe2.sh"

"$PREFIX/bin/proot" \
  --rootfs="$ROOT/files/linux" \
  --cwd=/root \
  --kill-on-exit \
  -0 \
  -b /dev -b /proc -b /sys -b /data \
  /usr/bin/env -i \
    PATH=/usr/local/bin:/usr/bin:/bin \
    HOME=/root TERM=xterm-256color \
    PROOT_TMP_DIR="$PROOT_TMP_DIR" TMPDIR=/tmp \
  /bin/sh /root/probe2.sh 2>&1
echo "exit=$?"
