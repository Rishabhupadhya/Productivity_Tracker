import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../contexts/UserContext";
import ProfileModal from "../profile/ProfileModal";
import SettingsModal from "../settings/SettingsModal";
import Avatar from "../ui/Avatar";
import { env } from "../../config/env";
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

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
            color: "#00ffff", 
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}>
            <span style={{ color: "#888" }}>Level</span>
            <span>{user.level}</span>
            {user.xp !== undefined && (
              <span style={{ fontSize: "12px", color: "#666" }}>({user.xp} XP)</span>
            )}
          </div>
        )}
        
        <Avatar
          src={user.avatar ? `${env.API_URL.replace('/api', '')}${user.avatar}` : null}
          name={user.name}
          size="medium"
          onClick={() => setOpen(!open)}
        />

        {open && (
          <div className="user-dropdown">
            <div className="user-info">
              <Avatar
                src={user.avatar ? `${env.API_URL.replace('/api', '')}${user.avatar}` : null}
                name={user.name}
                size="large"
              />
              <div className="user-details">
                <div className="user-name">{user.name}</div>
                <div className="user-email">{user.email}</div>
                {user.level && user.level > 1 && (
                  <div style={{ fontSize: "12px", color: "#00ffff", marginTop: "4px" }}>
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

            <div className="menu-divider"></div>

            <button className="menu-item logout" onClick={handleLogout}>
              <span>🚪</span> Logout
            </button>
          </div>
        )}
      </div>

      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </>
  );
}
