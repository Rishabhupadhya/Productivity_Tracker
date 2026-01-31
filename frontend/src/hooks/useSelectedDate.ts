import { useEffect, useState } from "react";

export function useSelectedDate() {
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    const handler = (e: any) => {
      setDate(new Date(e.detail));
    };

    window.addEventListener("date-change", handler);
    return () =>
      window.removeEventListener("date-change", handler);
  }, []);

  return date;
}
