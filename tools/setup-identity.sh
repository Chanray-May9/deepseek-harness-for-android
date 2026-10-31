#!/system/bin/sh
ROOT="$(pwd)"
R="$ROOT/files/linux"
PREFIX="$ROOT/files/usr"
mkdir -p "$R/etc/profile.d" "$R/usr/local/bin" 2>/dev/null

printf '%s\n' \
 'PRETTY_NAME="Termux"' \
 'NAME="Termux"' \
 'ID=termux' \
 'ID_LIKE=android' \
 'VERSION_ID=0.118.0' \
 'HOME_URL="https://termux.dev/"' \
 > "$R/etc/os-release"

printf '%s\n' \
 "TERMUX_VERSION=0.118.0" \
 "PREFIX=$PREFIX" \
 > "$R/etc/termux-version"

printf '%s\n' \
 '#!/bin/sh' \
 'echo "Termux 0.118.0"' \
 'echo "PREFIX='"$PREFIX"'"' \
 'echo "Host: $(uname -m)"' \
 > "$R/usr/local/bin/termux-info"

printf '%s\n' \
 '#!/bin/sh' \
 'echo "此环境使用 apt（Termux 的 pkg 在 proot 内不可用）" >&2' \
 'exec apt "$@"' \
 > "$R/usr/local/bin/pkg"

printf '%s\n' \
 "export PREFIX=$PREFIX" \
 'export TERMUX_VERSION=0.118.0' \
 > "$R/etc/profile.d/termux.sh"

chmod 755 "$R/usr/local/bin/termux-info" "$R/usr/local/bin/pkg" 2>/dev/null
echo "identity_written"
head -2 "$R/etc/os-release" 2>/dev/null || echo "(head unavailable)"
