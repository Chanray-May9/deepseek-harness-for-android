const fs=require('fs');const root='outputs/DeepSeekHarness-Android-source';let r=fs.readFileSync(root+'/README.md','utf8').replaceAll('0.2.1-android.3','0.2.1-android.4');r=r.replace('参考 DeepSeek 手机界面：首页为蓝鲸、居中欢迎语和底部真实输入框，右上胶囊提供文件工具和新会话。工作区、Agent 模式、模型和权限入口保留。','参考 DeepSeek 手机界面：首页为蓝鲸、居中欢迎语和底部真实输入框，右上胶囊提供文件工具和新会话。工作区、Agent 模式在输入框上方竖排显示，模型和权限入口保留。\n- 通用设置新增“输入框样式”：默认“双层卡片”（空框约 108px 高）；可选择“单行输入”（空闲约 64px 高，编辑时自动展开）。选择保存在本机，重新加载界面后继续生效。\n- 工作区与输入文字为 18px，模型、设置和主要菜单为 16px；常用按钮的点击区域为 44–48px。会话正文最低 16px，代码和终端最低 14px，并尊重更大的字号设置。');r=r.replace('android.3 本轮','android.4 本轮').replace('首页三种宽度、缩小可视高度、真实输入框文本输入','两种输入框样式、偏好保存与刷新恢复、首页三种宽度、缩小可视高度、真实输入框文本输入');fs.writeFileSync(root+'/README.md',r);
const validation=`# 验证记录 — 2026-10-30

版本：Android 0.2.1-android.4；官方 Harness 0.2.1-rc.2。

环境：用户提供的 MuMu Android 15，x86_64，内置 WebView 110。通过实际 APK 的 WebView 调试接口及 ADB 检查。正常截图为实际 MuMu 应用；注明尺寸的窄屏/短高度截图为该 WebView 的可视尺寸覆盖，不能代替对应真机。

| 项目 | 结果与范围 |
| --- | --- |
| 两架构构建、签名和内容 | 通过；全部平台资源与源码一致、原生 ELF 架构正确、v3 签名 |
| MuMu 覆盖安装 | 通过；保留应用数据；已安装 APK 的 SHA256 与最终 x64 构建相同 |
| 静默启动 | 通过；原生蓝鲸、无正常进度或状态文字；冷启动约 11 秒，默认工作区就绪 |
| 首页与菜单 | 通过；居中欢迎语、底部输入框，工作区和模式竖排；收起侧栏宽度为 0，仅保留抽屉入口 |
| 字体与点击区域 | 主要输入和上下文文字 18px；模型/设置/菜单 16px；实测常用按钮 44–48px；会话、代码、终端设置移动端最低字号 |
| 双层卡片 | 通过；默认选择，空框高度实测 108px，文本与操作区分两层 |
| 单行输入 | 通过；空闲高度 64px，编辑时展开为 108px；长按时长的指针点击测试能打开原版文件/指令菜单 |
| 设置中的样式选择 | 通过；位于通用设置；切换立即生效；真实 WebView 刷新后保留；返回通用设置仍显示正确选择 |
| 两种样式的宽高检查 | 通过；320、390、450×776，320×360、450×420；无水平溢出，输入区位于可视区域底部，控件仍可访问 |
| 设置与主题 | 通过；整页、48px 分类、窄屏可横向滚动；模型、插件、Agent 预设页可读取；深浅色切换后恢复原选择 |
| 文本输入和菜单 | 通过；原版编辑器接受文本；未发起模型请求；测试草稿已清理；模式和模型菜单仍可用 |
| 返回键 | 通过设置、抽屉关闭检查 |
| 本地 Bash、文件写读和浏览 | android.2 已通过；本轮运行时资源未改，未重复执行终端/文件测试 |
| 真正模型请求与工具调用 | 未验收；没有配置账户或 API Key |
| 可见原生软键盘 | 未完成；MuMu 搜狗 IME 提供零高度窗口，缩小视口检查独立记录 |
| ARM64 真机、第三方 MCP 和插件全量执行 | 未验收；ARM64 仅构建和静态验证 |

自动结果见 MUMU-VALIDATION.json，构建报告见 APK-VERIFICATION-x64.json、APK-VERIFICATION-arm64.json。当前截图使用 docs/previews/*-v4.png；旧版截图保留为历史记录。

没有重启或清除模拟器，没有迁移电脑上的账户凭据。验收不代表所有桌面插件在 Android 上完全等价。
`;fs.writeFileSync(root+'/VALIDATION.md',validation);
let qa=fs.readFileSync(root+'/tools/qa/mumu-acceptance-v3.cjs','utf8').replaceAll('android.3','android.4').replaceAll('-v3.png','-v4.png').replaceAll('nav.height<=44','nav.height<=48');fs.writeFileSync(root+'/tools/qa/mumu-acceptance-v4.cjs',qa);
let prefs=fs.readFileSync('work/mumu-preferences-v4.cjs','utf8');prefs=prefs.replace("adb='D:/Program Files/Netease/MuMu/nx_main/adb.exe'","adb=process.env.HARNESS_ADB||'adb'");prefs=prefs.replaceAll("'127.0.0.1:16416'","(process.env.HARNESS_DEVICE||'127.0.0.1:16416')");prefs=prefs.replace("(async()=>{const c=", "const OUT=process.env.HARNESS_QA_OUTPUT||'build/qa';fs.mkdirSync(OUT,{recursive:true});\n(async()=>{const c=");prefs=prefs.replace(/'outputs\/([^']+)'/g,(_,file)=>`require('path').join(OUT,${JSON.stringify(file)})`);prefs=prefs.replace("report.lifecycle={cold:JSON.parse(fs.readFileSync('work/mumu-cold-start.json'))};",'');fs.writeFileSync(root+'/tools/qa/mumu-preferences-v4.cjs',prefs);
fs.writeFileSync(root+'/tools/qa/README.md',`# MuMu UI 验收脚本

需要 Node 24、ADB 和本项目开发 APK。设置 HARNESS_ADB、HARNESS_DEVICE 后，将本应用 WebView 调试端口转发到 9316；HARNESS_CDP_URL 可覆盖默认地址。所有命令指定设备，不重启或清除模拟器。

先运行 node tools/qa/mumu-acceptance-v4.cjs，生成通用设置、抽屉、主题与返回键报告。然后将应用带到前台，关闭提示，并以“双层卡片”作为初始设置，运行 node tools/qa/mumu-preferences-v4.cjs，检查两种样式与保存恢复。

默认报告和截图位于 build/qa/，HARNESS_QA_OUTPUT 可覆盖。偏好测试会短暂切换输入框样式并刷新 WebView，最后恢复双层卡片；会输入后清理测试草稿，不发送消息或配置 API Key。原生软键盘的可见性与短高度测试分开记录。
`);
console.log('Updated version 4 documentation and portable UI preference tests');
