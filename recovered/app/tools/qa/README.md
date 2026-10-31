# MuMu UI 验收脚本

需要 Node 24、ADB 和本项目开发 APK。安装并启动 APK 后，将该应用的 WebView 调试端口转发到本机 9316。所有命令均指定你要测试的设备序列号，不重启模拟器或清除数据。

```powershell
$env:HARNESS_ADB='你的 adb.exe 绝对路径'
$env:HARNESS_DEVICE='127.0.0.1:16416'
$harnessPid=(& $env:HARNESS_ADB -s $env:HARNESS_DEVICE shell pidof com.deepseek.harness.android).Trim()
& $env:HARNESS_ADB -s $env:HARNESS_DEVICE forward tcp:9316 "localabstract:webview_devtools_remote_$harnessPid"
node tools/qa/mumu-acceptance-v2.cjs
```

默认将报告和截图保存在 `build/qa/`，可通过 `HARNESS_QA_OUTPUT` 指定目录。`HARNESS_CDP_URL` 可指定其他调试端口。

脚本会打开/关闭抽屉和设置、读取各设置分类、短暂切换深色主题后恢复、检查三种视口宽度和安卓返回键；不填写 API Key，不调用模型，不修改真实项目文件。
