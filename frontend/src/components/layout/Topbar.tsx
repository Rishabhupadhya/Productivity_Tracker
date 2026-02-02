import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import AddTaskModal from "../task/AddTaskModal";
import UserMenu from "./UserMenu";
import Button from "../ui/Button";
import "./topbar.css";

type TopbarProps = {
  showTaskControls?: boolean;
  pageTitle?: string;
  onMenuClick?: () => void;
  isMobile?: boolean;
  onLogout?: () => void;
  onDateChange?: (date: string) => void;
  selectedDate?: string;
};

export default function Topbar({ 
  showTaskControls = true, 
  pageTitle, 
  onMenuClick, 
  isMobile = false,
  onDateChange,
  selectedDate: externalSelectedDate 
}: TopbarProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 767);
  const [internalSelectedDate, setInternalSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });

  const selectedDate = externalSelectedDate || internalSelectedDate;

  // Detect screen size changes for responsive button display
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth <= 767);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogoClick = () => {
    navigate('/dashboard');
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setInternalSelectedDate(newDate);

    if (onDateChange) {
      onDateChange(newDate);
    }

    window.dispatchEvent(
      new CustomEvent("date-change", {
        detail: newDate,
      })
    );
  };

  return (
    <>
      <div className="topbar-wrapper">
        <header className="topbar">
          {/* LEFT SECTION - Branding and page title */}
          <div className="topbar-left">
            {isMobile && (
              <button 
                onClick={onMenuClick}
                className="hamburger-menu"
                aria-label="Toggle menu"
              >
                <span></span>
                <span></span>
                <span></span>
              </button>
            )}

            <div 
              className="app-title" 
              onClick={handleLogoClick}
              style={{
                cursor: 'pointer',
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              <h1 style={{
                fontSize: 'var(--text-2xl)',
                fontWeight: 'var(--font-bold)',
                color: 'var(--text-primary)',
                margin: 0,
                lineHeight: 1,
              }}>
                Momentum
              </h1>
              <p className="app-subtitle" style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--text-muted)',
                margin: 0,
                lineHeight: 1,
                letterSpacing: '0.05em',
              }}>
                Consistency that compounds
              </p>
            </div>

            {pageTitle && (
              <>
                <div className="page-divider" style={{
                  width: '1px',
                  height: '32px',
                  background: 'var(--border-default)',
                }} />
                <span className="page-title-text" style={{
                  fontSize: 'var(--text-lg)',
                  color: 'var(--text-secondary)',
                  fontWeight: 'var(--font-medium)',
                }}>
                  {pageTitle}
                </span>
              </>
            )}
          </div>

          {/* CENTER SECTION - Desktop task controls only */}
          {showTaskControls && !isMobileView && (
            <div className="topbar-controls">
              <Button 
                onClick={() => setOpen(true)}
                className="add-task-btn"
                title="Add Task"
              >
                + Add Task
              </Button>

              <input
                type="date"
                className="date-input"
                value={selectedDate}
                onChange={handleDateChange}
                style={{
                  padding: '10px 16px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  fontSize: 'var(--text-sm)',
                  cursor: 'pointer',
                }}
              />
            </div>
          )}

          {/* RIGHT SECTION - Profile */}
          <div className="topbar-right">
            <UserMenu />
          </div>
        </header>

        {/* MOBILE: No secondary row - date picker moved to content */}
      </div>

      {/* ADD TASK MODAL */}
      <AnimatePresence>
        {open && showTaskControls && (
          <AddTaskModal onClose={() => setOpen(false)} />
        )}
      </AnimatePresence>
    </>
  );
}
