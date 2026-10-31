# DeepSeek Harness for Android

DeepSeek Harness ตัวเต็มที่รันบนมือถือโดยตรง ไม่ต้องใช้คอมพิวเตอร์ ไม่ต้องมีเซิร์ฟเวอร์ ไม่ต้องเชื่อมต่อภายนอก

**[中文](../..) · [English](./README.en.md) · [日本語](./README.ja.md) · [한국어](./README.ko.md) · ไทย · [Português](./README.pt.md) · [Español](./README.es.md) · [Français](./README.fr.md)**

---

[![Release](https://img.shields.io/github/v/release/Chanray-May9/deepseek-harness-for-android?style=flat-square&label=release)](https://github.com/Chanray-May9/deepseek-harness-for-android/releases)
[![Stars](https://img.shields.io/github/stars/Chanray-May9/deepseek-harness-for-android?style=flat-square&label=stars)](https://github.com/Chanray-May9/deepseek-harness-for-android/stargazers)
[![Platform](https://img.shields.io/badge/platform-Android%208.0%2B-3DDC84?style=flat-square&logo=android&logoColor=white)](#requirements)
[![ABI](https://img.shields.io/badge/ABI-arm64--v8a%20%7C%20x86__64-4B8BBE?style=flat-square)](#requirements)

## คืออะไร

DeepSeek Harness คือสภาพแวดล้อมการทำงานที่รวมการสนทนากับโมเดล การจัดการไฟล์ การรันคำสั่ง และการจัดงานไว้ในบทสนทนาเดียว เดิมทีถูกออกแบบมาสำหรับเทอร์มินัลบนเดสก์ท็อป
โปรเจกต์นี้ย้ายสภาพแวดล้อมการทำงานทั้งหมดเข้ามาอยู่ในแอปแอนดรอยด์ APK มีทั้งระบบผู้ใช้ Ubuntu แบบย่อ รันไทม์ Node และตัว Harness เอง ทั้งหมดถูกคลายออกไปยังไดเรกทอรีส่วนตัวของแอปและเริ่มทำงานจากที่นั่น แยกจากส่วนอื่นของระบบ
หน้าจอเป็นชุดเดียวกับที่คุ้นเคย มีเพียงเลย์เอาต์และวิธีควบคุมที่ทำใหม่ให้เหมาะกับการสัมผัส ช่องพิมพ์อยู่ด้านล่างในระยะนิ้วโป้ง และป๊อปอัปจะไม่บังปุ่มที่กำลังจะกด

## การติดตั้ง

1. ดาวน์โหลด `.apk` เวอร์ชันล่าสุดจาก [Releases](https://github.com/Chanray-May9/deepseek-harness-for-android/releases)
2. อนุญาตให้ติดตั้งจากแหล่งที่ไม่รู้จักในเครื่อง
3. ติดตั้งแล้วแตะไอคอน

การเปิดครั้งแรกจะคลายไฟล์หลายร้อยเมกะไบต์ลงในไดเรกทอรีของแอป ใช้เวลาหนึ่งถึงสามนาทีขึ้นอยู่กับเครื่อง หน้าจอจะแสดงความคืบหน้า ทำเพียงครั้งเดียว ครั้งต่อไปเข้าสู่หน้าจอได้ภายในไม่กี่วินาที

## ข้อกำหนด

| รายการ | ข้อกำหนด |
| --- | --- |
| Android | 8.0 (API 26) ขึ้นไป |
| CPU | `arm64-v8a` หรือ `x86_64` |
| พื้นที่ว่าง | แนะนำ 2 GB ขึ้นไป |
| หน่วยความจำ | แนะนำ 4 GB ขึ้นไป |

ไฟล์ APK มีขนาดประมาณ 580 MB และรองรับทั้งสองสถาปัตยกรรมในไฟล์เดียว

## ทำไมจึงรันบนมือถือได้

โดยปกติแอนดรอยด์ไม่อนุญาตให้รันโปรแกรมจากไดเรกทอรีของแอป และไม่มีสภาพแวดล้อมลินุกซ์ให้ใช้ โปรเจกต์นี้เลี่ยงด้วยสามอย่าง

- **targetSdk 28** — ช่วงเวอร์ชันสุดท้ายที่ยังอนุญาตให้ `exec` จากไดเรกทอรีส่วนตัวของแอป
- **PRoot** — `chroot` ในพื้นที่ผู้ใช้ที่ไม่ต้องมี root และทำให้ไดเรกทอรีใดๆ ทำงานเหมือน `/`
- **รันไทม์ที่บรรจุมาด้วย** — รูท Ubuntu 24.04 แบบย่อ, Node 24 เวอร์ชัน glibc และโค้ด Harness ทั้งหมดอยู่ใน APK

ทุกอย่างทำงานในแซนด์บ็อกซ์ของแอป ไม่แตะพาร์ทิชันระบบ ไม่ต้องมี root และเมื่อถอนการติดตั้งก็หายทั้งหมด

## สร้างจากซอร์ส

```powershell
tools/rebuild-apk.ps1 `
  -SdkRoot  <android sdk> `
  -JavaHome <jdk 21> `
  -ProjectRoot restored/installed-0.2.1-android.5 `
  -Abi both
```

หากแก้เฉพาะหน้าจอ สามารถส่งไปยังเครื่องที่เชื่อมต่อได้ทันที

```powershell
tools/sync-shell.cjs
```

หลังจากส่งแล้วต้องปิดแอปแล้วเปิดใหม่ การรีเฟรชหน้าไม่ทำให้สคริปต์ทำงานใหม่

ไฟล์archive ของรันไทม์ (`*.tar.gz`) ไม่ได้อยู่ในรีโปเพราะมีขนาดใหญ่ ให้สร้างด้วยสคริปต์ `tools/build-*.cjs`

## สถานะ

เวอร์ชันปัจจุบันคือ **0.2.1-android.5** เป็นเวอร์ชันใช้งานได้ในช่วงต้น รายละเอียดหน้าจอและการตอบสนองยังอยู่ระหว่างการปรับปรุง จึงมีการอัปเดตบ่อย

---

**[中文](../..) · [English](./README.en.md) · [日本語](./README.ja.md) · [한국어](./README.ko.md) · ไทย · [Português](./README.pt.md) · [Español](./README.es.md) · [Français](./README.fr.md)**
