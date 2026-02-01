import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTeam } from "../../contexts/TeamContext";
import TeamPanel from "../team/TeamPanel";
import ActivityPanel from "../activity/ActivityPanel";
import AddProjectModal from "../project/AddProjectModal";
import { getUserProjects, createProject, deleteProject } from "../../services/project.service";
import type { Project } from "../../services/project.service";
import "./sidebar.css";

export default function Sidebar({ collapsed = false }: { collapsed?: boolean }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [active, setActive] = useState("My Work");
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showTeamPanel, setShowTeamPanel] = useState(false);
  const [showActivityPanel, setShowActivityPanel] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const { teams, activeTeam, switchTeam, createTeam } = useTeam();

  // Sync active state with current route
  useEffect(() => {
    if (location.pathname === "/goals") {
      setActive("Goals");
    } else if (location.pathname === "/habits") {
      setActive("Habits");
    } else if (location.pathname === "/dashboard") {
      // Keep the current active state for dashboard (My Work, Teams, or Projects)
      // Only reset if it's a tracker
      if (active === "Goals" || active === "Habits") {
        setActive("My Work");
      }
    }
  }, [location.pathname]);

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

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await getUserProjects();
      setProjects(data);
    } catch (error) {
      console.error("Failed to load projects:", error);
    }
  };

  const handleAddProject = async (name: string, color: string, icon: string) => {
    try {
      await createProject(name, color, icon);
      await loadProjects();
    } catch (error) {
      console.error("Failed to create project:", error);
    }
  };

  const handleDeleteProject = async (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this project?")) return;
    
    try {
      await deleteProject(projectId);
      await loadProjects();
    } catch (error) {
      console.error("Failed to delete project:", error);
    }
  };

  const Item = ({ label }: { label: string }) => (
    <a
      className={active === label ? "active" : ""}
      onClick={() => {
        setActive(label);
        navigate("/dashboard");
        window.dispatchEvent(new CustomEvent('viewChanged', { detail: { view: label } }));
      }}
    >
      {label}
    </a>
  );

  return (
    <>
      <aside className="sidebar" style={{ width: collapsed ? "60px" : "250px", overflow: collapsed ? "hidden" : "auto" }}>
        <h2 className="logo" style={{ opacity: collapsed ? 0 : 1, transition: "opacity 0.3s" }}>⚡ Tracker</h2>

        {!collapsed && active === "Teams" && (
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

        {collapsed ? (
          <>
            <a className={active === "My Work" ? "active" : ""} onClick={() => { setActive("My Work"); navigate("/dashboard"); window.dispatchEvent(new CustomEvent('viewChanged', { detail: { view: 'My Work' } })); }} title="My Work">🏠</a>
            <a className={active === "Teams" ? "active" : ""} onClick={() => { setActive("Teams"); navigate("/dashboard"); window.dispatchEvent(new CustomEvent('viewChanged', { detail: { view: 'Teams' } })); }} title="Teams">👥</a>
            <div style={{ borderTop: "1px solid #333", margin: "8px 0" }}></div>
            {projects.map(project => (
              <a key={project._id} onClick={() => { setActive(project.name); navigate("/dashboard"); window.dispatchEvent(new CustomEvent('viewChanged', { detail: { view: 'project', projectId: project._id } })); }} title={project.name}>📁</a>
            ))}
            <div style={{ borderTop: "1px solid #333", margin: "8px 0" }}></div>
            <a className={active === "Habits" ? "active" : ""} onClick={() => { setActive("Habits"); navigate("/habits"); }} title="Habit Tracker">✅</a>
            <a className={active === "Goals" ? "active" : ""} onClick={() => { setActive("Goals"); navigate("/goals"); }} title="Goal Tracker">🎯</a>
          </>
        ) : (
          <>
            <p className="section">Workspace</p>
            <Item label="My Work" />
            <Item label="Teams" />

            <p className="section" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              Projects
              <button
                onClick={() => setShowProjectModal(true)}
                style={{
                  background: "none",
                  border: "1px solid #00ffff",
                  color: "#00ffff",
                  padding: "2px 8px",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "12px"
                }}
                title="Add project"
              >
                +
              </button>
            </p>
        {projects.map(project => (
          <a
            key={project._id}
            className={active === project.name ? "active" : ""}
            onClick={() => {
              setActive(project.name);
              navigate("/dashboard");
              window.dispatchEvent(new CustomEvent('viewChanged', { detail: { view: project.name, projectId: project._id } }));
            }}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              color: project.color
            }}
          >
            <span>
              {project.icon} {project.name}
            </span>
            <button
              onClick={(e) => handleDeleteProject(project._id, e)}
              style={{
                background: "none",
                border: "none",
                color: "#666",
                cursor: "pointer",
                fontSize: "16px",
                padding: "2px 4px"
              }}
              title="Delete project"
            >
              ×
            </button>
          </a>
        ))}
        {projects.length === 0 && (
          <div style={{ color: "#666", fontSize: "12px", padding: "8px 16px" }}>
            No projects yet
          </div>
        )}

            <p className="section" style={{ marginTop: "24px" }}>Trackers</p>
            <a
              className={active === "Intelligence" ? "active" : ""}
              onClick={() => {
                setActive("Habits");
                navigate("/habits");
                window.dispatchEvent(new CustomEvent('viewChanged', { detail: { view: 'Habits' } }));
              }}
            >
              ✅ Habit Tracker
            </a>
            <a
              className={active === "Goals" ? "active" : ""}
              onClick={() => {
                setActive("Goals");
                navigate("/goals");
                window.dispatchEvent(new CustomEvent('viewChanged', { detail: { view: 'Goals' } }));
              }}
            >
              🎯 Goal Tracker
            </a>
          </>
        )}
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
      {showProjectModal && (
        <AddProjectModal 
          onClose={() => setShowProjectModal(false)}
          onAdd={handleAddProject}
        />
      )}
    </>
  );
}
