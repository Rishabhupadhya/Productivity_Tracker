import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import AddTaskModal from "../task/AddTaskModal";
import UserMenu from "./UserMenu";
import Button from "../ui/Button";
import { 
  navigateToToday, 
  navigateToPreviousDay, 
  navigateToNextDay 
} from "../../hooks/useSelectedDate";
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

  const handleLogoClick = useCallback(() => {
    navigate('/dashboard');
  }, [navigate]);

  const handleDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
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
  }, [onDateChange]);

  const handleOpenModal = useCallback(() => {
    setOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setOpen(false);
  }, []);

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
            <div className="topbar-controls" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}>
              {/* Date Navigation */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px',
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-default)',
              }}>
                <button
                  onClick={() => navigateToPreviousDay()}
                  title="Previous Day"
                  style={{
                    padding: '8px 12px',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  ◀
                </button>

                <button
                  onClick={() => navigateToToday()}
                  title="Go to Today"
                  style={{
                    padding: '8px 16px',
                    background: 'var(--accent-primary)',
                    border: 'none',
                    color: '#000',
                    cursor: 'pointer',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '14px',
                    fontWeight: '600',
                    transition: 'opacity 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                >
                  Today
                </button>

                <button
                  onClick={() => navigateToNextDay()}
                  title="Next Day"
                  style={{
                    padding: '8px 12px',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  ▶
                </button>
              </div>

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

              <Button 
                onClick={handleOpenModal}
                className="add-task-btn"
                title="Add Task"
              >
                + Add Task
              </Button>
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
          <AddTaskModal onClose={handleCloseModal} />
        )}
      </AnimatePresence>
    </>
  );
}
