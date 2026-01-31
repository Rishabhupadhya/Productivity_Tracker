import { useEffect, useState } from "react";

export function useSelectedDate() {
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    const handler = (e: any) => {
      console.log('Date change event received:', e.detail);
      const newDate = new Date(e.detail);
      console.log('Setting date to:', newDate);
      setDate(newDate);
    };

    window.addEventListener("date-change", handler);
    return () =>
      window.removeEventListener("date-change", handler);
  }, []);

  return date;
}
