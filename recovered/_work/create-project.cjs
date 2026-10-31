const fs = require('node:fs'); const path = require('node:path');
const p='outputs/DeepSeekHarness-Android-source';
const files={
'settings.gradle':`pluginManagement { repositories { google(); mavenCentral(); gradlePluginPortal() } }
dependencyResolutionManagement { repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS); repositories { google(); mavenCentral() } }
rootProject.name = 'DeepSeekHarnessAndroid'
include ':app'
`,
'build.gradle':`plugins { id 'com.android.application' version '8.13.0' apply false }\n`,
'gradle.properties':`org.gradle.jvmargs=-Xmx3072m -Dfile.encoding=UTF-8\nandroid.useAndroidX=false\n`,
'app/build.gradle':`plugins { id 'com.android.application' }
android {
 namespace 'com.deepseek.harness.android'
 compileSdk 35
 defaultConfig { applicationId 'com.deepseek.harness.android'; minSdk 28; targetSdk 28; versionCode 1; versionName '0.2.1-android.1' }
 buildTypes { release { minifyEnabled false } }
 compileOptions { sourceCompatibility JavaVersion.VERSION_17; targetCompatibility JavaVersion.VERSION_17 }
 packaging { jniLibs { useLegacyPackaging = true } }
 androidResources { noCompress += ['gz', 'xz'] }
}
dependencies { implementation 'org.apache.commons:commons-compress:1.27.1' }
`,
'app/src/main/AndroidManifest.xml':`<manifest xmlns:android="http://schemas.android.com/apk/res/android">
 <uses-permission android:name="android.permission.INTERNET"/>
 <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE"/>
 <uses-permission android:name="android.permission.FOREGROUND_SERVICE"/>
 <uses-permission android:name="android.permission.WAKE_LOCK"/>
 <uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
 <uses-permission android:name="android.permission.RECORD_AUDIO"/>
 <application android:label="DeepSeek Harness" android:theme="@android:style/Theme.Material.Light.NoActionBar" android:allowBackup="false" android:usesCleartextTraffic="true" android:extractNativeLibs="true" android:icon="@drawable/ic_harness">
  <activity android:name=".MainActivity" android:exported="true" android:configChanges="orientation|screenSize|keyboardHidden" android:windowSoftInputMode="adjustResize">
   <intent-filter><action android:name="android.intent.action.MAIN"/><category android:name="android.intent.category.LAUNCHER"/></intent-filter>
  </activity>
  <service android:name=".RuntimeService" android:exported="false" android:stopWithTask="false"/>
  <provider android:name=".ExportProvider" android:authorities="com.deepseek.harness.android.exports" android:exported="false" android:grantUriPermissions="true"/>
 </application>
</manifest>
`,
'app/src/main/res/drawable/ic_harness.xml':`<vector xmlns:android="http://schemas.android.com/apk/res/android" android:width="108dp" android:height="108dp" android:viewportWidth="108" android:viewportHeight="108">
 <path android:fillColor="#4D6BFE" android:pathData="M20,12 L88,12 Q96,12 96,20 L96,88 Q96,96 88,96 L20,96 Q12,96 12,88 L12,20 Q12,12 20,12"/>
 <path android:fillColor="#FFFFFF" android:pathData="M28,33 L38,33 L38,49 L70,49 L70,33 L80,33 L80,75 L70,75 L70,59 L38,59 L38,75 L28,75 Z"/>
</vector>
`
};
for(const [n,s] of Object.entries(files)){const f=path.join(p,n);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,s)}
console.log('Created '+Object.keys(files).length+' project files');
