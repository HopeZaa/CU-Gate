# ผลการปรับปรุง CU Gate Navigator — รุ่น 1.3

1 พฤศจิกายน 2569 · Asia/Bangkok

## ผลลัพธ์

ใช้ตารางเก่าเป็นฐานคำนวณเปิด–ปิดตามที่ผู้ใช้สั่งแล้ว ปุ่มเปิดตอนนี้ ตัวเลข สีหมุด รายการ และรายละเอียดประตูใช้ตัวคำนวณเดียวกัน สถานะหลักฐาน Unconfirmed ไม่ปิดกั้นประตูที่มีตารางอ้างอิงอีกต่อไป

แผงซ้ายบนคอมย่อหัวเรื่องและตัวควบคุม จุดเริ่มต้น/GPS และตัวเลือกอยู่ใน popover จึงไม่ดันรายการลงล่าง การ์ดรายการสั้นลงพร้อมปุ่มนำทางตรง แผงเลื่อนสูงประมาณ 394 พิกเซลที่ 1366×768 เห็น 4 รายการเต็มและส่วนหนึ่งของรายการถัดไป แผนที่ยังเป็นพื้นที่หลัก

## ข้อมูล

22 กลุ่มประตู · 18 แหล่งข้อมูล · 47 ตารางอ้างอิงที่จัดโครงสร้างแล้ว · 19 กลุ่มที่มีอย่างน้อยหนึ่งตาราง

สถานะหลักฐาน: {"VERIFIED": 0, "HISTORICAL": 22, "UNVERIFIED": 0, "UNKNOWN": 0}

ความเชื่อมั่นพิกัด: {"HIGH": 8, "MEDIUM": 3, "LOW": 0, "UNKNOWN": 11}

พิกัด 8 จุดตรวจสอบกับแผนที่ อีก 3 จุดประมาณ และ 11 กลุ่มยังไม่มีพิกัด ไม่สร้างพิกัดหรือเวลาใหม่ให้ดูครบ

ตารางที่ใช้เรียงตามวันที่เผยแพร่ เฉพาะวิธีเดินทาง/วันที่แหล่งครอบคลุม ประกาศรวมคนเดินเดือนธันวาคม 2564 ใช้เป็นฐานของกลุ่มประตูหลักตาม JSON แยกรถ/คนเดินของเภสัชศาสตร์ แยกเข้า/ออกและเงื่อนไขธรรมสถานกับสนามกีฬา พิกัดประมาณไม่ขวางการอ่านเวลา ประตูไม่มีพิกัดยังดูเวลาในรายการได้และปิดนำทาง

**การนำตารางเก่ามาใช้เป็นการตั้งค่าฐานใช้งาน ไม่ได้เปลี่ยนสถานะหลักฐานเป็นการยืนยันใหม่** Dashboard ทั้งสิบหัวข้อยังคำนวณจาก JSON จริง และแสดงว่าข้อมูลเก่าถูกนำมาใช้ตามการตั้งค่า

รายละเอียดครบใน [OPERATING_SCHEDULES.md](OPERATING_SCHEDULES.md), [GATE_DATA_SOURCES.md](GATE_DATA_SOURCES.md), [GATE_COORDINATE_REPORT.md](GATE_COORDINATE_REPORT.md), [DATA_VERIFICATION_REPORT.md](DATA_VERIFICATION_REPORT.md)

## ผลทดสอบ

| คำสั่ง | ผล |
|---|---|
| `npm run typecheck` | ผ่าน |
| `npm run lint` | ผ่าน |
| `npm test` | ผ่าน 109 tests / 6 files |
| `npm run validate:data` | ผ่าน 17 tests ซึ่งรวมอยู่ใน 109 tests |
| `npm run build` | ผ่าน |
| `npm run verify:build` | ผ่าน base `./`, ไม่มี localhost หรือ development harness ใน build |
| `VITE_BASE_PATH=/cu-gate-navigator/ npm run build` | ผ่าน |
| `VITE_BASE_PATH=/cu-gate-navigator/ npm run verify:build` | ผ่าน path สำหรับ GitHub Pages |

