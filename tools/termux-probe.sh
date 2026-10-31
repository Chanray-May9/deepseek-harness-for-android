#!/system/bin/sh
# Probe whether the Termux bootstrap runs inside the app's private dir.
set -e
ROOT="$(pwd)"
export PREFIX="$ROOT/files/usr"
export HOME="$ROOT/files/home"
export TMPDIR="$PREFIX/tmp"
export PATH="$PREFIX/bin"
export LD_LIBRARY_PATH="$PREFIX/lib"
mkdir -p "$HOME" "$TMPDIR"

echo "prefix=$PREFIX"
echo "bash_exists=$([ -x "$PREFIX/bin/bash" ] && echo yes || echo no)"
echo "bin_count=$(ls -1 "$PREFIX/bin" 2>/dev/null | wc -l)"

"$PREFIX/bin/bash" -lc 'echo BASH_OK; echo "PREFIX=$PREFIX"; uname -m; echo "uid=$(id -u)"; echo "ls=$(command -v ls)"; echo "sh=$(command -v sh)"; echo "cat=$(command -v cat)"' || echo "BASH_FAILED=$?"
