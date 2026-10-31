#!/system/bin/sh
# What shell does the dsh terminal actually get?
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
 'echo "SHELL=$SHELL"' \
 'echo "which_bash=$(command -v bash)"' \
 'echo "bash_version=$(bash --version 2>/dev/null | head -1)"' \
 'echo "which_sh=$(command -v sh)"' \
 'echo "os=$(. /etc/os-release; echo $PRETTY_NAME)"' \
 'echo "termux_bash_exists_on_host=no"' \
 > "$ROOT/files/linux/root/shell-probe.sh"
chmod 755 "$ROOT/files/linux/root/shell-probe.sh"

"$PREFIX/bin/proot" \
  --rootfs="$ROOT/files/linux" \
  --cwd=/root \
  --kill-on-exit \
  -0 \
  -b /dev -b /proc -b /sys -b /data \
  /usr/bin/env -i \
    HOME=/root USER=root LOGNAME=root LANG=C.UTF-8 LC_ALL=C.UTF-8 \
    TERM=xterm-256color TMPDIR=/tmp \
    PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin \
    DSH_HOME=/root/.dsh SHELL=/bin/bash \
    PROOT_TMP_DIR="$PROOT_TMP_DIR" \
  /bin/sh /root/shell-probe.sh 2>&1
echo "exit=$?"
