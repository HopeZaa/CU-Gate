import { useState } from "react";
import { Pause, Play } from "lucide-react";
import { useCopy } from "../lib/i18n";

export default function PedestrianNotice() {
  const { t } = useCopy();
  const [paused, setPaused] = useState(false);
  const message = t(
    "ประตูทางเท้าอยู่ติดกับประตูหลัก โปรดระวังเวลาเปิดปิด",
    "Pedestrian gates are beside the main gates. Please check opening and closing times.",
  );
  return (
    <aside
      className="pedestrian-notice"
      data-paused={paused}
      aria-label={t("ข้อควรระวังประตูทางเท้า", "Pedestrian gate notice")}
    >
      <span className="sr-only">{message}</span>
      <div className="notice-marquee" aria-hidden="true">
        <span className="notice-group">
          <span>{message}</span>
          <span>{message}</span>
        </span>
        <span className="notice-group">
          <span>{message}</span>
          <span>{message}</span>
        </span>
      </div>
      <button
        className="notice-pause"
        onClick={() => setPaused((p) => !p)}
        aria-pressed={paused}
        aria-label={
          paused
            ? t("เลื่อนข้อความต่อ", "Resume scrolling notice")
            : t("พักข้อความเลื่อน", "Pause scrolling notice")
        }
        title={
          paused
            ? t("เลื่อนข้อความต่อ", "Resume scrolling notice")
            : t("พักข้อความเลื่อน", "Pause scrolling notice")
        }
      >
        {paused ? <Play size={14} /> : <Pause size={14} />}
      </button>
    </aside>
  );
}
