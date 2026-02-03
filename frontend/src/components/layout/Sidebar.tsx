import { useState, useEffect, useCallback, memo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTeam } from "../../contexts/TeamContext";
import TeamPanel from "../team/TeamPanel";
import ActivityPanel from "../activity/ActivityPanel";
import AddProjectModal from "../project/AddProjectModal";
import { getUserProjects, createProject, deleteProject } from "../../services/project.service";
import { getPendingInvites, acceptTeamInvite } from "../../services/team.service";
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
  const [pendingInvites, setPendingInvites] = useState<any[]>([]);
  const [showInvitesModal, setShowInvitesModal] = useState(false);
  const { teams, activeTeam, switchTeam, createTeam, refreshTeams } = useTeam();

  // Sync active state with current route
  useEffect(() => {
    if (location.pathname === "/goals") {
      setActive("Goals");
    } else if (location.pathname === "/habits") {
      setActive("Habits");
    } else if (location.pathname === "/momentum") {
      setActive("Momentum");
    } else if (location.pathname === "/dashboard") {
      // Keep the current active state for dashboard (My Work, Teams, or Projects)
      // Only reset if it's a tracker
      if (active === "Goals" || active === "Habits" || active === "Momentum") {
        setActive("My Work");
      }
    }
  }, [location.pathname]);

  const handleTeamSwitch = useCallback(async (teamId: string | null) => {
    try {
      await switchTeam(teamId);
      window.dispatchEvent(new CustomEvent('teamChanged'));
    } catch (error) {
      console.error("Failed to switch team:", error);
    }
  }, [switchTeam]);

  const handleCreateTeam = useCallback(async (e: React.FormEvent) => {
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
  }, [newTeamName, createTeam]);

  const loadPendingInvites = useCallback(async () => {
    try {
      const invites = await getPendingInvites();
      setPendingInvites(invites.filter((inv: any) => inv.invite));
    } catch (error) {
      console.error("Failed to load pending invites:", error);
    }
  }, []);

  const handleAcceptInvite = useCallback(async (teamId: string) => {
    try {
      await acceptTeamInvite(teamId);
      await loadPendingInvites();
      await refreshTeams();
      setShowInvitesModal(false);
      window.dispatchEvent(new CustomEvent('teamChanged'));
      alert('Successfully joined the team!');
    } catch (error) {
      console.error("Failed to accept invite:", error);
      alert('Failed to accept invite. Please try again.');
    }
  }, [loadPendingInvites, refreshTeams]);

  const loadProjects = useCallback(async () => {
    try {
      const data = await getUserProjects();
      setProjects(data);
    } catch (error) {
      console.error("Failed to load projects:", error);
    }
  }, []);

  const handleAddProject = useCallback(async (name: string, color: string, icon: string) => {
    try {
      await createProject({ name, color, icon });
      await loadProjects();
    } catch (error) {
      console.error("Failed to create project:", error);
    }
  }, [loadProjects]);

  const handleDeleteProject = useCallback(async (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this project?")) return;
    
    try {
      await deleteProject(projectId);
      await loadProjects();
    } catch (error) {
      console.error("Failed to delete project:", error);
    }
  }, [loadProjects]);

  useEffect(() => {
    loadProjects();
    loadPendingInvites();
  }, [loadProjects, loadPendingInvites]);

  useEffect(() => {
    const handleTeamChange = () => {
      loadPendingInvites();
    };
    window.addEventListener('teamChanged', handleTeamChange);
    return () => window.removeEventListener('teamChanged', handleTeamChange);
  }, [loadPendingInvites]);

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

            {/* Pending Invites Notification */}
            {pendingInvites.length > 0 && (
              <div 
                onClick={() => setShowInvitesModal(true)}
                style={{ 
                  padding: "10px", 
                  background: "rgba(255, 100, 0, 0.1)", 
                  border: "1px solid #ff6400",
                  borderRadius: "6px", 
                  fontSize: "13px",
                  marginBottom: "12px",
                  color: "#ff6400",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255, 100, 0, 0.2)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255, 100, 0, 0.1)"}
              >
                <span style={{ fontSize: "16px" }}>📬</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: "600" }}>Team Invites</div>
                  <div style={{ fontSize: "11px", opacity: 0.8 }}>
                    {pendingInvites.length} pending invitation{pendingInvites.length > 1 ? 's' : ''}
                  </div>
                </div>
                <span style={{ fontSize: "12px" }}>→</span>
              </div>
            )}
            
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
              <>
                <div style={{ 
                  padding: "8px", 
                  background: "rgba(0, 255, 255, 0.1)", 
                  borderRadius: "4px", 
                  fontSize: "12px",
                  marginBottom: "8px",
                  color: "#00ffff",
                  textAlign: "center"
                }}>
                  <span>✓ Viewing: <strong>{activeTeam.name}</strong></span>
                </div>
                <button
                  onClick={() => setShowTeamPanel(true)}
                  style={{
                    width: "100%",
                    background: "none",
                    border: "1px solid #00ffff",
                    color: "#00ffff",
                    padding: "8px",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: "500",
                    transition: "all 0.2s",
                    marginBottom: "16px"
                  }}
                  title="View team members"
                  onMouseEnter={(e) => e.currentTarget.style.background = "rgba(0, 255, 255, 0.1)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "none"}
                >
                  👥 View Team
                </button>
              </>
            )}
          </div>
        )}

        {collapsed ? (
          <>
            <a className={active === "My Work" ? "active" : ""} onClick={() => { setActive("My Work"); navigate("/dashboard"); window.dispatchEvent(new CustomEvent('viewChanged', { detail: { view: 'My Work' } })); }} title="My Work">🏠</a>
            <a 
              className={active === "Teams" ? "active" : ""} 
              onClick={() => { setActive("Teams"); navigate("/dashboard"); window.dispatchEvent(new CustomEvent('viewChanged', { detail: { view: 'Teams' } })); }} 
              title={pendingInvites.length > 0 ? `Teams (${pendingInvites.length} pending invites)` : "Teams"}
              style={{ position: "relative" }}
            >
              👥
              {pendingInvites.length > 0 && (
                <span style={{
                  position: "absolute",
                  top: "-2px",
                  right: "-2px",
                  background: "#ff6400",
                  color: "white",
                  fontSize: "9px",
                  fontWeight: "600",
                  padding: "2px 4px",
                  borderRadius: "8px",
                  minWidth: "16px",
                  textAlign: "center",
                  lineHeight: "1"
                }}>
                  {pendingInvites.length}
                </span>
              )}
            </a>
            <a 
              onClick={() => setShowActivityPanel(true)} 
              title="My Activity"
              style={{ cursor: "pointer" }}
            >
              📊
            </a>
            <div style={{ borderTop: "1px solid #333", margin: "8px 0" }}></div>
            {projects.map(project => (
              <a key={project._id} onClick={() => { setActive(project.name); navigate("/dashboard"); window.dispatchEvent(new CustomEvent('viewChanged', { detail: { view: 'project', projectId: project._id } })); }} title={project.name}>📁</a>
            ))}
            <div style={{ borderTop: "1px solid #333", margin: "8px 0" }}></div>
            <a className={active === "Habits" ? "active" : ""} onClick={() => { setActive("Habits"); navigate("/habits"); }} title="Habit Tracker">✅</a>
            <a className={active === "Goals" ? "active" : ""} onClick={() => { setActive("Goals"); navigate("/goals"); }} title="Goal Tracker">🎯</a>
            <a className={active === "Momentum" ? "active" : ""} onClick={() => { setActive("Momentum"); navigate("/momentum"); }} title="Momentum Dashboard">⚡</a>
          </>
        ) : (
          <>
            <p className="section">Workspace</p>
            <Item label="My Work" />
            <a
              className={active === "Teams" ? "active" : ""}
              onClick={() => {
                setActive("Teams");
                navigate("/dashboard");
                window.dispatchEvent(new CustomEvent('viewChanged', { detail: { view: 'Teams' } }));
              }}
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
            >
              Teams
              {pendingInvites.length > 0 && (
                <span style={{
                  background: "#ff6400",
                  color: "white",
                  fontSize: "10px",
                  fontWeight: "600",
                  padding: "2px 6px",
                  borderRadius: "10px",
                  minWidth: "18px",
                  textAlign: "center"
                }}>
                  {pendingInvites.length}
                </span>
              )}
            </a>

            {/* Global My Activity Button */}
            <button
              onClick={() => setShowActivityPanel(true)}
              style={{
                width: "100%",
                background: "none",
                border: "1px solid rgba(0, 255, 255, 0.3)",
                color: "#00ffff",
                padding: "8px 16px",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: "500",
                transition: "all 0.2s",
                textAlign: "left",
                marginTop: "8px",
                marginBottom: "8px"
              }}
              title="View your activity log"
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(0, 255, 255, 0.1)";
                e.currentTarget.style.borderColor = "#00ffff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "none";
                e.currentTarget.style.borderColor = "rgba(0, 255, 255, 0.3)";
              }}
            >
              📊 My Activity
            </button>

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

      {/* Pending Invites Modal */}
      {showInvitesModal && (
        <div className="modal-backdrop" onClick={() => setShowInvitesModal(false)}>
          <div 
            className="modal-content" 
            onClick={(e) => e.stopPropagation()}
            style={{ 
              background: "var(--bg-primary)", 
              padding: "24px", 
              borderRadius: "12px", 
              border: "1px solid var(--border)",
              maxWidth: "500px",
              width: "90%",
              maxHeight: "80vh",
              overflow: "auto"
            }}
          >
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center",
              marginBottom: "20px" 
            }}>
              <h2 style={{ 
                color: "var(--accent)", 
                margin: 0,
                fontSize: "20px",
                fontWeight: "600"
              }}>
                📬 Team Invitations
              </h2>
              <button
                onClick={() => setShowInvitesModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-muted)",
                  fontSize: "24px",
                  cursor: "pointer",
                  padding: "0",
                  width: "32px",
                  height: "32px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "4px",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--bg-tertiary)";
                  e.currentTarget.style.color = "var(--text-primary)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "none";
                  e.currentTarget.style.color = "var(--text-muted)";
                }}
              >
                ×
              </button>
            </div>

            {pendingInvites.length === 0 ? (
              <div style={{
                textAlign: "center",
                padding: "40px 20px",
                color: "var(--text-muted)"
              }}>
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>📭</div>
                <div>No pending invitations</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {pendingInvites.map((invite) => (
                  <div
                    key={invite.teamId}
                    style={{
                      padding: "16px",
                      background: "var(--bg-secondary)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "start", gap: "12px" }}>
                      <div style={{
                        width: "40px",
                        height: "40px",
                        background: "var(--accent)",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "20px",
                        flexShrink: 0
                      }}>
                        👥
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ 
                          fontSize: "16px", 
                          fontWeight: "600", 
                          color: "var(--text-primary)",
                          marginBottom: "4px"
                        }}>
                          {invite.teamName}
                        </div>
                        <div style={{ 
                          fontSize: "13px", 
                          color: "var(--text-secondary)",
                          marginBottom: "4px"
                        }}>
                          Invited by: {invite.invitedBy?.name || invite.invitedBy?.email || "Team Admin"}
                        </div>
                        <div style={{ 
                          fontSize: "12px", 
                          color: "var(--text-muted)"
                        }}>
                          Role: <span style={{ 
                            color: "var(--accent)", 
                            fontWeight: "500",
                            textTransform: "capitalize"
                          }}>
                            {invite.invite?.role || "member"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={() => handleAcceptInvite(invite.teamId)}
                        style={{
                          flex: 1,
                          padding: "10px 16px",
                          background: "var(--accent)",
                          border: "none",
                          borderRadius: "6px",
                          color: "var(--bg-app)",
                          cursor: "pointer",
                          fontWeight: "600",
                          fontSize: "14px",
                          transition: "all 0.2s"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = "0.9"}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                      >
                        ✓ Accept Invitation
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
