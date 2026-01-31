import { useState, useEffect } from "react";
import { useUser } from "../../contexts/UserContext";
import { updateSettings } from "../../services/profile.service";
import "./settings.css";

export default function SettingsModal({ onClose }: { onClose: () => void }) {
  const { user, refreshUser } = useUser();
  const [settings, setSettings] = useState<any>({
    weekStartDay: 1,
    timeFormat: "24h",
    showCurrentTimeline: true,
    enableUndoDelete: true,
    enableDragDrop: true,
    focusMode: false,
    taskReminders: true,
    dailySummary: false
  });
  
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (user?.settings) {
      setSettings(user.settings);
    }
  }, [user]);

  const handleToggle = (key: string) => {
    setSettings({ ...settings, [key]: !settings[key] });
  };

  const handleChange = (key: string, value: any) => {
    setSettings({ ...settings, [key]: value });
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      await updateSettings(settings);
      await refreshUser();
      setMessage("Settings saved successfully!");
      setTimeout(() => {
        setMessage("");
        onClose();
      }, 1500);
    } catch (error: any) {
      setMessage(error.response?.data?.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="settings-modal">
        <div className="settings-header">
          <h2>Settings</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {message && (
          <div className={`message ${message.includes("success") ? "success" : "error"}`}>
            {message}
          </div>
        )}

        <div className="settings-content">
          <section className="settings-section">
            <h3>📅 Calendar</h3>
            
            <div className="setting-item">
              <div className="setting-info">
                <label>Week starts on</label>
                <p>Choose which day your calendar week starts</p>
              </div>
              <select 
                value={settings.weekStartDay} 
                onChange={(e) => handleChange("weekStartDay", Number(e.target.value))}
              >
                <option value={0}>Sunday</option>
                <option value={1}>Monday</option>
              </select>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <label>Time format</label>
                <p>Display time in 12-hour or 24-hour format</p>
              </div>
              <select 
                value={settings.timeFormat} 
                onChange={(e) => handleChange("timeFormat", e.target.value)}
              >
                <option value="12h">12-hour</option>
                <option value="24h">24-hour</option>
              </select>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <label>Show current time line</label>
                <p>Display a line indicating the current time</p>
              </div>
              <label className="toggle">
                <input 
                  type="checkbox" 
                  checked={settings.showCurrentTimeline}
                  onChange={() => handleToggle("showCurrentTimeline")}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </section>

          <div className="divider"></div>

          <section className="settings-section">
            <h3>🎯 Productivity</h3>
            
            <div className="setting-item">
              <div className="setting-info">
                <label>Enable undo delete</label>
                <p>Allow undoing task deletions within 5 seconds</p>
              </div>
              <label className="toggle">
                <input 
                  type="checkbox" 
                  checked={settings.enableUndoDelete}
                  onChange={() => handleToggle("enableUndoDelete")}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <label>Enable drag & drop</label>
                <p>Drag tasks to reschedule them</p>
              </div>
              <label className="toggle">
                <input 
                  type="checkbox" 
                  checked={settings.enableDragDrop}
                  onChange={() => handleToggle("enableDragDrop")}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <label>Focus mode</label>
                <p>Hide tasks not scheduled for today</p>
              </div>
              <label className="toggle">
                <input 
                  type="checkbox" 
                  checked={settings.focusMode}
                  onChange={() => handleToggle("focusMode")}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </section>

          <div className="divider"></div>

          <section className="settings-section">
            <h3>🔔 Notifications</h3>
            
            <div className="setting-item">
              <div className="setting-info">
                <label>Task reminders</label>
                <p>Receive reminders for upcoming tasks</p>
              </div>
              <label className="toggle">
                <input 
                  type="checkbox" 
                  checked={settings.taskReminders}
                  onChange={() => handleToggle("taskReminders")}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <label>Daily summary</label>
                <p>Get a summary of your tasks each morning</p>
              </div>
              <label className="toggle">
                <input 
                  type="checkbox" 
                  checked={settings.dailySummary}
                  onChange={() => handleToggle("dailySummary")}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </section>
        </div>

        <div className="settings-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>
    </div>
  );
}
