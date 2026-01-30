import { useEffect } from "react";
import AppLayout from "../components/layout/AppLayout";
import CalendarBoard from "../components/board/CalendarBoard";

export default function Dashboard() {
  useEffect(() => {
    console.log("Dashboard mounted!");
  }, []);

  return (
    <AppLayout>
      <CalendarBoard />
    </AppLayout>
  );
}
