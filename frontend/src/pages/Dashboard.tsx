import { useEffect, useState } from "react";
import AppLayout from "../components/layout/AppLayout";
import CalendarBoard from "../components/board/CalendarBoard";

export default function Dashboard() {
  const [currentView, setCurrentView] = useState("My Work");
  const [projectId, setProjectId] = useState<string | null>(null);

  useEffect(() => {
    console.log("Dashboard mounted! Current view:", currentView);

    const handleViewChange = (event: any) => {
      const { view, projectId } = event.detail;
      console.log("View changed to:", view, projectId);
      setCurrentView(view);
      setProjectId(projectId || null);
    };

    window.addEventListener("viewChanged", handleViewChange);
    return () => window.removeEventListener("viewChanged", handleViewChange);
  }, []);

  // Show calendar only on My Work and Teams views
  const showCalendar = currentView === "My Work" || currentView === "Teams";
  
  console.log("Dashboard render - currentView:", currentView, "showCalendar:", showCalendar);

  return (
    <AppLayout>
      {showCalendar ? (
        <CalendarBoard />
      ) : (
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center", 
          height: "100%", 
          color: "#00ffff",
          fontSize: "18px",
          flexDirection: "column",
          gap: "16px"
        }}>
          <div style={{ fontSize: "48px" }}>📁</div>
          <div>Project view: {currentView}</div>
          <div style={{ fontSize: "14px", color: "#666" }}>
            {projectId ? `Project ID: ${projectId}` : "Select a project to view tasks"}
          </div>
        </div>
      )}
    </AppLayout>
  );
}
