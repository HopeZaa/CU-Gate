# ผลการปรับปรุง CU Gate Navigator — รุ่น 1.5

แก้หมุดทับกล่องสถานะและแถบด้านล่าง ทำปุ่ม GPS ให้เห็นชัด และเพิ่มชุดไอคอนสำหรับ Add to Home Screen ใช้ข้อมูลประตูและ geometry เดิมจากรุ่น 1.4 ทุกไบต์ ตรวจ hash แล้ว ไม่มีการแก้เวลา สิทธิ์ หรือพิกัดในงานรอบนี้

## สิ่งที่แก้

- แยก MapLibre canvas/markers เป็น stacking context ของตัวเอง แถบสถานะ คำอธิบายสี และปุ่มอยู่ชั้นบน หมุดที่เลือกก็ไม่ข้ามชั้นมาทับ UI native map controls อยู่เหนือ markers ภายใน canvas
- ลดกรอบปุ่มแผนที่บนมือถือให้พอดีกับสองปุ่ม สูง 80 px ไม่ยืดเป็นแถบขาวยาว
- กล่องสถานะและ legend รับ pointer event ของตนเอง กดบนกล่องแล้วไม่ทะลุไปเปิดรายละเอียดหมุดที่ซ่อนอยู่ด้านหลัง
- ปุ่ม “ใกล้ฉัน · GPS” สีฟ้า สูง 44 px อยู่ในหน้าหลัก ไม่ต้องเปิดเมนู เริ่ม/หยุดตำแหน่งจากปุ่มเดียว มีสีแยกสถานะทำงาน และมีสีสำหรับโหมดมืด
- ย้ายข้อความสถานะ ความแม่นยำ และข้อผิดพลาด GPS ออกนอกเมนูที่พับไว้ จุดเริ่มต้น MRT ยังคงเลือกได้ ไม่มีการเปิด GPS อัตโนมัติ
- เพิ่ม apple-touch-icon PNG 180×180 และ manifest ที่ระบุ PNG 192×192, 512×512 และ maskable 512×512 ใช้รูปประตูเดิมบนพื้นทึบ ไม่มีช่องโปร่งใส
- เพิ่มชื่อแอปและ standalone metadata สำหรับ Home Screen, viewport-fit และระยะ safe area ใน standalone ใช้ relative scope/start URL/id เพื่อรองรับ root และโฟลเดอร์ GitHub Pages สี browser chrome เปลี่ยนตามธีม

## ผลตรวจ

TypeScript, ESLint และ 119 tests ใน 7 ไฟล์ผ่าน Production build ผ่านทั้ง base `./` และ `/cu-gate-navigator/` ตรวจ PNG signature/ขนาดทุกไฟล์, manifest scope/id/start URL และไฟล์ไอคอน Apple แล้ว dist มีไฟล์ static 18 ไฟล์ ไม่มี QA fixture หรือ localhost dependency

Browser regression บนคอม: เลื่อนหมุด health-3 เข้าใต้กล่องบน และ phayathai-3 เข้าใต้ legend ล่าง พบว่า overlay อยู่ด้านบนทั้งสองจุด กดตำแหน่งทับซ้อนทั้งสองแล้วไม่เปิดรายละเอียดด้านหลัง

ตรวจมือถือ 390×844 ทั้งสว่าง/มืด และจอเล็ก 320×740 ปุ่ม GPS สูง 44 px ไม่พบ horizontal overflow ทดสอบ native zoom/fit controls ยังคงรับการกดได้

GPS integration ใช้ harness ที่ระบุชัดว่าเป็นข้อมูลทดสอบ ไม่ใช่ตำแหน่งจากอุปกรณ์: เปิดได้หนึ่ง watch, หยุดแล้ว cleared หนึ่งครั้ง และเมื่อจำลอง denied ข้อความแจ้งปัญหายังมองเห็นขณะเมนูจุดเริ่มต้นปิดอยู่

ไอคอน Apple ตอบ HTTP 200 image/png, manifest ตอบ HTTP 200 application/manifest+json และเนื้อหาเหมือนไฟล์ในโปรเจกต์ ตรวจลิงก์ metadata จากหน้า production แล้ว การกดติดตั้งบน Home Screen ของ iPhone/Android จริงยังไม่ได้ทดสอบในสภาพแวดล้อมนี้ ไม่มี service worker และไม่ได้เพิ่มความสามารถออฟไลน์

หลักฐานทั้งหมดของรุ่นนี้อยู่ใน verification/v6: browser-checks.json, asset-and-data-checks.json, ภาพทดสอบ และ log build/tests ไอคอนที่เพิ่มไว้ก่อนหน้าอาจยังแสดงภาพที่เครื่องเก็บไว้ หากพบกรณีนี้ให้ลองเพิ่มชอร์ตคัตใหม่หลังอัปเดตเว็บ

แหล่งอ้างอิงทางเทคนิคเรื่อง Home Screen icons/standalone อยู่ใน README.md ส่ง source, dist และ workflow GitHub Pages พร้อมไฟล์ ZIP ไม่ได้ push หรือแก้ไข repository ภายนอก
