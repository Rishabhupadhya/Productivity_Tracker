import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import Footer from "./Footer";
import FloatingActionButton from "../ui/FloatingActionButton";
import AddTaskModal from "../task/AddTaskModal";
import { pageVariants } from "../../utils/motionVariants";
import "./layout.css";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentView, setCurrentView] = useState("My Work");
  const [showTaskModal, setShowTaskModal] = useState(false);

  // Detect mobile screen
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
      {/* Mobile Overlay */}
      {isMobile && mobileMenuOpen && (
        <div 
          className="mobile-overlay"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div 
        className={`sidebar-wrapper ${isMobile ? 'mobile' : ''} ${mobileMenuOpen ? 'open' : ''}`}
        style={{ 
          width: isMobile ? '280px' : (sidebarCollapsed ? "60px" : "250px"), 
          transition: "width 0.3s ease"
        }}
      >
        <Sidebar 
          collapsed={sidebarCollapsed && !isMobile} 
          onNavigate={() => setMobileMenuOpen(false)}
        />
        {!isMobile && (
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="sidebar-toggle-btn"
          >
            {sidebarCollapsed ? "›" : "‹"}
          </button>
        )}
      </div>

      <div className="main-content">
        <Topbar 
          onLogout={handleLogout} 
          showTaskControls={showTaskControls}
          onMenuClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          isMobile={isMobile}
        />
        <motion.div 
          className="content"
          key={location.pathname}
          initial="initial"
          animate="animate"
          exit="exit"
          variants={pageVariants}
        >
          {children}
        </motion.div>
        <Footer />

        {/* Floating Action Button for mobile - Add Task */}
        {showTaskControls && isMobile && (
          <FloatingActionButton 
            onClick={() => setShowTaskModal(true)}
            icon="+"
            label="Add Task"
          />
        )}

        {/* Task Modal */}
        <AnimatePresence>
          {showTaskModal && (
            <AddTaskModal onClose={() => setShowTaskModal(false)} />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
