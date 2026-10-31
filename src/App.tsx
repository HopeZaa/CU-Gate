import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Car,
  ChevronRight,
  CircleHelp,
  Info,
  Footprints,
  LocateFixed,
  Map,
  List,
  MapPin,
  Moon,
  Navigation,
  Phone,
  Search,
  ShieldCheck,
  ShieldQuestion,
  SlidersHorizontal,
  Sun,
  X,
} from "lucide-react";
import { dataset, dataResult } from "./lib/data";
import type { VerificationStatus } from "./lib/data";
import {
  defaultFilters,
  directionsUrl,
  filterGates,
  hasCoordinates,
  haversine,
} from "./lib/gates";
import type { Filters, Position } from "./lib/gates";
import { startLocationWatch } from "./lib/geolocation";
import type { GPSState } from "./lib/geolocation";
import {
  LanguageContext,
  useCopy,
  gateName,
  gateNearby,
  gpsText,
  distanceLabel,
} from "./lib/i18n";
import type { Language } from "./lib/i18n";
import { planGateOrder } from "./lib/planning";
import {
  availabilityCounts,
  filterAvailability,
  gateAvailability,
} from "./lib/availability";
import type { AvailabilityFilter } from "./lib/availability";
import { hasOperatingHours } from "./lib/operating";
import { origins } from "./lib/origins";
import GateDetails from "./components/GateDetails";
import QualityDashboard from "./components/QualityDashboard";
import MotorcycleIcon from "./components/MotorcycleIcon";
const CampusMap = lazy(() => import("./components/CampusMap"));
function saved(key: string, fallback: string) {
  try {
    return localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}
export default function App() {
  const [lang, setLang] = useState<Language>(() =>
    saved("cu-language", "th") === "en" ? "en" : "th",
  );
  useEffect(() => {
    document.documentElement.lang = lang;
    document.title =
      lang === "th"
        ? "ประตูจุฬาฯ · CU Gate Navigator"
        : "CU Gate Navigator · Find a campus entrance";
    try {
      localStorage.setItem("cu-language", lang);
    } catch {
      /* Optional preference storage. */
    }
  }, [lang]);
  return (
    <LanguageContext.Provider value={lang}>
      <Navigator
        onLanguage={() => setLang((l) => (l === "th" ? "en" : "th"))}
      />
    </LanguageContext.Provider>
  );
}
function Navigator({ onLanguage }: { onLanguage: () => void }) {
  const { lang, t } = useCopy();
  const [view, setView] = useState<"explore" | "quality">(() =>
    window.location.hash === "#quality" ? "quality" : "explore",
  );
  const [mobileView, setMobileView] = useState<"list" | "map">("map");
  const [filters, setFilters] = useState<Filters>({
      ...defaultFilters,
      mode: "pedestrian",
      mappedOnly: false,
    }),
    [advanced, setAdvanced] = useState(false),
    [selected, setSelected] = useState<string | null>(null),
    [mapFocus, setMapFocus] = useState<string | null>(null),
    [dark, setDark] = useState(() => saved("cu-theme", "light") === "dark"),
    [now, setNow] = useState(() => new Date());
  const [availability, setAvailability] = useState<AvailabilityFilter>("all");
  const [overview, setOverview] = useState(0);
  const [guideVisible, setGuideVisible] = useState(
    () => saved("cu-map-guide", "shown") !== "hidden",
  );
  const [legendVisible, setLegendVisible] = useState(
    () => saved("cu-map-legend", "shown") !== "hidden",
  );
  const toggleLegend = useCallback(
    () => setLegendVisible((shown) => !shown),
    [],
  );
  useEffect(() => {
    try {
      localStorage.setItem("cu-map-guide", guideVisible ? "shown" : "hidden");
      localStorage.setItem("cu-map-legend", legendVisible ? "shown" : "hidden");
    } catch {
      /* Map display preferences are optional. */
    }
  }, [guideVisible, legendVisible]);
  const [hoursOnly, setHoursOnly] = useState(false);
  const [position, setPosition] = useState<Position | null>(null),
    [gps, setGPS] = useState<GPSState>("idle"),
    [focusLocation, setFocusLocation] = useState(0),
    [startId, setStartId] = useState("none");
  const stopWatch = useRef<(() => void) | null>(null),
    startPanel = useRef<HTMLDetailsElement>(null),
    about = useRef<HTMLDialogElement>(null);
  const onSelect = useCallback((id: string) => {
      startPanel.current?.removeAttribute("open");
      setAdvanced(false);
      setMobileView("map");
      setSelected(id);
      setMapFocus(id);
    }, []),
    onClose = useCallback(() => {
      setSelected(null);
      setMapFocus(null);
      setOverview((n) => n + 1);
    }, []);
  const update = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    setFilters((f) => ({ ...f, [key]: value }));
  const reset = () => {
    setAvailability("all");
    setHoursOnly(false);
    setOverview((n) => n + 1);
    setFilters({ ...defaultFilters, mode: "pedestrian", mappedOnly: false });
  };
  useEffect(() => {
    let timer: number;
    const tick = () => {
      setNow(new Date());
      timer = window.setTimeout(tick, 60000 - (Date.now() % 60000) + 20);
    };
    const visible = () => {
      if (!document.hidden) {
        window.clearTimeout(timer);
        tick();
      }
    };
    tick();
    document.addEventListener("visibilitychange", visible);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", visible);
    };
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", dark ? "#202a2a" : "#fffefa");
    try {
      localStorage.setItem("cu-theme", dark ? "dark" : "light");
    } catch {
      /* Optional theme preference. */
    }
  }, [dark]);
  useEffect(() => {
    const changed = () => {
      setView(window.location.hash === "#quality" ? "quality" : "explore");
      setSelected(null);
    };
    window.addEventListener("hashchange", changed);
    return () => window.removeEventListener("hashchange", changed);
  }, []);
  useEffect(() => {
    const hide = () => {
      if (document.hidden && stopWatch.current) {
        stopWatch.current();
        stopWatch.current = null;
        setGPS("paused");
        setPosition(null);
      }
    };
    document.addEventListener("visibilitychange", hide);
    return () => {
      stopWatch.current?.();
      document.removeEventListener("visibilitychange", hide);
    };
  }, []);
  const stopGPS = () => {
    stopWatch.current?.();
    stopWatch.current = null;
    setPosition(null);
    setGPS("paused");
    setStartId("none");
  };
  const locate = () => {
    stopWatch.current?.();
    stopWatch.current = null;
    setPosition(null);
    setStartId("gps");
    let first = true;
    stopWatch.current = startLocationWatch(
      navigator.geolocation,
      (p) => {
        setPosition(p);
        if (first) {
          startPanel.current?.removeAttribute("open");
          setFocusLocation((x) => x + 1);
          first = false;
        }
      },
      (s) => {
        setGPS(s);
        if (s !== "active" && s !== "requesting") setPosition(null);
      },
      window.isSecureContext,
    );
  };
  const chooseStart = (id: string) => {
    if (id === "gps") {
      locate();
      return;
    }
    stopWatch.current?.();
    stopWatch.current = null;
    setPosition(null);
    if (gps === "active" || gps === "requesting") setGPS("paused");
    setStartId(id);
    startPanel.current?.removeAttribute("open");
    setFocusLocation((x) => x + 1);
  };
  const landmark = origins.find((o) => o.id === startId) || null;
  const origin = startId === "gps" ? position : landmark;
  const originName = landmark
    ? lang === "th"
      ? landmark.name
      : landmark.nameEn
    : t("ตำแหน่งของคุณ", "your location");
  const allGates = useMemo(
    () =>
      dataset
        ? planGateOrder(
            filterGates(dataset.gates, filters, origin, now, true).filter(
              (g) => !hoursOnly || hasOperatingHours(g, filters.mode, now),
            ),
            filters.mode,
            filters.direction,
            now,
            origin,
            filters.sort,
            lang,
          )
        : [],
    [filters, origin, now, lang, hoursOnly],
  );
  const gates = useMemo(
    () =>
      filterAvailability(
        allGates,
        availability,
        filters.mode,
        filters.direction,
        now,
      ),
    [allGates, availability, filters.mode, filters.direction, now],
  );
  const counts = useMemo(
    () => availabilityCounts(allGates, filters.mode, filters.direction, now),
    [allGates, filters.mode, filters.direction, now],
  );
  const chooseAvailability = (value: AvailabilityFilter) => {
    setAvailability(value);
    setSelected(null);
    setMapFocus(null);
    if (value === "all") setOverview((n) => n + 1);
  };
  const clockText = new Intl.DateTimeFormat(lang === "th" ? "th-TH" : "en-GB", {
    timeZone: "Asia/Bangkok",
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(now);
  const selectedGate = dataset?.gates.find((g) => g.id === selected);
  const navigateView = (next: "explore" | "quality") => {
    setView(next);
    setSelected(null);
    window.location.hash = next === "quality" ? "quality" : "explore";
  };
  if (!dataset)
    return (
      <main className="fatal-error">
        <ShieldQuestion size={36} />
        <h1>{t("โหลดข้อมูลประตูไม่ได้", "Gate data could not be loaded")}</h1>
        <p>
          {t(
            "ข้อมูลไม่ผ่านการตรวจสอบ จึงยังไม่แสดงพิกัดหรือคำแนะนำ กรุณาลองโหลดใหม่",
            "The dataset failed validation. No unvalidated coordinates or access rules are shown.",
          )}
        </p>
        <details>
          <summary>{t("รายละเอียดข้อผิดพลาด", "Validation details")}</summary>
          <pre>{JSON.stringify(dataResult.error?.issues, null, 2)}</pre>
        </details>
      </main>
    );
  const mapped = gates.filter(hasCoordinates).length;
  const outside =
    position &&
    (position.latitude < 13.727 ||
      position.latitude > 13.75 ||
      position.longitude < 100.518 ||
      position.longitude > 100.538);
  const activeCount =
    Number(filters.verification !== "all") +
    Number(filters.mappedOnly) +
    Number(hoursOnly);
  const modeOptions = [
    { id: "pedestrian" as const, th: "เดิน", en: "Walk", Icon: Footprints },
    {
      id: "motorcycle" as const,
      th: "มอเตอร์ไซค์",
      en: "Motorcycle",
      Icon: MotorcycleIcon,
    },
    { id: "car" as const, th: "รถยนต์", en: "Car", Icon: Car },
  ];
  return (
    <div
      className={`app-shell v2 v3 v4 mobile-${mobileView} ${selected && view === "explore" ? "has-selection" : ""}`}
    >
      <header className="app-header">
        <a
          className="brand"
          href="#explore"
          onClick={() => navigateView("explore")}
          aria-label={t("หน้าแรก ประตูจุฬาฯ", "CU Gate Navigator home")}
        >
          <span className="brand-symbol">
            <svg
              width="25"
              height="27"
              viewBox="0 0 32 32"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M7 27V9h18v18M13 27V17h6v10M4 9h24M11 4h10"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <span>
            {t("ประตูจุฬาฯ", "CU Gate")}
            <small>CU GATE NAVIGATOR</small>
          </span>
        </a>
        <nav aria-label={t("เมนูหลัก", "Main navigation")}>
          <button
            className={view === "explore" ? "active" : ""}
            onClick={() => navigateView("explore")}
          >
            <Map size={17} />
            {t("ค้นหาประตู", "Find a gate")}
          </button>
          <button
            className={view === "quality" ? "active" : ""}
            onClick={() => navigateView("quality")}
          >
            <BarChart3 size={17} />
            {t("ข้อมูลและที่มา", "Data & sources")}
          </button>
        </nav>
        <div className="header-actions">
          <span className="bangkok-time">
            {new Intl.DateTimeFormat("en-GB", {
              timeZone: "Asia/Bangkok",
              hour: "2-digit",
              minute: "2-digit",
            }).format(now)}
            <small>{t("เวลาประเทศไทย", "BANGKOK")}</small>
          </span>
          <button
            className="icon-button theme-toggle"
            aria-label={
              dark
                ? t("เปลี่ยนเป็นโหมดสว่าง", "Switch to light mode")
                : t("เปลี่ยนเป็นโหมดมืด", "Switch to dark mode")
            }
            title={
              dark
                ? t("เปลี่ยนเป็นโหมดสว่าง", "Switch to light mode")
                : t("เปลี่ยนเป็นโหมดมืด", "Switch to dark mode")
            }
            aria-pressed={dark}
            onClick={() => setDark((x) => !x)}
          >
            {dark ? <Sun size={21} /> : <Moon size={21} />}
          </button>
          <button
            className="language-button"
            onClick={onLanguage}
            aria-label={
              lang === "th" ? "Switch to English" : "เปลี่ยนเป็นภาษาไทย"
            }
          >
            {lang === "th" ? "EN" : "ไทย"}
          </button>
          <button
            className="icon-button"
            title={t("วิธีใช้และข้อมูล", "Help & information")}
            aria-label={t("วิธีใช้และข้อมูล", "Help & information")}
            onClick={() => about.current?.showModal()}
          >
            <CircleHelp size={21} />
          </button>
        </div>
      </header>
      {view === "explore" ? (
        <main className="explore-layout">
          <aside className="directory">
            <div className="directory-controls">
              <h1>{t("หาประตูเข้า–ออก", "Find a campus gate")}</h1>
              <p className="intro">
                {t(
                  "ดูสถานะจากสีหมุด แล้วกดเพื่อนำทาง",
                  "See the status on the map. Tap a pin for directions.",
                )}
              </p>
              <label className="search">
                <Search size={19} />
                <input
                  aria-label={t(
                    "ค้นหาคณะหรือประตู",
                    "Search faculties or gates",
                  )}
                  placeholder={t(
                    "เช่น บัญชี อักษรฯ หรือประตูศศินทร์",
                    "Faculty, gate or nearby place",
                  )}
                  value={filters.query}
                  onChange={(e) => update("query", e.target.value)}
                />
                {filters.query && (
                  <button
                    aria-label={t("ล้างคำค้น", "Clear search")}
                    onClick={() => update("query", "")}
                  >
                    <X size={17} />
                  </button>
                )}
              </label>
              <div
                className="mode-tabs"
                aria-label={t("วิธีเดินทาง", "Travel mode")}
              >
                {modeOptions.map(({ id, th, en, Icon }) => (
                  <button
                    key={id}
                    title={
                      id === "car"
                        ? t(
                            "รถยนต์เข้าได้ รวมมอเตอร์ไซค์และเดิน",
                            "Car access includes motorcycles and walking",
                          )
                        : id === "motorcycle"
                          ? t(
                              "มอเตอร์ไซค์เข้าได้ รวมเดิน",
                              "Motorcycle access includes walking",
                            )
                          : t(
                              "รวมประตูที่รถยนต์หรือมอเตอร์ไซค์ผ่านได้",
                              "Includes gates accessible to cars or motorcycles",
                            )
                    }
                    className={filters.mode === id ? "active" : ""}
                    aria-pressed={filters.mode === id}
                    onClick={() => update("mode", id)}
                  >
                    <Icon size={19} />
                    {t(th, en)}
                  </button>
                ))}
              </div>
              <div
                className="availability-tabs"
                aria-label={t("สถานะประตู", "Gate availability")}
              >
                <button
                  className={availability === "all" ? "active" : ""}
                  aria-pressed={availability === "all"}
                  onClick={() => chooseAvailability("all")}
                >
                  <Map size={17} />
                  {t("ประตูทั้งหมด", "All gates")}
                  <span>{allGates.length}</span>
                </button>
                <button
                  className={
                    availability === "open"
                      ? "active open-filter"
                      : "open-filter"
                  }
                  aria-pressed={availability === "open"}
                  onClick={() => chooseAvailability("open")}
                >
                  <span className="status-dot availability-open" />
                  {t("เปิดตอนนี้", "Open now")}
                  <span>{counts.open}</span>
                </button>
              </div>
              <div className="current-time-row">
                <time dateTime={now.toISOString()}>
                  {clockText} · {t("ไทย", "Bangkok")}
                </time>
              </div>
              <div className="filter-row simple">
                <button
                  className={`gps-launch ${gps === "active" ? "active" : ""}`}
                  onClick={gps === "active" ? stopGPS : locate}
                  disabled={gps === "requesting"}
                  aria-pressed={gps === "active"}
                  aria-label={
                    gps === "active"
                      ? t("หยุดใช้ตำแหน่ง GPS", "Stop using GPS")
                      : t(
                          "ใช้ GPS หาประตูใกล้ฉัน",
                          "Use GPS to find nearby gates",
                        )
                  }
                >
                  <LocateFixed size={19} />
                  <span>
                    {gps === "active"
                      ? t("หยุด GPS", "Stop GPS")
                      : gps === "requesting"
                        ? t("กำลังหา…", "Locating…")
                        : t("ใกล้ฉัน", "Near me")}
                  </span>
                  {gps !== "active" && <small>GPS</small>}
                </button>
                <details ref={startPanel} className="start-panel">
                  <summary>
                    <LocateFixed size={15} />
                    {landmark
                      ? t("MRT สามย่าน", "Sam Yan MRT")
                      : gps === "active"
                        ? "GPS"
                        : t("จุดเริ่มต้น", "Start point")}
                  </summary>
                  <div className="start-popover">
                    <div className="start-controls">
                      <label>
                        <span className="sr-only">
                          {t("เลือกจุดเริ่มต้น", "Choose a starting point")}
                        </span>
                        <select
                          aria-label={t(
                            "เลือกจุดเริ่มต้น",
                            "Choose a starting point",
                          )}
                          value={startId}
                          onChange={(e) => chooseStart(e.target.value)}
                        >
                          <option value="none">
                            {t(
                              "หรือเลือกจุดเริ่มต้น",
                              "Or choose a starting point",
                            )}
                          </option>
                          <option value="gps">
                            {t("ตำแหน่งปัจจุบัน", "My current location")}
                          </option>
                          {origins.map((o) => (
                            <option key={o.id} value={o.id}>
                              {lang === "th" ? "MRT สามย่าน" : o.nameEn}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  </div>
                </details>
                <button
                  className="filter-button"
                  aria-expanded={advanced}
                  onClick={() => {
                    startPanel.current?.removeAttribute("open");
                    setAdvanced((x) => !x);
                  }}
                >
                  <SlidersHorizontal size={16} />
                  {t("ตัวเลือก", "Options")}
                  {activeCount > 0 && <span>{activeCount}</span>}
                </button>
              </div>
              {(startId !== "none" || !["idle", "paused"].includes(gps)) && (
                <p
                  className={`gps-message ${["denied", "unavailable", "timeout"].includes(gps) ? "gps-error" : ""}`}
                  role="status"
                >
                  {landmark
                    ? t(
                        "เรียงระยะจาก MRT สามย่าน ไม่ใช่ตำแหน่งของคุณ",
                        "Distances from Sam Yan MRT, not your device location.",
                      )
                    : gpsText(gps, lang)}
                  {gps === "active" && position
                    ? ` · ${t("ความแม่นยำ", "Accuracy")} ±${Math.round(position.accuracy ?? 0)} ${t("ม.", "m")}`
                    : ""}
                  {outside
                    ? t(
                        " · คุณอยู่นอกขอบเขตแผนที่มหาวิทยาลัย",
                        " · You are outside the local campus map.",
                      )
                    : ""}
                </p>
              )}
              {advanced && (
                <div className="advanced-filters">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={filters.mappedOnly}
                      onChange={(e) => update("mappedOnly", e.target.checked)}
                    />
                    {t("เฉพาะประตูที่มีพิกัด", "Only gates with coordinates")}
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={hoursOnly}
                      onChange={(e) => setHoursOnly(e.target.checked)}
                    />
                    {t(
                      "เฉพาะประตูที่มีตาราง",
                      "Only gates with an operating schedule",
                    )}
                  </label>
                  <label>
                    {t("ระดับหลักฐาน", "Evidence")}
                    <select
                      aria-label={t("ระดับหลักฐาน", "Information status")}
                      value={filters.verification}
                      onChange={(e) =>
                        update(
                          "verification",
                          e.target.value as VerificationStatus | "all",
                        )
                      }
                    >
                      <option value="all">
                        {t("ทั้งหมด", "All evidence")}
                      </option>
                      <option value="VERIFIED">
                        {t("ยืนยันล่าสุด", "Verified")}
                      </option>
                      <option value="HISTORICAL">
                        {t("มีประกาศเก่า", "Historical")}
                      </option>
                      <option value="UNVERIFIED">
                        {t("ยังไม่ยืนยัน", "Unverified")}
                      </option>
                      <option value="UNKNOWN">
                        {t("ยังไม่มีหลักฐาน", "Unknown")}
                      </option>
                    </select>
                  </label>
                  <button className="text-button" onClick={reset}>
                    {t("คืนค่าตัวเลือก", "Reset options")}
                  </button>
                </div>
              )}
            </div>
            <div
              className="mobile-view-switch"
              aria-label={t("รูปแบบการแสดงผล", "Results view")}
            >
              <button
                className={mobileView === "list" ? "active" : ""}
                aria-pressed={mobileView === "list"}
                onClick={() => setMobileView("list")}
              >
                <List size={18} />
                {t("รายการประตู", "Gate list")}
                <span>{gates.length}</span>
              </button>
              <button
                className={mobileView === "map" ? "active" : ""}
                aria-pressed={mobileView === "map"}
                onClick={() => setMobileView("map")}
              >
                <Map size={18} />
                {t("แผนที่", "Map")}
              </button>
            </div>
            <div className="results-heading">
              <h2>
                {origin
                  ? t("ประตูใกล้จุดเริ่มต้น", "Gates near your start")
                  : t("รายการประตู", "Gate list")}
                <span>{gates.length}</span>
              </h2>
              <select
                aria-label={t("เรียงลำดับประตู", "Sort gates")}
                value={filters.sort}
                onChange={(e) =>
                  update("sort", e.target.value as Filters["sort"])
                }
              >
                <option value="recommended">{t("แนะนำ", "Suggested")}</option>
                <option value="distance" disabled={!origin}>
                  {t("ระยะใกล้สุด", "Nearest first")}
                </option>
                <option value="name">{t("ชื่อประตู", "Gate name")}</option>
              </select>
            </div>
            <div
              className="gate-list"
              role="region"
              tabIndex={0}
              aria-label={t("รายการประตู", "Gate results")}
            >
              {gates.map((g) => {
                const info = gateAvailability(
                    g,
                    filters.mode,
                    filters.direction,
                    now,
                    lang,
                  ),
                  url = directionsUrl(g, filters.mode, landmark),
                  distance =
                    origin && hasCoordinates(g) ? haversine(origin, g) : null;
                return (
                  <article
                    key={g.id}
                    className={`gate-card ${selected === g.id ? "selected" : ""}`}
                  >
                    <button
                      className="gate-card-main"
                      aria-label={`${t("ข้อมูลประตู", "Details for")} ${gateName(g, lang)}`}
                      onClick={() => onSelect(g.id)}
                    >
                      <span
                        className={`gate-number availability-${info.state}`}
                      >
                        {g.mapCode || g.mapLetter || <MapPin size={18} />}
                      </span>
                      <span className="gate-card-content">
                        <strong>{gateName(g, lang)}</strong>
                        <span className="gate-place">
                          {gateNearby(g, lang)}
                        </span>
                        <span
                          className={`planning-badge availability-${info.state}`}
                        >
                          {info.label}
                        </span>
                      </span>
                      <ChevronRight size={17} />
                    </button>
                    <div className="card-today">
                      <span>{t("วันนี้", "Today")}</span>
                      {info.today}
                      {info.next && <strong>{info.next}</strong>}
                    </div>
                    <div className="card-action-row">
                      <span className="distance-label">
                        {distance !== null ? (
                          <>
                            <strong>{distanceLabel(distance, lang)}</strong>
                            <small>{t("ระยะเส้นตรง", "straight line")}</small>
                          </>
                        ) : hasCoordinates(g) ? (
                          g.coordinateVerificationStatus ===
                          "VERIFIED" ? null : (
                            t("จุดโดยประมาณ", "Approximate point")
                          )
                        ) : null}
                      </span>
                      {url ? (
                        <a
                          className="card-navigate"
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={`${t("นำทางไป", "Directions to")} ${gateName(g, lang)}`}
                        >
                          <Navigation size={16} />
                          {t("นำทาง", "Directions")}
                          <ArrowUpRight size={14} />
                        </a>
                      ) : (
                        <button className="card-navigate" disabled>
                          {t("ยังไม่มีพิกัด", "No coordinates")}
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
              {!gates.length && (
                <div className="empty-state">
                  <Search size={26} />
                  <h3>{t("ไม่พบประตูตามตัวเลือก", "No matching gates")}</h3>
                  <p>
                    {availability === "open"
                      ? t(
                          "ประตูตามตัวเลือกนี้อยู่นอกเวลาเปิด หรือไม่รองรับทิศทางที่เลือก",
                          "The selected gates are outside opening hours or do not support this direction.",
                        )
                      : t(
                          "ลองใช้ชื่อคณะหรือชื่อสั้น เช่น บัญชี อักษร หรือศศินทร์",
                          "Try a faculty or a shorter gate name.",
                        )}
                  </p>
                  <button className="secondary-button" onClick={reset}>
                    {t("แสดงประตูที่มีจุดนำทาง", "Show mapped gates")}
                  </button>
                </div>
              )}
            </div>
            <button
              className="directory-footer"
              onClick={() => navigateView("quality")}
            >
              <ShieldCheck size={19} />
              <span>
                {t("ข้อมูลและแหล่งอ้างอิง", "Data & sources")}
                <small>
                  {t(
                    `พบ ${dataset.gates.length} รายการประตู · มีพิกัด ${dataset.gates.filter(hasCoordinates).length} จุด`,
                    `${dataset.gates.length} gate groups · ${dataset.gates.filter(hasCoordinates).length} mapped points`,
                  )}
                </small>
              </span>
              <ArrowUpRight size={17} />
            </button>
          </aside>
          <section
            className="map-area"
            aria-label={t("แผนที่มหาวิทยาลัย", "Campus map")}
          >
            <Suspense
              fallback={
                <div className="map-loading">
                  {t("กำลังเปิดแผนที่…", "Loading map…")}
                </div>
              }
            >
              <CampusMap
                gates={gates}
                selected={selected || mapFocus}
                onSelect={onSelect}
                position={position}
                referencePoint={landmark}
                focusLocation={focusLocation}
                dark={dark}
                mode={filters.mode}
                direction={filters.direction}
                now={now}
                overview={overview}
                legendVisible={legendVisible}
                onToggleLegend={toggleLegend}
              />
            </Suspense>
            <div className={`map-context ${guideVisible ? "" : "collapsed"}`}>
              <div id="map-guide-content" hidden={!guideVisible}>
                <strong>
                  {t("เลือกหมุดเพื่อดูสถานะ", "Tap a pin for gate status")}
                </strong>
                <span>
                  {t(`${mapped} จุดบนแผนที่`, `${mapped} mapped points`)} ·{" "}
                  {t("ตามตารางอ้างอิงเดิม", "Adopted reference schedules")}
                </span>
              </div>
              <button
                className={`map-overlay-toggle ${guideVisible ? "overlay-close" : "overlay-restore"}`}
                aria-label={
                  guideVisible
                    ? t("ซ่อนข้อความเลือกหมุด", "Hide pin guide")
                    : t("แสดงข้อความเลือกหมุด", "Show pin guide")
                }
                title={
                  guideVisible
                    ? t("ซ่อนข้อความเลือกหมุด", "Hide pin guide")
                    : t("แสดงข้อความเลือกหมุด", "Show pin guide")
                }
                aria-expanded={guideVisible}
                aria-controls="map-guide-content"
                onClick={() => setGuideVisible((shown) => !shown)}
              >
                {guideVisible ? (
                  <X size={15} />
                ) : (
                  <>
                    <Info size={15} />
                    <span>{t("วิธีใช้หมุด", "Pin guide")}</span>
                  </>
                )}
              </button>
            </div>
            {(gates.length === 0 || mapped === 0) && (
              <div className="map-empty" role="status">
                <ShieldQuestion size={28} />
                <h2>
                  {gates.length > 0
                    ? t(
                        `พบ ${gates.length} ประตู แต่ยังไม่มีพิกัด`,
                        `${gates.length} gates found without map coordinates`,
                      )
                    : availability === "open"
                      ? t(
                          "ไม่มีประตูเปิดตามตารางตอนนี้",
                          "No gates are scheduled open right now",
                        )
                      : t("ไม่พบประตูที่ค้นหา", "No matching gates")}
                </h2>
                <p>
                  {gates.length > 0
                    ? t(
                        "ดูเวลาและข้อมูลประตูได้จากรายการ",
                        "Inspect their hours and details in the gate list",
                      )
                    : availability === "open" && allGates.length > 0
                      ? t(
                          `ไม่มีตาราง ${counts.unknown} · มีเงื่อนไข ${counts.restricted} · ปิด/ไม่อนุญาต ${counts.closed}`,
                          `No schedule ${counts.unknown} · Restricted ${counts.restricted} · Closed/not permitted ${counts.closed}`,
                        )
                      : t(
                          "ลองเปลี่ยนคำค้นหรือตัวเลือก",
                          "Try another search or filter",
                        )}
                </p>
                <button
                  className="secondary-button"
                  onClick={
                    gates.length > 0 ? () => setMobileView("list") : reset
                  }
                >
                  {gates.length > 0
                    ? t("ดูรายการประตู", "View gate list")
                    : t("แสดงประตูทั้งหมด", "Show all gates")}
                </button>
              </div>
            )}
          </section>
        </main>
      ) : (
        <main className="quality-main">
          <QualityDashboard dataset={dataset} now={now} onSelect={onSelect} />
        </main>
      )}
      {selectedGate && (
        <GateDetails
          gate={selectedGate}
          dataset={dataset}
          position={origin}
          originName={origin ? originName : null}
          navigationOrigin={landmark}
          mode={filters.mode}
          direction={filters.direction}
          now={now}
          onClose={onClose}
          onMap={() => {
            setAvailability("all");
            setMobileView("map");
            setView("explore");
            window.history.replaceState(null, "", "#explore");
            setFilters({
              ...defaultFilters,
              mode: filters.mode,
              mappedOnly: true,
            });
            setSelected(null);
          }}
        />
      )}
      <dialog ref={about} className="about-dialog">
        <div>
          <span className="eyebrow">
            {t("ใช้แผนที่อย่างไร", "USING THE MAP")}
          </span>
          <button
            className="icon-button"
            aria-label={t("ปิดวิธีใช้", "Close help")}
            onClick={() => about.current?.close()}
          >
            <X size={21} />
          </button>
        </div>
        <h2>
          {t(
            "เลือกประตู แล้วไปต่อได้เลย",
            "Find a gate and take the next step.",
          )}
        </h2>
        <ol className="help-steps">
          <li>
            {t(
              "เลือกเดิน รถยนต์ หรือมอเตอร์ไซค์",
              "Choose walking, car or motorcycle.",
            )}
          </li>
          <li>
            {t(
              "ค้นหาคณะ หรือกดใกล้ฉันเพื่อเรียงระยะ",
              "Search a faculty, or choose Near me to sort by distance.",
            )}
          </li>
          <li>
            {t(
              "เลือกประตูทั้งหมด หรือเปิดตอนนี้ แล้วกดหมุดเพื่อนำทาง",
              "Choose All gates or Open now, then tap a pin for directions.",
            )}
          </li>
        </ol>
        <p>
          {t(
            "หมุดเขียว = เปิดตามตารางอ้างอิงเดิม แดง = ปิดหรือไม่อนุญาต เหลือง = มีเงื่อนไข เทา = ไม่มีตารางสำหรับตัวเลือกนี้ ปุ่มเปิดตอนนี้จะแสดงเฉพาะหมุดเขียว",
            "Green: open by the adopted schedule. Red: closed or not permitted. Amber: restricted. Grey: no schedule for this selection. Open now shows only green pins.",
          )}
        </p>
        <p>
          {t(
            "ระยะในแอปเป็นเส้นตรง Google Maps คำนวณเส้นทางให้ภายนอกแอป จุดโดยประมาณมีคำเตือนก่อนนำทาง",
            "App distances are straight-line. Google Maps calculates routes externally; approximate gate points are labelled.",
          )}
        </p>
        <p>
          {t(
            "แนวทางผู้เยี่ยมชมปี 2568 ระบุว่าบุคคลทั่วไปเยี่ยมชมพื้นที่และพิพิธภัณฑ์ได้ แต่ไม่ใช่สิทธิ์เข้าทุกอาคารหรือทุกประตู",
            "The 2025 visitor guidance welcomes the public to campus and museums; it does not grant access to every building or gate.",
          )}{" "}
          <a
            className="text-link"
            href="https://www.inter.chula.ac.th/wp-content/uploads/2025/01/Visit-Request-Form-2025.pdf"
            target="_blank"
            rel="noreferrer"
          >
            {t("อ่านต้นฉบับ", "Read source")} <ArrowUpRight size={13} />
          </a>
        </p>
        <p>
          {t(
            "GPS ใช้เมื่อคุณกดใกล้ฉัน ตำแหน่งไม่ถูกบันทึกหรือส่งไปยังเซิร์ฟเวอร์ และหยุดเมื่อซ่อนหน้าเว็บ",
            "GPS starts when you choose Near me. Your position is not saved or uploaded, and updates stop when this page is hidden.",
          )}
        </p>
        <div className="about-links">
          <a href="tel:022180000">
            <Phone size={16} />
            {t(
              "สอบถามศูนย์รักษาความปลอดภัย จุฬาฯ",
              "CU Security & Traffic Center",
            )}{" "}
            · 02-218-0000
          </a>
          <a
            href="https://www.chula.ac.th/en/life-at-cu/campus-safety/"
            target="_blank"
            rel="noreferrer"
          >
            {t("ข้อมูลติดต่อจากมหาวิทยาลัย", "Official security contact")}
            <ArrowUpRight size={14} />
          </a>
          <button
            className="secondary-button"
            onClick={() => setDark((x) => !x)}
          >
            {dark ? <Sun size={17} /> : <Moon size={17} />}{" "}
            {dark
              ? t("ใช้พื้นหลังสว่าง", "Use light mode")
              : t("ใช้พื้นหลังมืด", "Use dark mode")}
          </button>
        </div>
        <button
          className="primary-button"
          onClick={() => {
            about.current?.close();
            navigateView("quality");
          }}
        >
          {t("ดูคุณภาพข้อมูลและแหล่งที่มา", "Inspect data & sources")}
          <ArrowRight size={17} />
        </button>
      </dialog>
    </div>
  );
}
