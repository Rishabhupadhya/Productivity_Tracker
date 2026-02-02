import { useState } from "react";
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
};

export default function Topbar({ showTaskControls = true, pageTitle, onMenuClick, isMobile = false }: TopbarProps) {
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setSelectedDate(newDate);

    window.dispatchEvent(
      new CustomEvent("date-change", {
        detail: newDate,
      })
    );
  };

  return (
    <>
      <header className="topbar">
        {/* LEFT SECTION - Branding */}
        <div className="left">
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

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-lg)',
          }}>
            <div className="app-title">
              <h1 style={{
                fontSize: 'var(--text-2xl)',
                fontWeight: 'var(--font-bold)',
                color: 'var(--text-primary)',
                margin: 0,
                lineHeight: 1,
              }}>
                Momentum
              </h1>
              <p style={{
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
                <div style={{
                  width: '1px',
                  height: '32px',
                  background: 'var(--border-default)',
                }} />
                <span style={{
                  fontSize: 'var(--text-lg)',
                  color: 'var(--text-secondary)',
                  fontWeight: 'var(--font-medium)',
                }}>
                  {pageTitle}
                </span>
              </>
            )}
          </div>

          {showTaskControls && (
            <div style={{ display: 'flex', gap: 'var(--space-md)', marginLeft: 'auto' }}>
              <Button onClick={() => setOpen(true)}>
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
        </div>

        {/* RIGHT SECTION */}
        <div className="right">
          <UserMenu />
        </div>
      </header>

      {/* ADD TASK MODAL */}
      <AnimatePresence>
        {open && showTaskControls && (
          <AddTaskModal onClose={() => setOpen(false)} />
        )}
      </AnimatePresence>
    </>
  );
}
