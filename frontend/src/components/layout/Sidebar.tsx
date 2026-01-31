import { useState } from "react";
import { useTeam } from "../../contexts/TeamContext";
import TeamPanel from "../team/TeamPanel";
import ActivityPanel from "../activity/ActivityPanel";
import "./sidebar.css";

export default function Sidebar() {
  const [active, setActive] = useState("My Work");
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showTeamPanel, setShowTeamPanel] = useState(false);
  const [showActivityPanel, setShowActivityPanel] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const { teams, activeTeam, switchTeam, createTeam } = useTeam();

  const handleTeamSwitch = async (teamId: string | null) => {
    try {
      await switchTeam(teamId);
      window.dispatchEvent(new CustomEvent('teamChanged'));
    } catch (error) {
      console.error("Failed to switch team:", error);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    
    try {
      await createTeam(newTeamName);
      setNewTeamName("");
      setShowTeamModal(false);
      window.dispatchEvent(new CustomEvent('teamChanged'));
    } catch (error) {
      console.error("Failed to create team:", error);
    }
  };

  const Item = ({ label }: { label: string }) => (
    <a
      className={active === label ? "active" : ""}
      onClick={() => {
        setActive(label);
        window.dispatchEvent(new CustomEvent('viewChanged', { detail: { view: label } }));
      }}
    >
      {label}
    </a>
  );

  return (
    <>
      <aside className="sidebar">
        <h2 className="logo">⚡ Tracker</h2>

        {active === "Teams" && (
          <div className="section">
            <p style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span>Team Context</span>
              <button 
                onClick={() => setShowTeamModal(true)}
                style={{ 
                  background: "none", 
                  border: "1px solid #00ffff", 
                  color: "#00ffff", 
                  padding: "2px 8px", 
                  borderRadius: "4px", 
                  cursor: "pointer",
                  fontSize: "12px"
                }}
              >
                + New
              </button>
            </p>
            
            <select 
              value={activeTeam?._id || "personal"}
              onChange={(e) => handleTeamSwitch(e.target.value === "personal" ? null : e.target.value)}
              style={{ 
                width: "100%", 
                padding: "8px", 
                background: "#1a1a1a", 
                border: "1px solid #00ffff", 
                borderRadius: "4px", 
                color: "#00ffff",
                marginBottom: "16px",
                cursor: "pointer"
              }}
            >
              <option value="personal">👤 Personal Team</option>
              {teams.map(team => (
                <option key={team._id} value={team._id}>
                  👥 {team.name}
                </option>
              ))}
            </select>
            
            {activeTeam && (
              <div style={{ 
                padding: "8px", 
                background: "rgba(0, 255, 255, 0.1)", 
                borderRadius: "4px", 
                fontSize: "12px",
                marginBottom: "16px",
                color: "#00ffff",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "8px"
              }}>
                <span>✓ Viewing: <strong>{activeTeam.name}</strong></span>
                <div style={{ display: "flex", gap: "4px" }}>
                  <button
                    onClick={() => setShowActivityPanel(true)}
                    style={{
                      background: "none",
                      border: "1px solid #00ffff",
                      color: "#00ffff",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "10px"
                    }}
                    title="View activity log"
                  >
                    📊 Log
                  </button>
                  <button
                    onClick={() => setShowTeamPanel(true)}
                    style={{
                      background: "none",
                      border: "1px solid #00ffff",
                      color: "#00ffff",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "10px"
                    }}
                    title="View team members"
                  >
                    👥 View
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <p className="section">Workspace</p>
        <Item label="My Work" />
        <Item label="Teams" />

        <p className="section">Projects</p>
        <Item label="Marketing" />
        <Item label="Design" />
        <Item label="Development" />
      </aside>

      {showTeamModal && (
        <div className="modal-backdrop" onClick={() => setShowTeamModal(false)}>
          <div 
            className="modal-content" 
            onClick={(e) => e.stopPropagation()}
            style={{ 
              background: "#1a1a1a", 
              padding: "24px", 
              borderRadius: "8px", 
              border: "1px solid #00ffff",
              maxWidth: "400px",
              width: "90%"
            }}
          >
            <h2 style={{ color: "#00ffff", marginBottom: "16px" }}>Create New Team</h2>
            <form onSubmit={handleCreateTeam}>
              <input
                type="text"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder="Team name"
                autoFocus
                style={{ 
                  width: "100%", 
                  padding: "10px", 
                  marginBottom: "16px", 
                  background: "#0a0a0a", 
                  border: "1px solid #00ffff", 
                  borderRadius: "4px", 
                  color: "#00ffff"
                }}
              />
              <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setShowTeamModal(false)}
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
                  style={{ 
                    padding: "8px 16px", 
                    background: "#00ffff", 
                    border: "none", 
                    borderRadius: "4px", 
                    color: "#000",
                    cursor: "pointer",
                    fontWeight: "bold"
                  }}
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showTeamPanel && <TeamPanel onClose={() => setShowTeamPanel(false)} />}
      {showActivityPanel && <ActivityPanel onClose={() => setShowActivityPanel(false)} />}
    </>
  );
}
