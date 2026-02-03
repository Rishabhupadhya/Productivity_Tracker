import { useState } from "react";

interface AddProjectModalProps {
  onClose: () => void;
  onAdd: (name: string, color: string, icon: string) => void;
}

const ICONS = ["📁", "💼", "🚀", "🎯", "⚡", "🔥", "✨", "🎨", "📊", "💡", "🛠️", "📱", "💻", "🌟", "🎪"];
const COLORS = ["#00ffff", "#ff00ff", "#ffff00", "#00ff00", "#ff0000", "#0000ff", "#ff6600", "#9900ff", "#00ccff", "#ff3399"];

export default function AddProjectModal({ onClose, onAdd }: AddProjectModalProps) {
  const [name, setName] = useState("");
  const [selectedColor, setSelectedColor] = useState("#00ffff");
  const [selectedIcon, setSelectedIcon] = useState("📁");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd(name, selectedColor, selectedIcon);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        style={{ 
          background: "#1a1a1a", 
          padding: "24px", 
          borderRadius: "8px", 
          border: "1px solid #00ffff",
          maxWidth: "450px",
          width: "90%"
        }}
      >
        <h2 style={{ color: "#00ffff", marginBottom: "20px" }}>Add New Project</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", color: "#00ffff", marginBottom: "8px", fontSize: "14px" }}>
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
                padding: "10px", 
                background: "#0a0a0a", 
                border: "1px solid #00ffff", 
                borderRadius: "4px", 
                color: "#00ffff"
              }}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", color: "#00ffff", marginBottom: "8px", fontSize: "14px" }}>
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the project"
              style={{ 
                width: "100%", 
                padding: "10px", 
                background: "#0a0a0a", 
                border: "1px solid #00ffff", 
                borderRadius: "4px", 
                color: "#00ffff"
              }}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", color: "#00ffff", marginBottom: "8px", fontSize: "14px" }}>
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes or details about this project..."
              rows={3}
              style={{ 
                width: "100%", 
                padding: "10px", 
                background: "#0a0a0a", 
                border: "1px solid #00ffff", 
                borderRadius: "4px", 
                color: "#00ffff",
                fontFamily: "inherit",
                resize: "vertical"
              }}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", color: "#00ffff", marginBottom: "8px", fontSize: "14px" }}>
              Icon
            </label>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {ICONS.map(icon => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setSelectedIcon(icon)}
                  style={{ 
                    padding: "8px 12px",
                    fontSize: "20px",
                    background: selectedIcon === icon ? "#00ffff" : "#0a0a0a",
                    border: `1px solid ${selectedIcon === icon ? "#00ffff" : "#333"}`,
                    borderRadius: "4px",
                    cursor: "pointer"
                  }}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", color: "#00ffff", marginBottom: "8px", fontSize: "14px" }}>
              Color
            </label>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  style={{ 
                    width: "36px",
                    height: "36px",
                    background: color,
                    border: selectedColor === color ? "3px solid white" : "1px solid #333",
                    borderRadius: "50%",
                    cursor: "pointer"
                  }}
                />
              ))}
            </div>
          </div>

          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "24px" }}>
            <button
              type="button"
              onClick={onClose}
              style={{ 
                padding: "8px 16px", 
                background: "transparent", 
                border: "1px solid #666", 
                borderRadius: "4px", 
                color: "#666",
                cursor: "pointer"
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              style={{ 
                padding: "8px 16px", 
                background: name.trim() ? "#00ffff" : "#333", 
                border: "none", 
                borderRadius: "4px", 
                color: name.trim() ? "#000" : "#666",
                cursor: name.trim() ? "pointer" : "not-allowed",
                fontWeight: "bold"
              }}
            >
              Add Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