16 tests ของตารางที่นำมาใช้ครอบคลุมการเลือกแหล่งใหม่กว่า วันธรรมดา/สุดสัปดาห์ ขอบเวลาปิด 24 ชั่วโมง ทางออกเท่านั้น เงื่อนไขธรรมสถานกับสนามกีฬา ตารางข้ามเที่ยงคืน พิกัดประมาณ ตารางบางวัน การแยกประเภทรถ แหล่งข้อมูลและสถิติที่ไม่ถูกเปลี่ยนเป็น VERIFIED

ตรวจ browser ที่ 1366×768, 1440×940 และ 390×844 ทั้ง dev และ production:

- ใช้ JSON จริงกับนาฬิกาทดสอบวันจันทร์ 12:00 ได้คนเดินเปิด 17 รายการและหมุดเขียว 11 จุด วันอาทิตย์เปลี่ยนเวลาปิดเป็น 18:00 เมื่อถึงขอบเวลาหมุดเปลี่ยนเป็นปิด
- ณเวลาจริงระหว่างทดสอบ รถมีประตูเปิดตามตารางที่แสดงเป็นหมุดได้ รวมถึงบัญชี/ธรรมสถาน 24 ชั่วโมง กรองเปิดตอนนี้ได้ทันที
- รายละเอียดแสดงเวลาและปีอ้างอิง ไม่ต้องอ่านประกาศยาว มีตารางจันทร์–อาทิตย์ให้เปิดดู
- รายการซ้ายเลื่อนถึงประตูท้ายได้ แผงควบคุมคงที่ ไม่มี horizontal overflow
- GPS/MRT ยังอยู่ในแผงจุดเริ่มต้น ลิงก์นำทางและตัวกรองวิธีเดินทางยังทำงาน
- Dashboard และ source disclosure ยังตรวจสอบแต่ละประตูได้

นาฬิกาควบคุมใน `tests/reference-harness.html` ใช้ข้อมูลประตูจริงโดยไม่แก้ค่าใด ๆ มีป้ายบอกเวลาทดสอบชัดเจน และไม่รวมใน production ภาพ/ผลตรวจอยู่ใน `verification/v4/` ไม่ได้ทดสอบ sensor GPS หรือสำรวจหน้างานในรอบนี้

## ไฟล์หลัก

`src/data/gates.json`, `src/lib/data.ts`, `i18n.ts`, `operating.ts`, `operating.test.ts`, `availability.ts`, `availability.test.ts`, `gates.ts`, `planning.ts`, `src/App.tsx`, `GateDetails.tsx`, `QualityDashboard.tsx`, `CampusMap.tsx`, `src/styles.css`, `tests/reference-harness.html`, `scripts/verify-build.mjs`, package/lockfile, README และรายงาน ไม่มี dependency/backend/API key เพิ่ม

## เปิดใช้บน macOS

```sh
cd "/Users/hopezaa/Documents/Codex/2026-11-01/cu-gate-navigator-initial-gate-research/outputs/cu-gate-navigator"
npm ci
npm run dev
```

ถ้าติดตั้ง dependencies แล้ว ใช้ `npm run dev` ได้ทันที Production preview ใช้ `npm run build` แล้ว `npm run preview`

## ข้อจำกัดและการเผยแพร่

ตารางใช้วันในสัปดาห์ปกติ ไม่มีปฏิทินวันหยุดพิเศษ/วันแข่งม้า/สถานะสด และบางแหล่งครอบคลุมเพียงบางวันหรือบางวิธีเดินทาง ยังไม่มีตารางปกติของ ประตูจามจุรี 9 ฝั่งตลาด, ประตูสำรองวิศวกรรมสถาน, ประตูทางเดินนิติศาสตร์ การแก้ไขครั้งต่อไปทำใน gate JSON โดยไม่ต้องเปลี่ยน UI

เตรียม workflow GitHub Pages แล้ว ไม่มีการ push แก้ settings หรือ deploy ภายนอกตามคำสั่งผู้ใช้ วางโปรเจกต์ที่ root ของ repository รวม dotfiles ตั้ง Settings → Pages → GitHub Actions แล้วเผยแพร่เมื่อเลือก repository และอนุญาต URL จะเป็น `https://OWNER.github.io/REPOSITORY/`
