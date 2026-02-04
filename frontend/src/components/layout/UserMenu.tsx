import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "../../contexts/UserContext";
import ProfileModal from "../profile/ProfileModal";
import SettingsModal from "../settings/SettingsModal";
import Avatar from "../ui/Avatar";
import { dropdownVariants } from "../../utils/motionVariants";
import { getAvatarUrl } from "../../utils/avatar";
import "./userMenu.css";

export default function UserMenu() {
  const [open, setOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user, logout, refreshUser } = useUser();

  // Listen for avatar updates from ProfileModal
  useEffect(() => {
    const handleAvatarUpdate = () => {
      refreshUser();
    };

    window.addEventListener('avatarUpdated', handleAvatarUpdate);
    return () => window.removeEventListener('avatarUpdated', handleAvatarUpdate);
  }, [refreshUser]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("keydown", handleEscape);
      };
    }
  }, [open]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (!user) return null;

  /**
   * Avatar Fallback Logic:
   * 1. If user.avatar exists → display profile image as background
   * 2. If no avatar → display first letter of user.name (uppercase)
   * 3. If no name → display "?" as safe fallback
   * 
   * The entire avatar container is clickable to open the dropdown menu.
   * CSS ensures content is centered using display: grid + place-items: center
   */

  return (
    <>
      <div className="user-menu" ref={menuRef}>
        {/* Show XP and Level */}
        {user.level && user.level > 1 && (
          <div style={{
            marginRight: "12px",
            fontSize: "14px",
            color: "var(--accent)",
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}>
            <span style={{ color: "var(--text-secondary)" }}>Level</span>
            <span>{user.level}</span>
            {user.xp !== undefined && (
              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>({user.xp} XP)</span>
            )}
          </div>
        )}

        <Avatar
          src={getAvatarUrl(user.avatar)}
          name={user?.name || 'User'}
          size="medium"
          onClick={() => setOpen(!open)}
        />

        <AnimatePresence>
          {open && (
            <motion.div
              className="user-dropdown"
              initial="initial"
              animate="animate"
              exit="exit"
              variants={dropdownVariants}
            >
              <div className="user-info">
                <Avatar
                  src={getAvatarUrl(user.avatar)}
                  name={user?.name || 'User'}
                  size="large"
                />
                <div className="user-details">
                  <div className="user-name">{user?.name || 'User'}</div>
                  <div className="user-email">{user.email}</div>
                  {user.level && user.level > 1 && (
                    <div style={{ fontSize: "12px", color: "var(--accent)", marginTop: "4px" }}>
                      Level {user.level} • {user.xp} XP
                    </div>
                  )}
                </div>
              </div>

              <div className="menu-divider"></div>

              <button className="menu-item" onClick={() => { setOpen(false); setShowProfile(true); }}>
                <span>👤</span> Profile
              </button>
              <button className="menu-item" onClick={() => { setOpen(false); setShowSettings(true); }}>
                <span>⚙️</span> Settings
              </button>

              {user.settings?.userType && (
                <div className="menu-item" style={{
                  cursor: 'default',
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                  padding: '8px 16px'
                }}>
                  Role: <span style={{ color: 'var(--accent)', marginLeft: '4px' }}>{user.settings.userType}</span>
                </div>
              )}

              <div className="menu-divider"></div>

              <button className="menu-item logout" onClick={handleLogout}>
                <span>🚪</span> Logout
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
      </AnimatePresence>

      <AnimatePresence>
        {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      </AnimatePresence>
    </>
  );
}
