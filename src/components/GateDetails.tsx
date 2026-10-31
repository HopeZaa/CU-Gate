import { useEffect, useRef } from "react";
import {
  ArrowUpRight,
  Clock3,
  ExternalLink,
  MapPin,
  Navigation,
  Phone,
  X,
} from "lucide-react";
import type { Dataset, Gate, TravelMode } from "../lib/data";
import {
  directionsUrl,
  hasCoordinates,
  haversine,
  permission,
  directionPermission,
} from "../lib/gates";
import type { Position } from "../lib/gates";
import type { PublicOrigin } from "../lib/origins";
import {
  useCopy,
  gateName,
  gateNearby,
  coordinateLabel,
  dateLabel,
  statusLabel,
  distanceLabel,
} from "../lib/i18n";
import { matchingReferences, referenceYear } from "../lib/planning";
import { gateAvailability, weeklyHours } from "../lib/availability";

export default function GateDetails({
  gate: g,
  dataset,
  position,
  originName,
  navigationOrigin,
  mode,
  direction,
  now,
  onClose,
  onMap,
}: {
  gate: Gate;
  dataset: Dataset;
  position: Position | null;
  originName: string | null;
  navigationOrigin: PublicOrigin | null;
  mode: TravelMode | "all";
  direction: "entry" | "exit";
  now: Date;
  onClose: () => void;
  onMap: () => void;
}) {
  const { lang, t } = useCopy();
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    closeRef.current?.focus({ preventScroll: true });
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("keydown", key);
      if (prev?.isConnected) prev.focus({ preventScroll: true });
    };
  }, [g.id, onClose]);
  const status = gateAvailability(g, mode, direction, now, lang);
  const url = directionsUrl(g, mode, navigationOrigin);
  const distance =
    position && hasCoordinates(g) ? haversine(position, g) : null;
  const refs = matchingReferences(g, mode);
  const field = (v: boolean | null) =>
    v === null
      ? t("รอยืนยัน", "Unconfirmed")
      : v
        ? t("อนุญาต", "Allowed")
        : t("ไม่อนุญาต", "Not allowed");
  const modeName =
    mode === "car"
      ? t("รถยนต์", "Car")
      : mode === "motorcycle"
        ? t("มอเตอร์ไซค์", "Motorcycle")
        : t("เดิน", "Walk");
  const modePermission = permission(g, mode === "all" ? "pedestrian" : mode);
  const directionAllowed = directionPermission(g, direction);
  const verifiedAccessLabel =
    modePermission === false || directionAllowed === false
      ? t("ไม่อนุญาต", "Not permitted")
      : modePermission === true && directionAllowed === true
        ? g.accessType === "restricted" || g.specialRestrictions
          ? t("ต้องตรวจสอบสิทธิ์", "Authorization required")
          : t("อนุญาตตามข้อมูล", "Allowed by verified rules")
        : t("สิทธิ์ยังไม่ยืนยัน", "Access unconfirmed");
  const accessLabel =
    status.basis === "reference" ? status.access : verifiedAccessLabel;
  const source = dataset.sources.find((s) => s.id === status.source);
  const week = weeklyHours(g, mode, now, lang);
  return (
    <aside
      className="gate-details compact-details"
      aria-label={t("ข้อมูลประตู", "Gate details")}
      data-gate-id={g.id}
    >
      <div className="pin-card-heading">
        <span className={`pin-letter availability-${status.state}`}>
          {g.mapLetter || <MapPin size={20} />}
        </span>
        <div>
          <h2>{gateName(g, lang)}</h2>
          <p>{gateNearby(g, lang)}</p>
        </div>
        <button
          ref={closeRef}
          className="icon-button"
          aria-label={t("ปิดข้อมูลประตู", "Close gate details")}
          onClick={onClose}
        >
          <X size={21} />
        </button>
      </div>
      <div className="pin-card-scroll">
        <div
          className={`pin-status availability-${status.state}`}
          role="status"
        >
          <span className="status-dot" />
          <strong>{status.label}</strong>
          <span>
            {status.basis === "reference"
              ? t(
                  `ตารางอ้างอิง${source?.publishedAt ? ` ปี ${Number(source.publishedAt.slice(0, 4)) + 543}` : ""}`,
                  `Reference schedule${source?.publishedAt ? ` · ${source.publishedAt.slice(0, 4)}` : ""}`,
                )
              : status.state === "unknown"
                ? t(
                    "ไม่มีตารางสำหรับวิธีเดินทางนี้",
                    "No schedule for this travel mode",
                  )
                : t("ตามข้อมูลที่ยืนยัน", "From verified rules")}
          </span>
        </div>
        <dl className="pin-facts">
          <div>
            <dt>
              <Clock3 size={16} />
              {t("วันนี้", "Today")}
            </dt>
            <dd>{status.today}</dd>
          </div>
          {status.next && (
            <div>
              <dt>{t("รอบถัดไป", "Next change")}</dt>
              <dd>{status.next}</dd>
            </div>
          )}
          <div>
            <dt>
              {modeName} ·{" "}
              {direction === "entry" ? t("เข้า", "Entry") : t("ออก", "Exit")}
            </dt>
            <dd>{accessLabel}</dd>
          </div>
        </dl>
        <details className="weekly-panel">
          <summary>{t("ดูตารางทั้งสัปดาห์", "Weekly opening hours")}</summary>
          <dl>
            {week.map((w) => (
              <div className={w.today ? "today" : ""} key={w.day}>
                <dt>
                  {
                    (lang === "th"
                      ? [
                          "อาทิตย์",
                          "จันทร์",
                          "อังคาร",
                          "พุธ",
                          "พฤหัสบดี",
                          "ศุกร์",
                          "เสาร์",
                        ]
                      : [
                          "Sunday",
                          "Monday",
                          "Tuesday",
                          "Wednesday",
                          "Thursday",
                          "Friday",
                          "Saturday",
                        ])[w.day]
                  }
                  {w.today && ` · ${t("วันนี้", "today")}`}
                </dt>
                <dd>{w.hours}</dd>
              </div>
            ))}
          </dl>
        </details>
        <div className="pin-location">
          <MapPin size={14} />
          <span>
            {coordinateLabel(g, lang)}
            {distance !== null &&
              ` · ${distanceLabel(distance, lang)} ${t("เส้นตรง", "straight line")}`}
          </span>
        </div>
        {distance !== null && originName && (
          <span className="pin-origin">
            {t("จาก", "From")} {originName}
          </span>
        )}
        {url ? (
          <a
            className="primary-button pin-navigate"
            href={url}
            target="_blank"
            rel="noreferrer"
          >
            <Navigation size={18} />
            {t("นำทางไปประตูนี้", "Directions to this gate")}
            <ArrowUpRight size={17} />
          </a>
        ) : (
          <button className="primary-button pin-navigate" disabled>
            {t("ยังไม่มีพิกัดสำหรับนำทาง", "No coordinates for directions")}
          </button>
        )}
        <p className="pin-disclaimer">
          {status.basis === "reference"
            ? t(
                "อิงตารางเดิม · วันหยุดพิเศษอาจเปลี่ยนเวลา",
                "Reference schedule · special holidays may differ",
              )
            : t(
                "คำนวณจากตาราง ไม่ใช่สถานะสด",
                "Calculated from schedules, not live status",
              )}
          {g.coordinateVerificationStatus !== "VERIFIED" && hasCoordinates(g)
            ? t(" · พิกัดโดยประมาณ", " · Approximate destination")
            : ""}
        </p>
        <div className="pin-secondary-actions">
          <a href="tel:022180000">
            <Phone size={15} />
            {t("สอบถาม รปภ.", "Call CU security")}
          </a>
          {hasCoordinates(g) && (
            <button onClick={onMap}>
              <MapPin size={15} />
              {t("ดูจุดบนแผนที่", "Show on map")}
            </button>
          )}
        </div>
        <details key={g.id} className="pin-evidence">
          <summary>
            {t("ตารางและแหล่งอ้างอิง", "Schedules & sources")}{" "}
            <span>{g.sources.length}</span>
          </summary>
          <p className="evidence-warning">
            {t(
              "กำลังใช้ตารางเดิมเป็นฐานคำนวณตามที่ตั้งค่าไว้ สถานะหลักฐานยังคงเป็นข้อมูลเก่า ไม่ใช่การตรวจหน้างานใหม่",
              "Historical schedules are adopted as the working baseline; this is not a new field verification.",
            )}
          </p>
          {refs.map((ref, i) => (
            <div className="compact-reference" key={i}>
              <span>
                {t("ประกาศเก่าปี", "Historical notice")}{" "}
                {referenceYear(ref, dataset, lang)} ·{" "}
                {ref.appliesTo === "vehicle"
                  ? t("ยานพาหนะ ไม่แยกประเภทรถ", "Vehicle types unspecified")
                  : ref.appliesTo === "car"
                    ? t("รถยนต์", "Car")
                    : ref.appliesTo === "pedestrian"
                      ? t("คนเดิน", "Walking")
                      : t("มอเตอร์ไซค์", "Motorcycle")}
              </span>
              <strong>{lang === "th" ? ref.hoursTh : ref.hoursEn}</strong>
              <p>{lang === "th" ? ref.restrictionTh : ref.restrictionEn}</p>
            </div>
          ))}
          {g.schedule && (
            <div className="compact-reference">
              <span>
                {t("ตารางในข้อมูล", "Recorded schedule")} ·{" "}
                {statusLabel(g.schedule.verificationStatus, lang)}
              </span>
              {g.schedule.intervals.map((i, n) => (
                <strong key={n}>
                  {i.days
                    .map(
                      (d) =>
                        (lang === "th"
                          ? ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."]
                          : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"])[
                          d
                        ],
                    )
                    .join(", ")}{" "}
                  {i.open}–{i.close}
                </strong>
              ))}
            </div>
          )}
          <dl className="mini-dl">
            {(["pedestrian", "car", "motorcycle"] as TravelMode[]).map((m) => (
              <div key={m}>
                <dt>
                  {m === "pedestrian"
                    ? t("เดิน", "Walk")
                    : m === "car"
                      ? t("รถยนต์", "Car")
                      : t("มอเตอร์ไซค์", "Motorcycle")}
                </dt>
                <dd>{field(permission(g, m))}</dd>
              </div>
            ))}
            <div>
              <dt>{t("ทางเข้า / ทางออก", "Entry / exit")}</dt>
              <dd>
                {field(directionPermission(g, "entry"))} /{" "}
                {field(directionPermission(g, "exit"))}
              </dd>
            </div>
            <div>
              <dt>{t("ข้อมูลประตู", "Gate information")}</dt>
              <dd>{statusLabel(g.verificationStatus, lang)}</dd>
            </div>
            {g.specialRestrictions && (
              <div>
                <dt>{t("ข้อจำกัดเฉพาะ", "Special restrictions")}</dt>
                <dd>{g.specialRestrictions}</dd>
              </div>
            )}
            <div>
              <dt>{t("ยืนยันการเข้าออก", "Access verified")}</dt>
              <dd>
                {g.lastVerified
                  ? dateLabel(g.lastVerified, lang)
                  : t("ยังไม่ยืนยัน", "Not verified")}
              </dd>
            </div>
            <div>
              <dt>{t("ยืนยันพิกัด", "Coordinates verified")}</dt>
              <dd>
                {g.coordinateLastVerified
                  ? dateLabel(g.coordinateLastVerified, lang)
                  : t("ยังไม่ยืนยัน", "Not verified")}
              </dd>
            </div>
            <div>
              <dt>{t("ทบทวนหลักฐาน", "Evidence reviewed")}</dt>
              <dd>{dateLabel(g.lastReviewed, lang)}</dd>
            </div>
          </dl>
          <p className="evidence-note">{lang === "th" ? g.notesTh : g.notes}</p>
          <p className="evidence-note">
            {lang === "th"
              ? g.coordinateVerificationNotesTh
              : g.coordinateVerificationNotes}
          </p>
          {hasCoordinates(g) && (
            <p className="coordinates">
              {g.latitude.toFixed(7)}, {g.longitude.toFixed(7)} · WGS84 ·{" "}
              {g.coordinateConfidence}
            </p>
          )}
          <div className="source-list">
            {g.sources.map((id) => {
              const source = dataset.sources.find((s) => s.id === id)!;
              return (
                <a key={id} href={source.url} target="_blank" rel="noreferrer">
                  <span>
                    {lang === "th" ? source.titleTh : source.title}
                    <ExternalLink size={13} />
                  </span>
                  <small>
                    {t("เผยแพร่", "Published")}{" "}
                    {dateLabel(source.publishedAt, lang)} ·{" "}
                    {t("ทบทวน", "reviewed")}{" "}
                    {dateLabel(source.reviewedAt, lang)}
                  </small>
                  <small>{lang === "th" ? source.scopeTh : source.scope}</small>
                </a>
              );
            })}
          </div>
          {g.coordinateSource && (
            <a
              className="text-link"
              href={g.coordinateSource}
              target="_blank"
              rel="noreferrer"
            >
              {t("ดูพิกัดบน OSM", "View coordinate source")}
              <ExternalLink size={13} />
            </a>
          )}
        </details>
      </div>
    </aside>
  );
}
