import { useEffect, useMemo, useRef, useState } from "react";
import { Search, MapPin } from "lucide-react";
import { useCopy } from "../lib/i18n";
import {
  coordinatePlace,
  searchLocalPlaces,
  searchOnlinePlaces,
} from "../lib/place-search";
import type { StartingPoint } from "../lib/origins";
export default function StartingPointSearch({
  onChoose,
}: {
  onChoose: (place: StartingPoint) => void;
}) {
  const { lang, t } = useCopy();
  const [query, setQuery] = useState("");
  const [remote, setRemote] = useState<StartingPoint[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const request = useRef<AbortController | null>(null);
  const sequence = useRef(0);
  const nearby = useMemo(() => searchLocalPlaces(query), [query]);
  useEffect(
    () => () => {
      sequence.current++;
      request.current?.abort();
    },
    [],
  );
  const coordinate = coordinatePlace(query);
  const search = async () => {
    if (coordinate) {
      onChoose(coordinate);
      return;
    }
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    const current = ++sequence.current;
    setLoading(true);
    setError(false);
    const timeout = window.setTimeout(() => controller.abort(), 12000);
    try {
      const results = await searchOnlinePlaces(query, lang, controller.signal);
      if (current === sequence.current) setRemote(results);
    } catch {
      if (current === sequence.current) setError(true);
    } finally {
      window.clearTimeout(timeout);
      if (current === sequence.current) setLoading(false);
    }
  };
  const results = remote === null ? nearby : remote;
  return (
    <div className="starting-point-search">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void search();
        }}
      >
        <label className="origin-search-field">
          <Search size={16} />
          <input
            aria-label={t("พิมพ์จุดเริ่มต้น", "Type a starting point")}
            placeholder={t(
              "ชื่อสถานที่ หรือ 13.738, 100.530",
              "Place name or 13.738, 100.530",
            )}
            value={query}
            maxLength={140}
            onChange={(e) => {
              request.current?.abort();
              sequence.current++;
              setLoading(false);
              setQuery(e.target.value);
              setRemote(null);
              setError(false);
            }}
          />
        </label>
        <button
          className="origin-online-search"
          disabled={loading || query.trim().length < 2}
        >
          {loading
            ? t("กำลังค้นหา…", "Searching…")
            : coordinate
              ? t("ใช้พิกัดนี้", "Use coordinates")
              : t("ค้นหาออนไลน์", "Search online")}
        </button>
      </form>
      {error && (
        <p className="origin-search-status" role="status">
          {t(
            "ค้นหาออนไลน์ไม่สำเร็จ ลองอีกครั้ง หรือเลือกสถานที่ในพื้นที่/กรอกพิกัด",
            "Online search unavailable. Retry, choose a local place, or enter coordinates.",
          )}
        </p>
      )}
      {query.length >= 2 && (
        <div
          className="origin-results"
          aria-label={t("ผลค้นหาจุดเริ่มต้น", "Starting point results")}
        >
          {results.map((p) => (
            <button type="button" key={p.id} onClick={() => onChoose(p)}>
              <MapPin size={15} />
              <span>{lang === "th" ? p.name : p.nameEn}</span>
            </button>
          ))}
          {!results.length && !loading && !error && (
            <p>
              {t(
                "ไม่พบในพื้นที่ ลองค้นหาออนไลน์หรือพิมพ์พิกัด",
                "No local match. Search online or enter coordinates.",
              )}
            </p>
          )}
        </div>
      )}
      <small className="origin-search-attribution">
        {t(
          "ค้นหาออนไลน์จะส่งคำค้นไปยัง Photon · ",
          "Online search sends your query to Photon · ",
        )}
        {t("ในพื้นที่: OSM · ออนไลน์:", "Local: OSM · Online:")}{" "}
        <a href="https://photon.komoot.io/" target="_blank" rel="noreferrer">
          Photon
        </a>{" "}
        ·{" "}
        <a
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noreferrer"
        >
          © OpenStreetMap
        </a>
      </small>
    </div>
  );
}
