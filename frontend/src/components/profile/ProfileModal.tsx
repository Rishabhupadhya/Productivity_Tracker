import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useUser } from "../../contexts/UserContext";
import { updateProfile, changePassword, uploadAvatar } from "../../services/profile.service";
import { env } from "../../config/env";
import { modalBackdropVariants, modalContentVariants } from "../../utils/motionVariants";
import "./profile.css";

export default function ProfileModal({ onClose }: { onClose: () => void }) {
  const { user, refreshUser } = useUser();
  
  // Don't render if user is not loaded
  if (!user) {
    return null;
  }
  const [name, setName] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  const [workStartTime, setWorkStartTime] = useState("09:00");
  const [workEndTime, setWorkEndTime] = useState("18:00");
  const [defaultDuration, setDefaultDuration] = useState("1h");
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      console.log('User data in ProfileModal:', user);
      console.log('Team role:', (user as any).teamRole);
      setName(user.name || '');
      setTimezone((user as any).timezone || "UTC");
      setWorkStartTime((user as any).workingHours?.start || "09:00");
      setWorkEndTime((user as any).workingHours?.end || "18:00");
      setDefaultDuration((user as any).defaultTaskDuration || "1h");
      if (user.avatar && user.avatar.length > 1) {
        setAvatarPreview(`${env.BASE_URL}${user.avatar}`);
      }
    }
  }, [user]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setMessage("Please select an image file");
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage("Image size should be less than 5MB");
      return;
    }

    // Preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload
    setUploading(true);
    setMessage("");
    try {
      await uploadAvatar(file);
      await refreshUser();
      setMessage("Avatar updated successfully!");
      
      // Dispatch event to update avatar across the app
      window.dispatchEvent(new CustomEvent('avatarUpdated'));
      
      setTimeout(() => setMessage(""), 3000);
    } catch (error: any) {
      setMessage(error.response?.data?.message || "Failed to upload avatar");
      // Revert preview on error
      if (user?.avatar && user.avatar.length > 1) {
        setAvatarPreview(`${env.BASE_URL}${user.avatar}`);
      } else {
        setAvatarPreview("");
      }
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setMessage("");
    try {
      const profileData = {
        name,
        timezone,
        workingHours: { start: workStartTime, end: workEndTime },
        defaultTaskDuration: defaultDuration
      };
      console.log('Saving profile with data:', profileData);
      
      const result = await updateProfile(profileData);
      console.log('Profile update result:', result);
      
      await refreshUser();
      setMessage("Profile updated successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error: any) {
      console.error('Profile update error:', error);
      setMessage(error.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      setMessage("Password must be at least 6 characters");
      return;
    }

    setSaving(true);
    setMessage("");
    try {
      await changePassword(currentPassword, newPassword);
      setMessage("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setMessage(""), 3000);
    } catch (error: any) {
      setMessage(error.response?.data?.message || "Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  /**
   * Avatar Fallback System:
   * - avatarPreview: Contains either uploaded image data URL or existing avatar URL from server
   * - If avatarPreview exists → render as background image
   * - If no avatarPreview → render first letter of user.name (uppercase)
   * - If no name → render "?" as fallback
   * - Avatar is fully clickable to trigger file upload
   * - Overlay shows camera icon on hover for better UX
   */

  return (
    <motion.div 
      className="modal-backdrop"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={modalBackdropVariants}
      onClick={onClose}
    >
      <motion.div 
        className="profile-modal"
        variants={modalContentVariants}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="profile-header">
          <h2>Profile</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {message && (
          <div className={`message ${message.includes("success") ? "success" : "error"}`}>
            {message}
          </div>
        )}

        <div className="profile-content">
          <section className="profile-section">
            <div className="avatar-section">
              <div className="avatar-container">
                <div 
                  className="avatar-display clickable" 
                  onClick={handleAvatarClick}
                  style={avatarPreview ? { 
                    backgroundImage: `url(${avatarPreview})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  } : {}}
                >
                  {!avatarPreview && (user?.name?.charAt(0)?.toUpperCase() || '?')}
                  <div className="avatar-overlay">
                    {uploading ? "⌛" : "📷"}
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
              </div>
              <div className="avatar-info">
                <h3>{user?.name}</h3>
                <p>{user?.email}</p>
                {(user as any)?.teamRole && (
                  <p className="user-role">
                    {(user as any).teamRole === 'admin' ? '👑 Admin' : '👤 Member'}
                  </p>
                )}
                <p className="avatar-hint">Click avatar to change photo</p>
              </div>
            </div>
          </section>

          <div className="divider"></div>

          <section className="profile-section">
            <h3>Personal Information</h3>
            
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={user.email}
                disabled
                className="disabled"
              />
            </div>

            <div className="form-group">
              <label>Timezone 🌍</label>
              <select value={timezone} onChange={(e) => setTimezone(e.target.value)}>
                <option value="UTC">UTC (GMT+0)</option>
                <option value="America/New_York">Eastern Time (GMT-5)</option>
                <option value="America/Chicago">Central Time (GMT-6)</option>
                <option value="America/Denver">Mountain Time (GMT-7)</option>
                <option value="America/Los_Angeles">Pacific Time (GMT-8)</option>
                <option value="Europe/London">London (GMT+0)</option>
                <option value="Europe/Paris">Paris (GMT+1)</option>
                <option value="Asia/Tokyo">Tokyo (GMT+9)</option>
                <option value="Asia/Dubai">Dubai (GMT+4)</option>
                <option value="Asia/Kolkata">India (GMT+5:30)</option>
              </select>
            </div>
          </section>

          <div className="divider"></div>

          <section className="profile-section">
            <h3>Work Preferences</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label>Working Hours Start</label>
                <input
                  type="time"
                  value={workStartTime}
                  onChange={(e) => setWorkStartTime(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Working Hours End</label>
                <input
                  type="time"
                  value={workEndTime}
                  onChange={(e) => setWorkEndTime(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Default Task Duration</label>
              <select value={defaultDuration} onChange={(e) => setDefaultDuration(e.target.value)}>
                <option value="30m">30 minutes</option>
                <option value="1h">1 hour</option>
                <option value="1h 30m">1 hour 30 minutes</option>
                <option value="2h">2 hours</option>
              </select>
            </div>

            <button 
              className="btn-primary" 
              onClick={handleSaveProfile}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Profile"}
            </button>
          </section>

          <div className="divider"></div>

          <section className="profile-section">
            <h3>Security</h3>
            
            <div className="form-group">
              <label>Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
              />
            </div>

            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </div>

            <div className="form-group">
              <label>Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>

            <button 
              className="btn-secondary" 
              onClick={handleChangePassword}
              disabled={saving || !currentPassword || !newPassword}
            >
              {saving ? "Changing..." : "Change Password"}
            </button>
          </section>
        </div>
      </motion.div>
    </motion.div>
  );
}
