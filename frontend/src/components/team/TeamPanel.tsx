import { useState, useEffect } from "react";
import { useTeam } from "../../contexts/TeamContext";
import { getTeamDetails, inviteTeamMember, cancelTeamInvite, removeTeamMember } from "../../services/team.service";
import type { Team } from "../../services/team.service";
import emailjs from '@emailjs/browser';
import { env } from "../../config/emailjs.config";
import "../task/modal.css";

// Initialize EmailJS with public key
emailjs.init(env.EMAILJS_PUBLIC_KEY);

export default function TeamPanel({ onClose }: { onClose: () => void }) {
  const { activeTeam, refreshTeams } = useTeam();
  const [teamDetails, setTeamDetails] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member">("member");
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    loadTeamDetails();
  }, [activeTeam]);

  const loadTeamDetails = async () => {
    if (!activeTeam) return;
    try {
      setLoading(true);
      if (import.meta.env.DEV) {
        console.debug('Loading team details for:', activeTeam._id);
      }
      const details = await getTeamDetails(activeTeam._id);
      if (import.meta.env.DEV) {
        console.debug('Team details loaded:', details);
        console.debug('Invites in loaded team:', details.invites);
      }
      setTeamDetails(details);
    } catch (error) {
      console.error("Failed to load team details:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTeam || !inviteEmail.trim()) return;
    
    try {
      setInviting(true);
      // Send the team invite through the backend
      await inviteTeamMember(activeTeam._id, inviteEmail, inviteRole);
      
      // Send email notification using EmailJS
      try {
        // Extract email params to avoid duplication
        const emailParams = {
          email: inviteEmail,
          to_name: inviteEmail.split('@')[0],
          title: `Join ${activeTeam?.name || 'Team'}`,
          invite_link: `${window.location.origin}/teams/${activeTeam._id}/accept`,
        };

        // Dev-only debug logging (production safe)
        if (import.meta.env.DEV) {
          console.debug('📧 Sending email with params:', {
            ...emailParams,
            to_name: inviteEmail.split('@')[0], // Show email split part only in dev
          });
        }

        const response = await emailjs.send(
          env.EMAILJS_SERVICE_ID,
          env.EMAILJS_TEMPLATE_ID,
          emailParams
        );
        
        if (import.meta.env.DEV) {
          console.debug('✅ Email notification sent successfully');
        }
        alert(`Team invite sent! Email delivered to ${inviteEmail}`);
      } catch (emailError: any) {
        console.error("❌ Email notification failed:", emailError);
        console.error("Error details:", emailError.text || emailError.message);
        alert(`Invite created, but email failed: ${emailError.text || emailError.message}`);
        // Don't fail the whole operation if email fails
      }
      
      setInviteEmail("");
      await loadTeamDetails();
      await refreshTeams();
    } catch (error) {
      console.error("Failed to invite member:", error);
      alert("Failed to send invite. Please check the email and try again.");
    } finally {
      setInviting(false);
    }
  };

  const handleCancelInvite = async (email: string) => {
    if (!activeTeam || !confirm(`Cancel invite for ${email}?`)) return;
    
    try {
      if (import.meta.env.DEV) {
        console.debug('Canceling invite:', { teamId: activeTeam._id, email });
      }
      await cancelTeamInvite(activeTeam._id, email);
      if (import.meta.env.DEV) {
        console.debug('Invite canceled successfully');
      }
      await loadTeamDetails();
      await refreshTeams();
    } catch (error: any) {
      console.error("Failed to cancel invite:", error);
      console.error("Error response:", error.response?.data);
      alert(`Failed to cancel invite: ${error.response?.data?.message || error.message || 'Unknown error'}`);
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!activeTeam || !confirm(`Remove ${memberName} from the team?`)) return;
    
    try {
      await removeTeamMember(activeTeam._id, memberId);
      await loadTeamDetails();
      await refreshTeams();
    } catch (error) {
      console.error("Failed to remove member:", error);
    }
  };

  if (!activeTeam) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-default)" }}>
          <div className="modal-header">
            <h2 style={{ color: "var(--text-primary)" }}>Team Management</h2>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
          <div className="modal-body">
            <p style={{ color: "var(--text-secondary)", textAlign: "center", padding: "40px 20px" }}>
              No team selected. Switch to a team from the sidebar to view team details.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ 
        background: "var(--bg-secondary)", 
        border: "1px solid var(--border-default)",
        maxWidth: "600px",
        maxHeight: "80vh",
        overflow: "auto"
      }}>
        <div className="modal-header">
          <h2 style={{ color: "var(--text-primary)" }}>👥 {teamDetails?.name || "Team"}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="modal-body" style={{ padding: "24px" }}>
          {loading ? (
            <div style={{ textAlign: "center", color: "var(--text-secondary)", padding: "40px" }}>
              Loading team details...
            </div>
          ) : (
            <>
              {/* Team Members */}
              <div style={{ marginBottom: "32px" }}>
                <h3 style={{ color: "var(--accent)", fontSize: "var(--text-lg)", marginBottom: "16px" }}>
                  Team Members ({teamDetails?.members?.length || 0})
                </h3>
                {teamDetails?.members && teamDetails.members.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {teamDetails.members.map((member: any) => (
                      <div key={member.userId?._id} style={{
                        padding: "16px",
                        background: "var(--bg-tertiary)",
                        borderRadius: "var(--radius-md)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        border: "1px solid var(--border-default)"
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "50%",
                            background: "var(--accent)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "var(--bg-app)",
                            fontWeight: "bold",
                            fontSize: "16px"
                          }}>
                            {member.userId?.name?.charAt(0)?.toUpperCase() || "?"}
                          </div>
                          <div>
                            <div style={{ color: "var(--text-primary)", fontWeight: "var(--font-medium)" }}>
                              {member.userId?.name || "Unknown User"}
                            </div>
                            <div style={{ color: "var(--text-muted)", fontSize: "var(--text-sm)" }}>
                              {member.userId?.email}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <span style={{
                            padding: "4px 12px",
                            background: member.role === "admin" ? "var(--accent)" : "var(--bg-elevated)",
                            color: member.role === "admin" ? "var(--bg-app)" : "var(--text-secondary)",
                            borderRadius: "var(--radius-sm)",
                            fontSize: "var(--text-xs)",
                            fontWeight: "var(--font-medium)"
                          }}>
                            {member.role}
                          </span>
                          {member.role !== "admin" && (
                            <button
                              onClick={() => handleRemoveMember(member.userId._id, member.userId?.name || 'User')}
                              style={{
                                padding: "4px 12px",
                                background: "var(--danger)",
                                color: "white",
                                border: "none",
                                borderRadius: "var(--radius-sm)",
                                cursor: "pointer",
                                fontSize: "var(--text-xs)",
                                fontWeight: "var(--font-medium)"
                              }}
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: "var(--text-muted)", fontSize: "var(--text-sm)" }}>
                    No members yet
                  </p>
                )}
              </div>

              {/* Pending Invites */}
              {teamDetails?.invites && teamDetails.invites.length > 0 && (
                <div style={{ marginBottom: "32px" }}>
                  <h3 style={{ color: "var(--accent)", fontSize: "var(--text-lg)", marginBottom: "16px" }}>
                    Pending Invites ({teamDetails.invites.length})
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {teamDetails.invites.map((invite: any, idx: number) => (
                      <div key={idx} style={{
                        padding: "16px",
                        background: "var(--bg-tertiary)",
                        borderRadius: "var(--radius-md)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        border: "1px solid var(--border-default)"
                      }}>
                        <div>
                          <div style={{ color: "var(--text-primary)", fontWeight: "var(--font-medium)" }}>
                            {invite.email}
                          </div>
                          <div style={{ color: "var(--text-muted)", fontSize: "var(--text-sm)" }}>
                            Invited {new Date(invite.invitedAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <span style={{
                            padding: "4px 12px",
                            background: "var(--bg-elevated)",
                            color: "var(--text-secondary)",
                            borderRadius: "var(--radius-sm)",
                            fontSize: "var(--text-xs)"
                          }}>
                            {invite.role}
                          </span>
                          <button
                            onClick={() => handleCancelInvite(invite.email)}
                            style={{
                              padding: "4px 12px",
                              background: "var(--danger)",
                              color: "white",
                              border: "none",
                              borderRadius: "var(--radius-sm)",
                              cursor: "pointer",
                              fontSize: "var(--text-xs)"
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Invite New Member */}
              <div>
                <h3 style={{ color: "var(--accent)", fontSize: "var(--text-lg)", marginBottom: "16px" }}>
                  Invite New Member
                </h3>
                <form onSubmit={handleInvite} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <input
                    type="email"
                    placeholder="Email address"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                    style={{
                      padding: "12px",
                      background: "var(--bg-tertiary)",
                      border: "1px solid var(--border-default)",
                      borderRadius: "var(--radius-md)",
                      color: "var(--text-primary)",
                      fontSize: "var(--text-base)"
                    }}
                  />
                  <div style={{ display: "flex", gap: "12px" }}>
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as "admin" | "member")}
                      style={{
                        flex: 1,
                        padding: "12px",
                        background: "var(--bg-tertiary)",
                        border: "1px solid var(--border-default)",
                        borderRadius: "var(--radius-md)",
                        color: "var(--text-primary)",
                        fontSize: "var(--text-base)"
                      }}
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button
                      type="submit"
                      disabled={inviting}
                      style={{
                        padding: "12px 24px",
                        background: "var(--accent)",
                        color: "var(--text-inverse)",
                        border: "none",
                        borderRadius: "var(--radius-md)",
                        cursor: inviting ? "not-allowed" : "pointer",
                        fontWeight: "var(--font-medium)",
                        fontSize: "var(--text-base)",
                        opacity: inviting ? 0.5 : 1
                      }}
                    >
                      {inviting ? "Sending..." : "Send Invite"}
                    </button>
                  </div>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
