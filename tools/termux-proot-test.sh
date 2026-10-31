#!/system/bin/sh
# Termux shell -> proot -> Ubuntu rootfs -> glibc node.
ROOT="$(pwd)"
export PREFIX="$ROOT/files/usr"
export HOME="$ROOT/files/home"
export TMPDIR="$PREFIX/tmp"
export PATH="$PREFIX/bin"
export LD_LIBRARY_PATH="$PREFIX/lib"
mkdir -p "$HOME" "$TMPDIR"

echo "--- termux layer ---"
"$PREFIX/bin/bash" -lc 'echo TERMUX_BASH_OK; echo "PREFIX=$PREFIX"; echo "uname=$(uname -m)"'

echo "--- proot present? ---"
ls -l "$PREFIX/bin/proot" 2>&1 | head -2
ls -l "$PREFIX/lib/libtalloc.so.2" 2>&1 | head -2

echo "--- enter ubuntu rootfs ---"
ROOTFS="$ROOT/files/linux"
if [ ! -d "$ROOTFS" ]; then echo "NO_ROOTFS"; exit 1; fi
ls "$ROOTFS" | head -5

"$PREFIX/bin/proot" \
  --rootfs="$ROOTFS" \
  --cwd=/root \
  --kill-on-exit \
  -0 \
  -b /dev -b /proc -b /sys -b /data \
  /usr/bin/env -i PATH=/usr/local/bin:/usr/bin:/bin HOME=/root TERM=xterm-256color \
  /bin/sh -c 'echo INSIDE_UBUNTU; . /etc/os-release 2>/dev/null; echo "distro=$PRETTY_NAME"; uname -m; node --version 2>/dev/null || echo "node missing"; which node' \
  2>&1 | head -20

echo "exit=$?"
