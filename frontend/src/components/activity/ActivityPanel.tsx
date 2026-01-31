import { useState, useEffect } from "react";
import { useTeam } from "../../contexts/TeamContext";
import { getTeamActivity } from "../../services/activity.service";
import "./activityPanel.css";

interface Activity {
  _id: string;
  action: string;
  userId: {
    name: string;
    email: string;
    avatar?: string;
  };
  details: {
    taskTitle?: string;
    memberName?: string;
    memberEmail?: string;
    changes?: string;
    role?: string;
  };
  timestamp: string;
}

export default function ActivityPanel({ onClose }: { onClose: () => void }) {
  const { activeTeam } = useTeam();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeTeam) {
      loadActivities();
    }
  }, [activeTeam]);

  const loadActivities = async () => {
    if (!activeTeam) return;
    try {
      setLoading(true);
      const data = await getTeamActivity(activeTeam._id);
      setActivities(data);
    } catch (error) {
      console.error("Failed to load activities:", error);
    } finally {
      setLoading(false);
    }
  };

  const getActionText = (activity: Activity) => {
    const { action, details, userId } = activity;
    
    switch (action) {
      case "team_created":
        return "created the team";
      case "task_created":
        return `created task "${details.taskTitle}"`;
      case "task_updated":
        return `updated task "${details.taskTitle}" - ${details.changes}`;
      case "task_deleted":
        return `deleted task "${details.taskTitle}"`;
      case "member_invited":
        return `invited ${details.memberEmail} as ${details.role}`;
      case "member_joined":
        return `${details.memberName} joined as ${details.role}`;
      case "member_removed":
        return `removed ${details.memberName} from team`;
      default:
        return action;
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "team_created": return "🎉";
      case "task_created": return "📝";
      case "task_updated": return "✏️";
      case "task_deleted": return "🗑️";
      case "member_invited": return "✉️";
      case "member_joined": return "👋";
      case "member_removed": return "👋";
      default: return "📌";
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (!activeTeam) {
    return (
      <div className="modal-backdrop" onClick={onClose}>
        <div className="activity-panel" onClick={(e) => e.stopPropagation()}>
          <h2>No Team Selected</h2>
          <p>Please select a team to view activity.</p>
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="activity-panel" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header">
          <h2>📊 Activity Log</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="panel-content">
          {loading ? (
            <div className="loading">Loading activities...</div>
          ) : activities.length === 0 ? (
            <div className="empty-state">No activities yet</div>
          ) : (
            <div className="activity-list">
              {activities.map((activity) => (
                <div key={activity._id} className="activity-item">
                  <div className="activity-icon">{getActionIcon(activity.action)}</div>
                  <div className="activity-content">
                    <div className="activity-user">
                      {activity.userId.avatar ? (
                        <div
                          className="user-avatar"
                          style={{
                            backgroundImage: `url(http://localhost:5001${activity.userId.avatar})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                          }}
                        />
                      ) : (
                        <div className="user-avatar default">
                          {activity.userId.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="user-name">{activity.userId.name}</span>
                    </div>
                    <div className="activity-text">{getActionText(activity)}</div>
                    <div className="activity-time">{formatTime(activity.timestamp)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
