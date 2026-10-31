# 已安装包复原报告 — 0.2.1-android.5

来源唯一：模拟器上**已安装**的 `com.deepseek.harness.android`（未卸载、未覆盖、未清数据）。
先 `adb pull` 导出 `base.apk`（245 835 413 B，SHA256 `956585ec292fe472cbe5196a24c037c3f260bafd6c6aab5650b830e0d18bda3d`，与设备端 `sha256sum` 输出一致），再拆解还原。

## 一、应用层代码

| 产物 | 还原方式 | 结果 |
| --- | --- | --- |
| `app/src/main/java/.../MainActivity.java` | `classes.dex` → jadx 1.5.1 | 38.3 KB |
| `app/src/main/java/.../RuntimeInstaller.java` | 同上 | 14.0 KB |
| `app/src/main/java/.../RuntimeService.java` | 同上 | 14.2 KB |
| `AndroidManifest.xml` | `aapt2 dump xmltree` → 机械转 XML | versionCode 5、`0.2.1-android.5`、minSdk 28、targetSdk 28、compileSdk 35 |
| `res/drawable/ic_harness.xml`、`ic_whale.xml` | 二进制 AXML → 明文 | 鲸鱼填充色 `#ff4d6bfe` 原样 |
| `res/drawable/launcher.png` | 直接取出 | 128 799 B |
| `assets/` 11 个 | 直接取出 | 逐字节原样 |
| `jniLibs/x86_64/` 4 个 so | 直接取出 | 逐字节原样 |
| `artifacts/` | 直接取出 | `classes.dex`、二进制清单、`resources.arsc`、`META-INF` |

dex 共 1016 个类，其中本工程 3 个类 + 30 个内部类。

## 二、运行时（Harness 本体）

`assets/harness-x64.tar.gz`（148.2 MB）解开后：

- **62 961 个文件**，`runtime/`
- `@deepseek-ai/*` 共 **306 个包**，其中 **295 个版本 `0.2.1-rc.2`**，核心 `@deepseek-ai/dsh` 为 `0.2.1-rc.2`
- 前端 `dsh-web-frontend/dist` 完整（`index.html` + `assets/`）
- 12 354 个 `.js`、4 365 个 `.map`

`assets/node-x64.tar.gz`（54.4 MB）与 `rootfs-x64.tar.gz`（28.6 MB）为二进制运行时，原样保留，未展开。

## 三、source map 反向展开

4 365 个 map 中 **1 404 个内嵌 `sourcesContent`**，共写入 **3 363 个原始源文件（18.9 MB）**；同名输出合并后实际落盘 **1 981 个文件** → `runtime-sources/`。
另 2 961 个 map 不含内嵌源，无法还原，已在 `runtime-sources/_expand-report.json` 列明。
`@deepseek-ai/*` 的包本身不带内嵌源，因此 DSH 自身只能拿到它发布的编译产物 JS（那即是它的代码形态），不能凭空造出 TS 源。

## 四、重建验证

用复原出来的源码与资源重新构建了一份 APK：

```
aapt2 compile/link → javac(exit=0, 30 个 class) → d8 → 合并 dex/so → zipalign → apksigner(v3)
```

产物：`DeepSeekHarness-Android-0.2.1-android.5-rebuilt.apk`（签名验证通过）。

与原件逐条目比对（`REBUILD-COMPARE.json`）：

| 分类 | 条目数 | 逐字节一致 |
| --- | --- | --- |
| `assets/` | 11 | **11** |
| `lib/` | 4 | **4** |
| `res/` | 3 | 1（两个 vector 的二进制 AXML 大小相同 828/3944，仅字符串池顺序不同） |
| `classes.dex` | 1 | 2515348 → 2514172 B，d8 版本差异，语义等价 |
| `AndroidManifest.xml` | 1 | 3504 → 3504 B，构建副本把 `@0x01030241` 换成 `@android:style/Theme.Material.Light.NoActionBar` |
| 签名 | — | 不同（见下） |

构建时对清单做了三处**符号化替换**（原件保留在 `app/src/main/AndroidManifest.xml` 与 `tools/axml/`）：

- `android:theme="@0x01030241"` → `@android:style/Theme.Material.Light.NoActionBar`
- `android:configChanges="0x000004a0"`（= keyboardHidden|orientation|screenSize）→ 符号形式
- `android:windowSoftInputMode="0x00000010"`（= adjustResize）→ 符号形式

反编译产物有一处必须补的缺陷：`MainActivity.lambda$onCreate$1` 对 `final` 形参 `str4` 赋值，Java 不允许，等价改为局部变量 `mime`。

## 五、不可复原

- **签名私钥**：APK 只含公钥证书（`META-INF/ANDROIDD.RSA`），私钥不在包内。重建包因此使用新生成的 `rebuild.keystore`，无法与原件同签。
- **`.so` 的 C 源码**：`libproot.so`、`libloader.so`、`libtalloc.so`、`libandroid-shmem.so` 是二进制。PRoot 有公开源码（GPLv2），但那不是从本 APK 还原的。
- **打包脚本**：`build.ps1`、`package-apk.cjs`、`prepare-assets.cjs` 不随 APK 分发，APK 内不存在这些文件。
- **本版本没有终端**：dex 内 `com.termux.*` 为 0 个，清单里也无终端 Activity。

## 六、目录

```
installed-0.2.1-android.5/
├── app/src/main/{java,assets,res,jniLibs,AndroidManifest.xml}
├── runtime/            Harness 运行时 62 961 个文件（62961）
├── runtime-sources/    source map 展开出的 3 363 个原始源文件
├── artifacts/          dex / 二进制清单 / arsc / META-INF
├── tools/axml/         aapt2 xmltree 原始输出（还原依据）
├── tools/deps/         编译用 commons jar
├── build/              重建中间产物与 rebuild.keystore
├── REBUILD-COMPARE.json
└── DeepSeekHarness-Android-0.2.1-android.5-rebuilt.apk
```
