import { useCurrentTime } from "../../hooks/useCurrentTime";
import { minutesFromStart } from "../../utils/time";
import "./currentTime.css";

export default function CurrentTimeLine() {
  const now = useCurrentTime();
  const minutes = minutesFromStart(now);

  if (minutes < 0 || minutes > 9 * 60) return null;

  return (
    <div
      className="current-time-line"
      style={{ top: `${minutes}px` }}
    >
      <span className="dot" />
    </div>
  );
}
