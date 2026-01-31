import { useState, useEffect, useRef } from "react";
import { getCurrentUser } from "../../services/team.service";
import { useNavigate } from "react-router-dom";
import ProfileModal from "../profile/ProfileModal";
import SettingsModal from "../settings/SettingsModal";
import "./userMenu.css";

export default function UserMenu() {
  const [user, setUser] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    getCurrentUser().then(setUser).catch(console.error);
  }, []);

  // Listen for avatar updates from ProfileModal
  useEffect(() => {
    const handleAvatarUpdate = () => {
      getCurrentUser().then(setUser).catch(console.error);
    };
    
    window.addEventListener('avatarUpdated', handleAvatarUpdate);
    return () => window.removeEventListener('avatarUpdated', handleAvatarUpdate);
  }, []);

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
    localStorage.removeItem("token");
    navigate("/login");
  };

  if (!user) return null;

  return (
    <>
      <div className="user-menu" ref={menuRef}>
        <div 
          className="user-avatar" 
          onClick={() => setOpen(!open)}
          style={user.avatar ? {
            backgroundImage: `url(http://localhost:5001${user.avatar})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          } : {}}
        >
          {!user.avatar && user.name.charAt(0).toUpperCase()}
        </div>

        {open && (
          <div className="user-dropdown">
            <div className="user-info">
              <div 
                className="user-avatar-large"
                style={user.avatar ? {
                  backgroundImage: `url(http://localhost:5001${user.avatar})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                } : {}}
              >
                {!user.avatar && user.name.charAt(0).toUpperCase()}
              </div>
              <div className="user-details">
                <div className="user-name">{user.name}</div>
                <div className="user-email">{user.email}</div>
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
