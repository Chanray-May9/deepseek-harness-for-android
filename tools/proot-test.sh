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

ROOTFS="$ROOT/files/linux"
[ -d "$ROOTFS" ] || { echo "NO_ROOTFS"; exit 1; }

printf '%s\n' \
 'echo INSIDE_UBUNTU' \
 'grep PRETTY_NAME /etc/os-release' \
 'uname -m' \
 'echo "node=$(/usr/bin/node --version 2>&1)"' \
 > "$ROOTFS/root/probe.sh"
chmod 755 "$ROOTFS/root/probe.sh"

"$PREFIX/bin/proot" \
  --rootfs="$ROOTFS" \
  --cwd=/root \
  --kill-on-exit \
  -0 \
  -b /dev -b /proc -b /sys -b /data -b /system \
  /usr/bin/env -i \
    PATH=/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin \
    HOME=/root TERM=xterm-256color LANG=C.UTF-8 \
    PROOT_TMP_DIR="$PROOT_TMP_DIR" TMPDIR=/tmp \
  /bin/sh /root/probe.sh 2>&1
echo "proot_exit=$?"
