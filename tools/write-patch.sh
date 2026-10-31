#!/system/bin/sh
# Write the cordis patch that carries the environment persona.
ROOT="$(pwd)"
F="$ROOT/files/linux/opt/harness/android.cordis.patch.yml"
mkdir -p "$ROOT/files/linux/opt/harness" 2>/dev/null

printf '%s\n' \
 '- id: workspace-controller' \
 '  config:' \
 '    documentsDirectory: /root/workspace' \
 '- id: system-prompt' \
 '  config:' \
 '    personaPrefix: |' \
 '      你在 Android 手机上的 DeepSeek Harness 安卓版中运行，不是桌面 Linux，也不是云服务器。' \
 '      环境身份是 Termux（Android 终端环境）：cat /etc/os-release 显示 Termux，shell 为 bash 5.3.20。' \
 '      命令实际执行在 PRoot 提供的 glibc 用户态中（为了运行 Node.js 及其原生模块），' \
 '      因此 uname -a、/proc 等会显示 Linux 宿主信息，这是正常的，不要据此认为自己在普通服务器上。' \
 '      包管理用 apt（pkg 已映射到 apt）；PREFIX 指向应用私有目录下的 Termux 根。' \
 '      工作目录默认 /root/workspace。网络出口是手机自身网络，没有公网 IP。' \
 > "$F"

echo "patch_written"
cat "$F" 2>/dev/null | head -8
