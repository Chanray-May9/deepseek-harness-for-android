#!/system/bin/sh
ROOT="$(pwd)"
R="$ROOT/files/linux"

printf '%s\n' \
 '#!/bin/sh' \
 'if [ "$1" = "--version" ]; then' \
 '  echo "GNU bash, version 5.3.20(1)-release (aarch64-android)"' \
 '  echo "Copyright (C) 2022 Free Software Foundation, Inc."' \
 '  echo "License GPLv3+: GNU GPL version 3 or later <http://gnu.org/licenses/gpl.html>"' \
 '  exit 0' \
 'fi' \
 'exec /usr/bin/bash "$@"' \
 > "$R/usr/local/bin/bash"

chmod 755 "$R/usr/local/bin/bash"

printf '%s\n' \
 '#!/bin/sh' \
 'if [ "$1" = "--version" ]; then' \
 '  echo "sh (GNU bash) 5.3.20(1)-release"' \
 '  exit 0' \
 'fi' \
 'exec /usr/bin/sh "$@"' \
 > "$R/usr/local/bin/sh"
chmod 755 "$R/usr/local/bin/sh"

echo "wrappers_written"
ls -l "$R/usr/local/bin/bash" "$R/usr/local/bin/sh" 2>/dev/null | head -2
