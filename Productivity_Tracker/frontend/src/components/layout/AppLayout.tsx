import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import "./layout.css";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentView, setCurrentView] = useState("My Work");

  useEffect(() => {
    const handleViewChange = (event: any) => {
      const { view } = event.detail;
      setCurrentView(view);
    };

    window.addEventListener("viewChanged", handleViewChange);
    return () => window.removeEventListener("viewChanged", handleViewChange);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  // Show task controls only on My Work and Teams views, and not on tracker routes
  const isTrackerRoute = ["/finance", "/goals", "/habits"].includes(location.pathname);
  const showTaskControls = !isTrackerRoute && (currentView === "My Work" || currentView === "Teams");

  return (
    <div className="app-layout">
      <div style={{ 
        width: sidebarCollapsed ? "60px" : "250px", 
        transition: "width 0.3s ease",
        position: "relative"
      }}>
        <Sidebar collapsed={sidebarCollapsed} />
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          style={{
            position: "absolute",
            right: "-15px",
            top: "20px",
            width: "30px",
            height: "30px",
            borderradius: "50%",
            background: "#00ffff",
            border: "none",
            color: "#000",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "16px",
            fontWeight: "bold",
            zIndex: 1000,
            boxShadow: "0 2px 8px rgba(0, 255, 255, 0.3)"
          }}
        >
          {sidebarCollapsed ? "›" : "‹"}
        </button>
      </div>
      <div className="main-content">
        <Topbar onLogout={handleLogout} showTaskControls={showTaskControls} />
        <div className="content">{children}</div>
      </div>
    </div>
  );
}
