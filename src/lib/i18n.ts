import { createContext, useContext } from "react";
import type { Gate, VerificationStatus } from "./data";
import type { GPSState } from "./geolocation";
import { gpsMessages } from "./geolocation";
export type Language = "th" | "en";
export const LanguageContext = createContext<Language>("th");
export function useCopy() {
  const lang = useContext(LanguageContext);
  return { lang, t: (th: string, en: string) => (lang === "th" ? th : en) };
}
export function gateName(g: Gate, lang: Language) {
  return lang === "th" ? g.shortNameTh : g.nameEn || g.name;
}
export function gateNearby(g: Gate, lang: Language) {
  return lang === "th" ? g.nearbyTh : g.nearby;
}
export function dateLabel(value: string | null, lang: Language): string {
  if (!value) return lang === "th" ? "ไม่ระบุวันที่" : "Date not stated";
  if (/^\d{4}$/.test(value))
    return String(Number(value) + (lang === "th" ? 543 : 0));
  const full = /^\d{4}-\d{2}-\d{2}$/.test(value);
  return new Intl.DateTimeFormat(lang === "th" ? "th-TH" : "en-GB", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "short",
    ...(full ? { day: "numeric" as const } : {}),
  }).format(new Date(`${value}${full ? "" : "-01"}T00:00:00+07:00`));
}
export function statusLabel(status: VerificationStatus, lang: Language) {
  return lang === "en"
    ? {
        VERIFIED: "Verified",
        HISTORICAL: "Historical",
        UNVERIFIED: "Unverified",
        UNKNOWN: "No evidence",
      }[status]
    : {
        VERIFIED: "ยืนยันข้อมูลล่าสุด",
        HISTORICAL: "ข้อมูลจากอดีต",
        UNVERIFIED: "ยังไม่ยืนยัน",
        UNKNOWN: "ยังไม่มีหลักฐาน",
      }[status];
}
export function coordinateLabel(g: Gate, lang: Language) {
  return g.latitude === null
    ? lang === "th"
      ? "ยังไม่มีจุดนำทาง"
      : "Location unresolved"
    : g.coordinateVerificationStatus === "VERIFIED"
      ? lang === "th"
        ? "พิกัดจากแผนที่ทางการ"
        : "Map-verified point"
      : lang === "th"
        ? "พิกัดโดยประมาณ"
        : "Approximate point";
}
export function metricCopy(
  key: string,
  lang: Language,
): { label: string; description: string } {
  const dict: Record<string, [string, string]> = {
    total: [
      "ประตูที่ค้นพบ",
      "นับกลุ่มประตูตามชื่อ โดยรวมช่องทางเข้าและออกที่อยู่ติดกัน ยังไม่ใช่การสำรวจครบทุกช่องทาง",
    ],
    VERIFIED: [
      "ข้อมูลประตูที่ยืนยันล่าสุด",
      "มีหลักฐานปัจจุบันเพียงพอสำหรับข้อมูลการเข้าออก พิกัดที่ชัดเจนอย่างเดียวไม่ทำให้สิทธิ์เข้าออกได้รับการยืนยัน",
    ],
    HISTORICAL: [
      "ข้อมูลจากประกาศเก่า",
      "มีแหล่งอ้างอิงทางการในอดีต แต่ยังไม่ยืนยันว่าเงื่อนไขยังใช้ในวันนี้",
    ],
    UNVERIFIED: [
      "ข้อมูลที่ยังไม่ยืนยัน",
      "มีการกล่าวถึงประตู แต่ยังตรวจสอบอิสระไม่ได้",
    ],
    UNKNOWN: [
      "ประตูที่ยังไม่มีหลักฐาน",
      "ยังไม่มีหลักฐานที่น่าเชื่อถือสำหรับข้อมูลประตู",
    ],
    gpsVerified: [
      "พิกัดที่ตรวจสอบกับแผนที่แล้ว",
      "เป็นจุดประตูจริงที่จับคู่กับแผนที่ทางการได้ ความเชื่อมั่น HIGH ไม่ได้หมายถึงการสำรวจ GPS หรือสิทธิ์เข้าออก",
    ],
    gpsApproximate: [
      "พิกัดโดยประมาณ",
      "มีพิกัดสำหรับค้นหาพื้นที่ แต่การจับคู่ชื่อหรือจุดประตูยังต้องตรวจสอบ",
    ],
    gpsUnknown: [
      "ประตูที่ยังไม่มีพิกัด",
      "ไม่แสดงหมุดและไม่เปิดปุ่มนำทาง เพื่อหลีกเลี่ยงการพาไปผิดจุด",
    ],
    vehiclesUnknown: [
      "สิทธิ์รถที่ยังไม่ยืนยันล่าสุด",
      "ยังไม่มีข้อมูลปัจจุบันครบสำหรับรถยนต์หรือมอเตอร์ไซค์ ประกาศเก่าเก็บแยกไว้เป็นข้อมูลอ้างอิง",
    ],
    schedulesUnknown: [
      "ตารางที่ยังไม่ได้ตรวจยืนยันใหม่",
      "นับการตรวจยืนยันใหม่แยกจากตารางอ้างอิงเดิมที่แอปนำมาใช้ รวมถึงข้อยกเว้นวันหยุด",
    ],
  };
  const en: Record<string, [string, string]> = {
    total: [
      "Discovered gate groups",
      "Named entrance groups, counting adjacent entry/exit lanes once. Coverage is incomplete.",
    ],
    VERIFIED: [
      "Currently verified information",
      "Current evidence for gate access. Coordinate verification alone does not confirm access.",
    ],
    HISTORICAL: [
      "Historical information",
      "Official older evidence whose current applicability is unconfirmed.",
    ],
    UNVERIFIED: [
      "Unverified information",
      "A reported entrance not independently confirmed.",
    ],
    UNKNOWN: [
      "No supporting information",
      "No reliable supporting evidence for the entrance.",
    ],
    gpsVerified: [
      "Map-verified coordinates",
      "Physical gate point matched with the official map; not a field GPS survey or access confirmation.",
    ],
    gpsApproximate: [
      "Approximate coordinates",
      "Usable point with an unconfirmed gate identity or approximate position.",
    ],
    gpsUnknown: [
      "Unknown coordinates",
      "No marker or directions link until a reliable gate point is established.",
    ],
    vehiclesUnknown: [
      "Vehicle rules not currently verified",
      "Current car or motorcycle rules remain unresolved. Dated references are kept separately.",
    ],
    schedulesUnknown: [
      "Schedules without new verification",
      "Counts new verification separately from adopted reference schedules, including holiday exceptions.",
    ],
  };
  const copy = lang === "th" ? dict : en;
  return { label: copy[key]?.[0] || key, description: copy[key]?.[1] || "" };
}
const gpsTh: Record<GPSState, string> = {
  idle: "ตำแหน่งของคุณจะใช้ในอุปกรณ์นี้เท่านั้น",
  requesting: "กรุณาอนุญาตการใช้ตำแหน่งในเบราว์เซอร์…",
  active: "กำลังใช้ตำแหน่งปัจจุบันของคุณ",
  denied:
    "ยังไม่ได้รับอนุญาตใช้ตำแหน่ง เปิดสิทธิ์ในเบราว์เซอร์แล้วลองใหม่ หรือเลือกจุดเริ่มต้นแทน",
  unavailable:
    "หาตำแหน่งไม่ได้ ลองเปิดบริการตำแหน่ง หรือเลือกเริ่มจาก MRT สามย่าน",
  timeout: "หาตำแหน่งนานเกินไป ลองอีกครั้งหรือเลือกจุดเริ่มต้นแทน",
  unsupported: "เบราว์เซอร์นี้ไม่รองรับ GPS กรุณาเลือกจุดเริ่มต้นแทน",
  insecure: "GPS ต้องเปิดผ่าน HTTPS หรือ localhost",
  paused: "หยุดใช้ตำแหน่งแล้ว กดใกล้ฉันเพื่อเริ่มใหม่",
};
export function gpsText(state: GPSState, lang: Language) {
  return lang === "th" ? gpsTh[state] : gpsMessages[state];
}
export function distanceLabel(m: number | null, lang: Language) {
  if (m === null)
    return lang === "th"
      ? "เลือกจุดเริ่มเพื่อดูระยะ"
      : "Choose a start to see distance";
  return lang === "th"
    ? m < 1000
      ? `${Math.round(m)} ม.`
      : `${(m / 1000).toFixed(2)} กม.`
    : m < 1000
      ? `${Math.round(m)} m`
      : `${(m / 1000).toFixed(2)} km`;
}
