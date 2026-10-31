import { useMemo, useState } from "react";
import {
  ArrowRight,
  ChevronRight,
  Download,
  MapPin,
  Search,
  Info,
} from "lucide-react";
import type { Dataset } from "../lib/data";
import { qualityRows, qualityStats } from "../lib/gates";
import type { QualityKey } from "../lib/gates";
import {
  useCopy,
  metricCopy,
  gateName,
  gateNearby,
  statusLabel,
  coordinateLabel,
  dateLabel,
} from "../lib/i18n";
const statuses: QualityKey[] = [
  "VERIFIED",
  "HISTORICAL",
  "UNVERIFIED",
  "UNKNOWN",
];
const gpsKeys: QualityKey[] = ["gpsVerified", "gpsApproximate", "gpsUnknown"];
export default function QualityDashboard({
  dataset,
  now,
  onSelect,
}: {
  dataset: Dataset;
  now: Date;
  onSelect: (id: string) => void;
}) {
  const { lang, t } = useCopy();
  const [metric, setMetric] = useState<QualityKey>("total"),
    [query, setQuery] = useState("");
  const stats = useMemo(() => qualityStats(dataset.gates, now), [dataset, now]);
  const rows = qualityRows(dataset.gates, metric, now).filter((g) =>
    [g.name, g.shortNameTh, g.nameEn, g.nearby, g.nearbyTh, ...g.aliases]
      .join(" ")
      .toLowerCase()
      .includes(query.toLowerCase().trim()),
  );
  const withReference = dataset.gates.filter(
    (g) => g.operatingRules.length > 0,
  ).length;
  const label = (key: QualityKey) => metricCopy(key, lang).label;
  const download = () => {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(dataset, null, 2)], {
        type: "application/json",
      }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "cu-gates.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <div className="quality-page">
      <div className="quality-heading">
        <div>
          <span className="eyebrow">
            {t("ข้อมูลและที่มา", "DATA & SOURCES")}
          </span>
          <h1>
            {t(
              "รู้จักข้อมูลก่อนเลือกประตู",
              "Know the evidence behind each gate.",
            )}
          </h1>
          <p>
            {t(
              "ดูว่ารู้อะไรแล้ว และส่วนไหนยังต้องตรวจสอบ",
              "See what is known and what still needs checking.",
            )}
          </p>
        </div>
        <button className="secondary-button" onClick={download}>
          <Download size={17} />
          {t("ดาวน์โหลดข้อมูล JSON", "Download gate JSON")}
        </button>
      </div>
      <div className="quality-warning">
        <Info size={21} />
        <p>
          <strong>
            {t(
              "พิกัดชัดเจน ไม่ได้แปลว่าเปิดอยู่",
              "A mapped point does not mean an open gate.",
            )}
          </strong>{" "}
          {t(
            `กำลังใช้ตารางเก่าเป็นฐานคำนวณ ${withReference} ประตูกลุ่มตามการตั้งค่า สถานะหลักฐานด้านล่างยังนับตามข้อมูลต้นฉบับ การใช้ตารางไม่ได้เปลี่ยนข้อมูลเก่าให้เป็นการยืนยันใหม่`,
            `Historical schedules are adopted for ${withReference} gate groups. Evidence statistics retain the original provenance; adopting a schedule is not a new verification.`,
          )}
        </p>
      </div>
      <div className="quality-scope">
        <span>
          {t(
            `คำนวณจากข้อมูลทั้งหมด ${stats.total} ประตูกลุ่ม`,
            `${stats.total} gate groups in the loaded dataset`,
          )}
        </span>
        <span>
          {t("ทบทวนหลักฐาน", "Evidence reviewed")}{" "}
          {dateLabel(dataset.researchedAt, lang)} ·{" "}
          {t("เวลาประเทศไทย", "Asia/Bangkok")}
        </span>
      </div>
      <div className="quality-kpis">
        {(
          ["total", "VERIFIED", "gpsVerified", "gpsUnknown"] as QualityKey[]
        ).map((k) => (
          <button
            className={`kpi-card ${metric === k ? "active" : ""}`}
            key={k}
            onClick={() => setMetric(k)}
          >
            <span>{label(k)}</span>
            <strong>
              {stats[k]}
              <ArrowRight size={20} />
            </strong>
            <small>
              {k === "total"
                ? t("ยังไม่ใช่การสำรวจครบทุกช่องทาง", "Coverage is incomplete")
                : k === "VERIFIED"
                  ? t(
                      "ไม่นับประกาศเก่าเป็นข้อมูลล่าสุด",
                      "Historical notices do not count as current",
                    )
                  : k === "gpsVerified"
                    ? t(
                        "ตรวจสอบจุดประตูจากแผนที่",
                        "Physical gate points matched to maps",
                      )
                    : t(
                        "งดนำทางจนกว่าจะมีจุดชัดเจน",
                        "Directions stay disabled",
                      )}
            </small>
          </button>
        ))}
      </div>
      <div className="quality-charts">
        <section className="quality-card">
          <div className="section-title">
            <h2>{t("หลักฐานข้อมูลประตู", "Gate information evidence")}</h2>
            <span>
              {stats.total} {t("ประตูกลุ่ม", "records")}
            </span>
          </div>
          <p>
            {t(
              "สถานะของข้อมูลการเข้าออก ไม่ใช่จำนวนประตูที่เปิด",
              "Access evidence status, not a count of open gates",
            )}
          </p>
          <div className="quality-bars">
            {statuses.map((k) => (
              <button
                className={`bar-row ${metric === k ? "active" : ""}`}
                key={k}
                onClick={() => setMetric(k)}
                aria-label={`${t("ดู", "Inspect")} ${label(k)}: ${stats[k]}`}
              >
                <span className="bar-label">
                  <i className={`status-dot ${k.toLowerCase()}`} />
                  {label(k)}
                </span>
                <span className="bar-track">
                  <span
                    className={k.toLowerCase()}
                    style={{
                      width: `${stats.total ? (stats[k] / stats.total) * 100 : 0}%`,
                    }}
                  />
                </span>
                <strong>{stats[k]}</strong>
              </button>
            ))}
          </div>
        </section>
        <section className="quality-card">
          <div className="section-title">
            <h2>{t("พิกัดสำหรับนำทาง", "Navigation coordinates")}</h2>
            <MapPin size={19} />
          </div>
          <p>
            {t(
              "ความชัดเจนของตำแหน่งแยกจากสิทธิ์เข้าออก",
              "Position confidence is separate from access permission",
            )}
          </p>
          <div
            className="coordinate-segments"
            aria-label={t(
              "สัดส่วนคุณภาพพิกัด",
              "Coordinate quality distribution",
            )}
          >
            {gpsKeys.map((k) => (
              <button
                key={k}
                title={`${label(k)}: ${stats[k]}`}
                style={{
                  width: `${stats.total ? (stats[k] / stats.total) * 100 : 0}%`,
                }}
                className={k}
                onClick={() => setMetric(k)}
                disabled={!stats[k]}
              >
                {stats[k] > 0 ? stats[k] : ""}
              </button>
            ))}
          </div>
          <div className="coordinate-legend">
            {gpsKeys.map((k) => (
              <button key={k} onClick={() => setMetric(k)}>
                <span>
                  <i className={`status-dot ${k}`} />
                  {label(k)}
                </span>
                <strong>{stats[k]}</strong>
              </button>
            ))}
          </div>
        </section>
      </div>
      <div className="gap-cards">
        {(["vehiclesUnknown", "schedulesUnknown"] as QualityKey[]).map((k) => (
          <button
            key={k}
            className={metric === k ? "active" : ""}
            onClick={() => setMetric(k)}
          >
            <span className="gap-count">{stats[k]}</span>
            <span>
              <strong>{label(k)}</strong>
              <small>
                {k === "vehiclesUnknown"
                  ? t(
                      "ยังต้องยืนยันแยกรถยนต์กับมอเตอร์ไซค์",
                      "Current car and motorcycle rules still need evidence",
                    )
                  : t(
                      "แอปกำลังใช้ตารางอ้างอิงเดิมเป็นฐาน",
                      "The app uses adopted reference schedules",
                    )}
              </small>
            </span>
            <ChevronRight size={18} />
          </button>
        ))}
      </div>
      <section className="records-section">
        <div className="records-heading">
          <div>
            <h2>
              {t("ตรวจสอบทีละประตู", "Inspect individual gates")}{" "}
              <span className="count">{rows.length}</span>
            </h2>
            <p>{metricCopy(metric, lang).description}</p>
          </div>
          <label className="search compact">
            <Search size={17} />
            <input
              aria-label={t(
                "ค้นหาในข้อมูลประตู",
                "Search data quality records",
              )}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("ค้นหาประตูหรือคณะ", "Search a gate or faculty")}
            />
          </label>
        </div>
        <div className="record-filter">
          <label>
            {t("แสดง", "Showing")}
            <select
              aria-label={t("หัวข้อคุณภาพข้อมูล", "Data quality metric")}
              value={metric}
              onChange={(e) => setMetric(e.target.value as QualityKey)}
            >
              {(Object.keys(stats) as QualityKey[]).map((k) => (
                <option key={k} value={k}>
                  {label(k)} ({stats[k]})
                </option>
              ))}
            </select>
          </label>
          <button
            className="text-button"
            onClick={() => {
              setMetric("total");
              setQuery("");
            }}
          >
            {t("แสดงทั้งหมด", "Reset view")}
          </button>
        </div>
        <div className="records-table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t("ประตู / จุดใกล้เคียง", "Gate / nearby place")}</th>
                <th>{t("ข้อมูลประตู", "Information")}</th>
                <th>{t("พิกัด", "Coordinates")}</th>
                <th>{t("แหล่งอ้างอิง", "Sources")}</th>
                <th>
                  <span className="sr-only">{t("ตรวจสอบ", "Inspect")}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((g) => (
                <tr key={g.id}>
                  <td>
                    <button
                      className="record-name"
                      onClick={() => onSelect(g.id)}
                    >
                      {gateName(g, lang)}
                      <small>{lang === "th" ? g.name : g.nameEn}</small>
                    </button>
                    <span className="record-nearby">{gateNearby(g, lang)}</span>
                  </td>
                  <td>
                    <span
                      className={`status ${g.verificationStatus.toLowerCase()}`}
                    >
                      {statusLabel(g.verificationStatus, lang)}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`coordinate-pill ${g.coordinateConfidence.toLowerCase()}`}
                    >
                      {coordinateLabel(g, lang)}
                    </span>
                  </td>
                  <td>
                    {g.sources.length} {t("แหล่ง", "sources")}
                  </td>
                  <td>
                    <button
                      className="icon-button"
                      aria-label={`${t("ตรวจสอบ", "Inspect")} ${gateName(g, lang)}`}
                      onClick={() => onSelect(g.id)}
                    >
                      <ArrowRight size={19} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!rows.length && (
          <div className="empty-state">
            <Search size={25} />
            <h3>{t("ไม่มีข้อมูลตรงกับตัวเลือกนี้", "No matching records")}</h3>
            <p>
              {t(
                "ลองเลือกหัวข้ออื่นหรือล้างคำค้น",
                "Try another metric or clear your search.",
              )}
            </p>
            <button
              className="text-button"
              onClick={() => {
                setMetric("total");
                setQuery("");
              }}
            >
              {t("ดูประตูทั้งหมด", "Show all gates")}
            </button>
          </div>
        )}
      </section>
      <footer className="quality-footer">
        <p>
          {t(
            "ครอบคลุมกลุ่มประตูที่มีชื่อรอบพื้นที่หลักและกลุ่มคณะใกล้เคียง ไม่นับช่องทางภายในโรงเรียนหรือโรงพยาบาลเป็นประตูส่วนกลาง การสำรวจยังไม่ครบทุกช่องทาง",
            dataset.scope,
          )}
        </p>
        <a
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noreferrer"
        >
          {t("ข้อมูลแผนที่", "Map data")} © OpenStreetMap contributors · ODbL
        </a>
      </footer>
    </div>
  );
}
