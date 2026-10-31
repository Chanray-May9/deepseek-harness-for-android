const fs=require('fs');const root='outputs/DeepSeekHarness-Android-source';fs.copyFileSync(root+'/VALIDATION.md',root+'/docs/VALIDATION-android.4.md');fs.writeFileSync(root+'/VALIDATION.md',`# 验证记录 — Android 0.2.1-android.5

本轮只修改首页双层卡片的上边缘。此前界面检查见 docs/VALIDATION-android.4.md 和 MUMU-VALIDATION-android.4.json；不据此宣称本轮重跑所有旧检查。

在用户 MuMu Android 15 / x86_64 的实际 APK 上完成 6 项针对性检查：

- 上边缘从 y=652px 提到 y=646px，准确上移 6px；底部仍为 y=760px。
- 卡片高度从 108px 调到 114px；文字、底部按钮和工作区选择的位置完全一致。
- 单行模式空闲仍为 64px，编辑时仍为 108px。
- 测试后恢复原双层卡片选择，保留现有数据。
- 已安装 APK 的 SHA256 与最终 x64 构建一致。

两架构均重新构建、验签并完成 APK 内容和 ELF 架构静态检查。截图见 docs/previews/mumu-home-v5.png 和 mumu-native-final-v5.png；自动结果见 MUMU-VALIDATION.json。

真实模型请求、ARM64 真机和可见原生软键盘仍未验收。本轮没有改动运行时资源或启动流程。
`);for(const file of ['MUMU-VALIDATION.json','MUMU-VALIDATION-android.4.json'])fs.copyFileSync('outputs/'+file,root+'/'+file);for(const file of ['mumu-home-v5.png','mumu-native-final-v5.png','mumu-startup-v5.png'])fs.copyFileSync('outputs/'+file,root+'/docs/previews/'+file);for(const abi of ['arm64','x64'])fs.copyFileSync(root+'/DeepSeekHarness-Android-'+abi+'.apk','outputs/DeepSeekHarness-Android-'+abi+'.apk');fs.copyFileSync(root+'/APK-VERIFICATION-arm64.json',root+'/APK-VERIFICATION.json');console.log('Updated version 5 deliverables');
