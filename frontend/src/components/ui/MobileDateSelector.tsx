import { formatDate } from "../../utils/date";
import "./MobileDateSelector.css";
import { useDate } from "../../contexts/DateContext";

interface MobileDateSelectorProps {
  value?: string;
  onChange?: (date: string) => void;
}

export default function MobileDateSelector({ value, onChange }: MobileDateSelectorProps) {
  const { selectedDate, setSelectedDate } = useDate();

  // Use formatting helper
  const dateValue = value || formatDate(selectedDate);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDateStr = e.target.value;
    if (!newDateStr) return;

    const [y, m, d] = newDateStr.split('-').map(Number);
    const newDate = new Date(y, m - 1, d);
    setSelectedDate(newDate);

    if (onChange) {
      onChange(newDateStr);
    }
  };

  const changeDay = (offset: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + offset);
    setSelectedDate(current);

    if (onChange) {
      onChange(formatDate(current));
    }
  };

  const formatDisplayDate = (dateStr: string | undefined) => {
    if (!dateStr || typeof dateStr !== 'string' || dateStr === 'Invalid Date') {
      const today = new Date();
      dateStr = formatDate(today);
    }

    const [year, month, day] = dateStr.split('-').map(Number);
    if (!year || !month || !day) {
      return 'Today';
    }

    const date = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const selected = new Date(year, month - 1, day);
    selected.setHours(0, 0, 0, 0);

    if (selected.getTime() === today.getTime()) {
      return "Today";
    }

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (selected.getTime() === tomorrow.getTime()) {
      return "Tomorrow";
    }

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (selected.getTime() === yesterday.getTime()) {
      return "Yesterday";
    }

    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric"
    });
  };

  return (
    <div className="mobile-date-selector">
      <button
        className="date-nav-btn"
        onClick={() => changeDay(-1)}
        aria-label="Previous day"
      >
        ‹
      </button>

      <div className="date-display">
        <span className="date-label">{formatDisplayDate(formatDate(selectedDate))}</span>
        <input
          type="date"
          className="date-input-hidden"
          value={dateValue}
          onChange={handleDateChange}
        />
      </div>

      <button
        className="date-nav-btn"
        onClick={() => changeDay(1)}
        aria-label="Next day"
      >
        ›
      </button>
    </div>
  );
}
