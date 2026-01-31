import { useState, useEffect } from "react";
import { useTeam } from "../../contexts/TeamContext";
import { useUser } from "../../contexts/UserContext";
import { getTeamDetails, inviteTeamMember } from "../../services/team.service";
import { sendTeamInviteEmail } from "../../services/email.service";
import "./teamPanel.css";

export default function TeamPanel({ onClose }: { onClose: () => void }) {
  const { activeTeam } = useTeam();
  const { user } = useUser();
  const [teamDetails, setTeamDetails] = useState<any>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member">("member");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  
  // Check if current user is admin
  const isAdmin = teamDetails?.members?.find((m: any) => m.userId._id === user?._id)?.role === "admin";

  useEffect(() => {
    if (activeTeam) {
      loadTeamDetails();
    }
  }, [activeTeam]);

  const loadTeamDetails = async () => {
    if (!activeTeam) return;
    try {
      const details = await getTeamDetails(activeTeam._id);
      setTeamDetails(details);
    } catch (error) {
      console.error("Failed to load team details:", error);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTeam || !inviteEmail || !user) return;

    setLoading(true);
    setMessage("");
    try {
      // Save invite to database first
      await inviteTeamMember(activeTeam._id, inviteEmail, inviteRole);
      
      // If database save succeeds, send email notification
      try {
        const emailResponse = await sendTeamInviteEmail(
          inviteEmail,
          activeTeam.name,
          user.name,
          inviteRole
        );
        console.log("Email sent successfully:", emailResponse);
        setMessage("✅ Invite sent successfully! Email notification delivered.");
      } catch (emailError: any) {
        console.error("Email send failed:", emailError);
        console.error("EmailJS Error Details:", {
          status: emailError.status,
          text: emailError.text,
          message: emailError.message
        });
        setMessage(`✅ Invite saved! (Email failed: ${emailError.text || emailError.message || "Unknown error"})`);
      }
      
      setInviteEmail("");
      setShowInvite(false);
      await loadTeamDetails();
      setTimeout(() => setMessage(""), 5000);
    } catch (error: any) {
      console.error("Invite failed:", error);
      const errorMsg = error.response?.data?.message || error.message || "Failed to send invite";
      setMessage(`❌ ${errorMsg}`);
      setTimeout(() => setMessage(""), 5000);
    } finally {
      setLoading(false);
    }
  };

  if (!activeTeam) {
    return (
      <div className="modal-backdrop" onClick={onClose}>
        <div className="team-panel" onClick={(e) => e.stopPropagation()}>
          <h2>No Team Selected</h2>
          <p>Please select a team to view members.</p>
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="team-panel" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header">
          <h2>👥 {activeTeam.name}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {message && (
          <div className={`message ${message.includes("✅") ? "success" : "error"}`}>
            {message}
          </div>
        )}

        <div className="panel-content">
          <div className="members-section">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3>Members ({teamDetails?.members?.length || 0})</h3>
              {isAdmin && (
                <button 
                  onClick={() => setShowInvite(!showInvite)}
                  style={{
                    padding: "6px 12px",
                    background: "#00ffff",
                    border: "none",
                    borderRadius: "4px",
                    color: "#000",
                    cursor: "pointer",
                    fontWeight: "bold"
                  }}
                >
                  + Invite
                </button>
              )}
            </div>

            {isAdmin && showInvite && (
              <form onSubmit={handleInvite} style={{ marginBottom: "16px", padding: "12px", background: "#1a1a1a", borderRadius: "4px" }}>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Email address"
                  required
                  style={{
                    width: "100%",
                    padding: "8px",
                    marginBottom: "8px",
                    background: "#0a0a0a",
                    border: "1px solid #00ffff",
                    borderRadius: "4px",
                    color: "#00ffff"
                  }}
                />
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as "admin" | "member")}
                  style={{
                    width: "100%",
                    padding: "8px",
                    marginBottom: "8px",
                    background: "#0a0a0a",
                    border: "1px solid #00ffff",
                    borderRadius: "4px",
                    color: "#00ffff"
                  }}
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    type="button"
                    onClick={() => setShowInvite(false)}
                    style={{
                      padding: "6px 12px",
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
                    disabled={loading}
                    style={{
                      padding: "6px 12px",
                      background: loading ? "#666" : "#00ffff",
                      border: "none",
                      borderRadius: "4px",
                      color: "#000",
                      cursor: loading ? "not-allowed" : "pointer",
                      fontWeight: "bold"
                    }}
                  >
                    {loading ? "Sending..." : "Send Invite"}
                  </button>
                </div>
              </form>
            )}

            <div className="members-list">
              {teamDetails?.members?.map((member: any) => (
                <div key={member.userId._id} className="member-card">
                  <div
                    className="member-avatar"
                    style={member.userId.avatar ? {
                      backgroundImage: `url(http://localhost:5001${member.userId.avatar})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    } : {
                      background: 'linear-gradient(135deg, #00ffff, #00aaaa)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#000',
                      fontWeight: 'bold',
                      fontSize: '18px'
                    }}
                  >
                    {!member.userId.avatar && member.userId.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="member-info">
                    <div className="member-name">{member.userId.name}</div>
                    <div className="member-email">{member.userId.email}</div>
                  </div>
                  <div className="member-role">
                    {member.role === "admin" ? "👑 Admin" : "👤 Member"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
