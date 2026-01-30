import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import "./layout.css";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Topbar onLogout={handleLogout} />
        <div className="content">{children}</div>
      </div>
    </div>
  );
}
