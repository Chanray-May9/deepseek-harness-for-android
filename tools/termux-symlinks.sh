#!/system/bin/sh
# Termux bootstrap ships SYMLINKS.txt because zip cannot store symlinks.
ROOT="$(pwd)"
cd "$ROOT/files/usr" || exit 1
if [ ! -f SYMLINKS.txt ]; then echo "NO_SYMLINKS_FILE"; exit 1; fi
COUNT=0
while IFS= read -r line; do
  [ -z "$line" ] && continue
  target=$(printf '%s' "$line" | cut -d'|' -f1)
  link=$(printf '%s' "$line" | cut -d'|' -f2)
  # tolerate either separators used by different bootstrap builds
  if [ "$link" = "$target" ]; then
    target=$(printf '%s' "$line" | /system/bin/cut -c1-999 | sed 's/[^|]*$//' 2>/dev/null)
  fi
  if [ -n "$target" ] && [ -n "$link" ]; then
    ln -sf "$target" "$link" 2>/dev/null && COUNT=$((COUNT+1))
  fi
done < SYMLINKS.txt
echo "links_created=$COUNT"
head -3 SYMLINKS.txt 2>/dev/null || /system/bin/head -3 SYMLINKS.txt
