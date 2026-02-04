import { useState, useEffect } from "react";
import { formatDate } from "../../utils/date";
import "./MobileDateSelector.css";

interface MobileDateSelectorProps {
  value?: string;
  onChange?: (date: string) => void;
}

export default function MobileDateSelector({ value, onChange }: MobileDateSelectorProps) {
  const [selectedDate, setSelectedDate] = useState(() => {
    if (value && typeof value === 'string') return value;
    const today = new Date();
    return formatDate(today);
  });

  useEffect(() => {
    if (value && typeof value === 'string') {
      setSelectedDate(value);
    }
  }, [value]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setSelectedDate(newDate);

    if (onChange) {
      onChange(newDate);
    }

    window.dispatchEvent(
      new CustomEvent("date-change", {
        detail: newDate,
      })
    );
  };

  const changeDay = (offset: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + offset);
    const newDate = formatDate(current);
    setSelectedDate(newDate);

    if (onChange) {
      onChange(newDate);
    }

    window.dispatchEvent(
      new CustomEvent("date-change", {
        detail: newDate,
      })
    );
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
        <span className="date-label">{formatDisplayDate(selectedDate)}</span>
        <input
          type="date"
          className="date-input-hidden"
          value={selectedDate}
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
