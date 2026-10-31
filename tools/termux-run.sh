#!/system/bin/sh
# Enter the Termux userland that lives in the app's private dir.
ROOT="$(pwd)"
export PREFIX="$ROOT/files/usr"
export HOME="$ROOT/files/home"
export TMPDIR="$PREFIX/tmp"
export PATH="$PREFIX/bin"
export LD_LIBRARY_PATH="$PREFIX/lib"
export TERM="${TERM:-xterm-256color}"
export LANG=en_US.UTF-8
mkdir -p "$HOME" "$TMPDIR" 2>/dev/null

if [ ! -x "$PREFIX/bin/bash" ]; then
  echo "NO_BASH"
  exit 1
fi

if [ "$1" = "--probe" ]; then
  "$PREFIX/bin/bash" -c '
    echo BASH_OK
    echo "PREFIX=$PREFIX"
    echo "bash=$BASH_VERSION"
    echo "uname=$(uname -m)"
    echo "uid=$(id -u)"
    echo "ls=$(command -v ls)"
    echo "pkg=$([ -x "$PREFIX/bin/pkg" ] && echo yes || echo no)"
    echo "apt=$([ -x "$PREFIX/bin/apt" ] && echo yes || echo no)"
    echo "node=$([ -x "$PREFIX/bin/node" ] && echo yes || echo no)"
  '
  exit $?
fi

exec "$PREFIX/bin/bash" "$@"
