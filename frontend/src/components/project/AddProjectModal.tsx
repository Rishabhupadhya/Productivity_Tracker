import { useState } from "react";

interface AddProjectModalProps {
  onClose: () => void;
  onAdd: (name: string, color: string, icon: string, description: string, notes: string) => void;
}

const ICONS = ["📁", "💼", "🚀", "🎯", "⚡", "🔥", "✨", "🎨", "📊", "💡", "🛠️", "📱", "💻", "🌟", "🎪"];
const COLORS = ["#00ffff", "#ff00ff", "#ffff00", "#00ff00", "#ff0000", "#0000ff", "#ff6600", "#9900ff", "#00ccff", "#ff3399"];

export default function AddProjectModal({ onClose, onAdd }: AddProjectModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedColor, setSelectedColor] = useState("#00ffff");
  const [selectedIcon, setSelectedIcon] = useState("📁");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd(name, selectedColor, selectedIcon, description, notes);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(0, 0, 0, 0.8)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000
    }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#1a1a1a",
          borderRadius: "12px",
          border: "1px solid #00ffff",
          maxWidth: "450px",
          width: "95%",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)"
        }}
      >
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #333" }}>
          <h2 style={{ color: "#00ffff", margin: 0, fontSize: "20px" }}>Add New Project</h2>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
          <div className="modal-scroll-area" style={{
            padding: "24px",
            overflowY: "auto",
            flex: 1,
            WebkitOverflowScrolling: "touch"
          }}>
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", color: "#00ffff", marginBottom: "8px", fontSize: "14px", fontWeight: "500" }}>
                Project Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter project name"
                autoFocus
                style={{
                  width: "100%",
                  padding: "12px",
                  background: "#0a0a0a",
                  border: "1px solid #333",
                  borderRadius: "8px",
                  color: "#fff",
                  fontSize: "16px",
                  transition: "border-color 0.2s"
                }}
                onFocus={(e) => e.target.style.borderColor = "#00ffff"}
                onBlur={(e) => e.target.style.borderColor = "#333"}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", color: "#00ffff", marginBottom: "8px", fontSize: "14px", fontWeight: "500" }}>
                Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description"
                style={{
                  width: "100%",
                  padding: "12px",
                  background: "#0a0a0a",
                  border: "1px solid #333",
                  borderRadius: "8px",
                  color: "#fff",
                  fontSize: "16px"
                }}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", color: "#00ffff", marginBottom: "8px", fontSize: "14px", fontWeight: "500" }}>
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Project notes..."
                rows={3}
                style={{
                  width: "100%",
                  padding: "12px",
                  background: "#0a0a0a",
                  border: "1px solid #333",
                  borderRadius: "8px",
                  color: "#fff",
                  fontFamily: "inherit",
                  fontSize: "16px",
                  resize: "none"
                }}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", color: "#00ffff", marginBottom: "8px", fontSize: "14px", fontWeight: "500" }}>
                Icon
              </label>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                {ICONS.map(icon => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setSelectedIcon(icon)}
                    style={{
                      width: "44px",
                      height: "44px",
                      fontSize: "20px",
                      background: selectedIcon === icon ? "rgba(0, 255, 255, 0.1)" : "#0a0a0a",
                      border: `1px solid ${selectedIcon === icon ? "#00ffff" : "#333"}`,
                      borderRadius: "8px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.2s"
                    }}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: "10px" }}>
              <label style={{ display: "block", color: "#00ffff", marginBottom: "8px", fontSize: "14px", fontWeight: "500" }}>
                Color
              </label>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                {COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    style={{
                      width: "32px",
                      height: "32px",
                      background: color,
                      border: selectedColor === color ? "2px solid white" : "none",
                      borderRadius: "50%",
                      cursor: "pointer",
                      boxShadow: selectedColor === color ? `0 0 10px ${color}` : "none transition all 0.2s"
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div style={{
            display: "flex",
            gap: "12px",
            justifyContent: "flex-end",
            padding: "16px 24px",
            background: "#1a1a1a",
            borderTop: "1px solid #333",
            flexShrink: 0
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: "12px",
                background: "transparent",
                border: "1px solid #333",
                borderRadius: "8px",
                color: "#999",
                cursor: "pointer",
                fontWeight: "500"
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              style={{
                flex: 2,
                padding: "12px",
                background: name.trim() ? "#00ffff" : "#222",
                border: "none",
                borderRadius: "8px",
                color: name.trim() ? "#000" : "#555",
                cursor: name.trim() ? "pointer" : "not-allowed",
                fontWeight: "bold",
                fontSize: "14px"
              }}
            >
              Add Project
            </button>
          </div>
        </form>
      </div>
      <style>{`
        @media (max-width: 480px) {
          .modal-content {
            width: 100% !important;
            height: 95vh !important;
            max-height: 95vh !important;
            border-radius: 20px 20px 0 0 !important;
            position: fixed !important;
            bottom: 0 !important;
            border: none !important;
            border-top: 1px solid #00ffff !important;
          }
          .modal-scroll-area {
            padding: 20px !important;
          }
        }
      `}</style>
    </div>
  );
}

// Add empty export to satisfy potential build issues
export { };
