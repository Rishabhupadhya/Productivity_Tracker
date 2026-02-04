import { useState, useEffect } from "react";
import { useTeam } from "../../contexts/TeamContext";
import { getTeamActivity, getUserActivity, type Activity } from "../../services/activity.service";
import "../task/modal.css";

export default function ActivityPanel({ onClose }: { onClose: () => void }) {
  const { activeTeam } = useTeam();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivity();
  }, [activeTeam]);

  const loadActivity = async () => {
    try {
      setLoading(true);
      // If activeTeam is set, get team-specific activities, otherwise get all user activities
      const data = activeTeam
        ? await getTeamActivity(activeTeam._id, true)
        : await getUserActivity();

      if (Array.isArray(data)) {
        setActivities(data);
      } else {
        console.warn("loadActivity: received non-array data", data);
        setActivities([]);
      }
    } catch (error) {
      console.error("Failed to load activity:", error);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (action: string) => {
    if (action.includes("created")) return "✨";
    if (action.includes("completed")) return "✅";
    if (action.includes("updated")) return "📝";
    if (action.includes("deleted")) return "🗑️";
    if (action.includes("joined")) return "👋";
    return "📌";
  };

  const getActivityColor = (action: string) => {
    if (action.includes("created")) return "var(--success)";
    if (action.includes("completed")) return "var(--accent)";
    if (action.includes("updated")) return "var(--warning)";
    if (action.includes("deleted")) return "var(--danger)";
    return "var(--text-secondary)";
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{
        background: "var(--bg-secondary)",
        border: "1px solid var(--border-default)",
        maxWidth: "700px",
        maxHeight: "80vh",
        overflow: "auto"
      }}>
        <div className="modal-header">
          <h2 style={{ color: "var(--text-primary)" }}>
            📊 My Activity{activeTeam ? ` - ${activeTeam?.name || 'Team'}` : ""}
          </h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="modal-body" style={{ padding: "24px" }}>
          {loading ? (
            <div style={{ textAlign: "center", color: "var(--text-secondary)", padding: "40px" }}>
              Loading activity...
            </div>
          ) : activities.length === 0 ? (
            <div style={{
              textAlign: "center",
              color: "var(--text-muted)",
              padding: "60px 20px",
              background: "var(--bg-tertiary)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--border-default)"
            }}>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>📭</div>
              <h3 style={{ color: "var(--text-secondary)", marginBottom: "8px", fontSize: "var(--text-lg)" }}>No activity yet</h3>
              <p style={{ fontSize: "var(--text-sm)", maxWidth: "300px", margin: "0 auto" }}>
                Your activity will appear here as you create tasks, complete habits, and collaborate with your team.
              </p>
            </div>
          ) : (
            <div style={{ position: "relative" }}>
              {/* Timeline line */}
              <div style={{
                position: "absolute",
                left: "20px",
                top: "20px",
                bottom: "20px",
                width: "2px",
                background: "var(--border-default)"
              }} />

              {/* Activity items */}
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {activities.map((activity) => (
                  <div key={activity._id} style={{
                    position: "relative",
                    paddingLeft: "56px",
                    paddingRight: "16px"
                  }}>
                    {/* Timeline dot */}
                    <div style={{
                      position: "absolute",
                      left: "12px",
                      top: "4px",
                      width: "18px",
                      height: "18px",
                      borderRadius: "50%",
                      background: "var(--bg-secondary)",
                      border: `2px solid ${getActivityColor(activity.action)}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "10px"
                    }}>
                      {getActivityIcon(activity.action)}
                    </div>

                    {/* Activity content */}
                    <div style={{
                      padding: "16px",
                      background: "var(--bg-tertiary)",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--border-default)"
                    }}>
                      <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: "8px"
                      }}>
                        <div>
                          <span style={{
                            color: "var(--text-primary)",
                            fontWeight: "var(--font-medium)",
                            fontSize: "var(--text-base)"
                          }}>
                            {activity.action}
                          </span>
                          {activity.targetType && (
                            <span style={{
                              marginLeft: "8px",
                              padding: "2px 8px",
                              background: "var(--bg-elevated)",
                              color: "var(--text-muted)",
                              borderRadius: "var(--radius-sm)",
                              fontSize: "var(--text-xs)",
                              fontWeight: "var(--font-medium)"
                            }}>
                              {activity.targetType}
                            </span>
                          )}
                        </div>
                        <time style={{
                          color: "var(--text-muted)",
                          fontSize: "var(--text-xs)",
                          whiteSpace: "nowrap"
                        }}>
                          {new Date(activity.createdAt).toLocaleDateString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </time>
                      </div>

                      {activity.details && Object.keys(activity.details).length > 0 && (
                        <div style={{
                          marginTop: "8px",
                          paddingTop: "8px",
                          borderTop: "1px solid var(--border-default)",
                          fontSize: "var(--text-sm)",
                          color: "var(--text-secondary)"
                        }}>
                          {Object.entries(activity.details).map(([key, value]) => (
                            <div key={key} style={{ marginBottom: "4px" }}>
                              <span style={{ color: "var(--text-muted)" }}>{key}:</span>{" "}
                              <span>{String(value)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
