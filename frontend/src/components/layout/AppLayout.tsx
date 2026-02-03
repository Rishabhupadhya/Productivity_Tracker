import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "../../contexts/UserContext";
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
  const { loading: userLoading, user } = useUser();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentView, setCurrentView] = useState("My Work");
  const [showTaskModal, setShowTaskModal] = useState(false);

  // Detect mobile screen
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  // Redirect to login if not authenticated after loading
  useEffect(() => {
    if (!userLoading && !user) {
      console.log('No user after loading - redirecting to login');
      navigate('/login', { replace: true });
    }
  }, [userLoading, user, navigate]);

  // Show loading state while user context is initializing
  if (userLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: 'var(--bg-app)',
        color: 'var(--text-secondary)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '16px' }}>⏳</div>
          <div>Loading...</div>
        </div>
      </div>
    );
  }

  // If not loading but no user, show message (redirect will happen via useEffect above)
  if (!user) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: 'var(--bg-app)',
        color: 'var(--text-secondary)',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{ fontSize: '24px' }}>🔐</div>
        <div>Redirecting to login...</div>
      </div>
    );
  }

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

  const handleLogout = useCallback(() => {
    localStorage.removeItem("token");
    navigate("/login");
  }, [navigate]);

  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen(prev => !prev);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed(prev => !prev);
  }, []);

  const handleShowTaskModal = useCallback(() => {
    setShowTaskModal(true);
  }, []);

  const handleCloseTaskModal = useCallback(() => {
    setShowTaskModal(false);
  }, []);

  // Show task controls only on My Work and Teams views, and not on tracker routes
  const isTrackerRoute = useMemo(() => 
    ['/finance', '/goals', '/habits'].includes(location.pathname),
    [location.pathname]
  );
  
  const showTaskControls = useMemo(() => 
    !isTrackerRoute && (currentView === "My Work" || currentView === "Teams"),
    [isTrackerRoute, currentView]
  );

  // Show loading state while user context is initializing
  if (userLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: 'var(--bg-app)',
        color: 'var(--text-secondary)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '16px' }}>⏳</div>
          <div>Loading...</div>
        </div>
      </div>
    );
  }

  // If not loading but no user, redirect to login
  if (!user) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: 'var(--bg-app)',
        color: 'var(--text-secondary)',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{ fontSize: '24px' }}>🔐</div>
        <div>Redirecting to login...</div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      {/* Mobile Overlay */}
      {isMobile && mobileMenuOpen && (
        <div 
          className="mobile-overlay"
          onClick={closeMobileMenu}
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
          onNavigate={closeMobileMenu}
        />
        {!isMobile && (
          <button
            onClick={toggleSidebar}
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
          onMenuClick={toggleMobileMenu}
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
            onClick={handleShowTaskModal}
            icon="+"
            label="Add Task"
          />
        )}

        {/* Task Modal */}
        <AnimatePresence>
          {showTaskModal && (
            <AddTaskModal onClose={handleCloseTaskModal} />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
