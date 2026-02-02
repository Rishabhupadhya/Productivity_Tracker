import { useState, useEffect } from "react";
import type { Goal, GoalType } from "../../services/goal.service";
import * as goalService from "../../services/goal.service";
import "./tracker.css";

export default function GoalPanel({ onClose }: { onClose: () => void }) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: "",
    description: "",
    type: "count" as GoalType,
    targetValue: "",
    unit: "",
    targetDate: ""
  });
  const [review, setReview] = useState({
    whatHelped: "",
    whatBlocked: "",
    notes: ""
  });

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      setLoading(true);
      const data = await goalService.getGoals();
      console.log("Loaded goals:", data);
      setGoals(data);
    } catch (error) {
      console.error("Failed to load goals:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await goalService.createGoal({
        title: newGoal.title,
        description: newGoal.description,
        type: newGoal.type,
        targetValue: parseFloat(newGoal.targetValue),
        unit: newGoal.unit || undefined,
        targetDate: newGoal.targetDate ? new Date(newGoal.targetDate) : undefined
      });
      setNewGoal({ title: "", description: "", type: "count", targetValue: "", unit: "", targetDate: "" });
      setShowAddForm(false);
      await loadGoals();
    } catch (error) {
      console.error("Failed to add goal:", error);
    }
  };

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal) return;
    try {
      await goalService.addReview(selectedGoal._id, review);
      setReview({ whatHelped: "", whatBlocked: "", notes: "" });
      setShowReviewForm(false);
      await loadGoals();
    } catch (error) {
      console.error("Failed to add review:", error);
    }
  };

  const handleDeleteGoal = async (id: string) => {
    if (!confirm("Delete this goal?")) return;
    try {
      await goalService.deleteGoal(id);
      await loadGoals();
    } catch (error) {
      console.error("Failed to delete goal:", error);
    }
  };

  const getGoalIcon = (type: GoalType) => {
    switch (type) {
      case "financial": return "💰";
      case "time": return "⏰";
      case "count": return "🔢";
      case "binary": return "✅";
      default: return "🎯";
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return "#00ff00";
    if (progress >= 75) return "#00ffff";
    if (progress >= 50) return "#ffaa00";
    return "#ff0000";
  };

  const calculateProgress = (goal: Goal) => {
    return Math.min((goal.currentValue / goal.targetValue) * 100, 100);
  };

  const getDaysRemaining = (goal: Goal) => {
    if (!goal.targetDate) return null;
    const today = new Date();
    const target = new Date(goal.targetDate);
    const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <div className="tracker-backdrop" onClick={onClose}>
      <div className="tracker-modal" onClick={(e) => e.stopPropagation()}>
        <div className="tracker-header">
          <h2>🎯 Goals</h2>
          <button onClick={onClose} className="tracker-close">
            ×
          </button>
        </div>

        <div className="tracker-content">

        {selectedGoal ? (
          <div>
            <button
              onClick={() => setSelectedGoal(null)}
              className="btn btn-back"
            >
              ← Back to Goals
            </button>

            <div className="detail-container">
              <div className="detail-header">
                <span className="detail-icon">{getGoalIcon(selectedGoal.type)}</span>
                <div>
                  <h3 style={{ color: "var(--accent)", margin: 0 }}>{selectedGoal.title}</h3>
                  {selectedGoal.description && <p style={{ color: "var(--text-secondary)", fontSize: "14px", margin: "4px 0 0 0" }}>{selectedGoal.description}</p>}
                </div>
              </div>

              <div className="progress-section">
                <div className="progress-label">
                  {selectedGoal.currentValue} / {selectedGoal.targetValue} {selectedGoal.unit}
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{
                    background: getProgressColor(calculateProgress(selectedGoal)),
                    width: `${calculateProgress(selectedGoal)}%`
                  }} />
                </div>
                <div className="progress-text" style={{ color: getProgressColor(calculateProgress(selectedGoal)) }}>
                  {calculateProgress(selectedGoal).toFixed(1)}% Complete
                </div>
              </div>

              {getDaysRemaining(selectedGoal) !== null && (
                <div style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
                  {getDaysRemaining(selectedGoal)! > 0 
                    ? `${getDaysRemaining(selectedGoal)} days remaining`
                    : getDaysRemaining(selectedGoal) === 0
                    ? "Due today!"
                    : `${Math.abs(getDaysRemaining(selectedGoal)!)} days overdue`
                  }
                </div>
              )}
            </div>

            {selectedGoal.milestones.length > 0 && (
              <div className="review-section">
                <h4 className="section-title">Milestones</h4>
                <div className="milestone-list">
                  {selectedGoal.milestones.map((milestone, idx) => (
                    <div key={idx} className="milestone-item">
                      <div className="item-icon">{milestone.completed ? "✅" : "⭕"}</div>
                      <div className="milestone-info">
                        <div style={{ color: milestone.completed ? "var(--success)" : "var(--text-primary)" }}>{milestone.title}</div>
                        <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Target: {milestone.targetValue} {selectedGoal.unit}</div>
                      </div>
                      {milestone.completed && milestone.completedAt && (
                        <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                          {new Date(milestone.completedAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="review-section">
              <div className="section-header">
                <h4 className="section-title">Reviews</h4>
                <button
                  onClick={() => setShowReviewForm(!showReviewForm)}
                  className="btn btn-primary"
                >
                  + Add Review
                </button>
              </div>

              {showReviewForm && (
                <form onSubmit={handleAddReview} className="form-container">
                  <textarea
                    placeholder="What helped you make progress?"
                    value={review.whatHelped}
                    onChange={(e) => setReview({ ...review, whatHelped: e.target.value })}
                    className="form-textarea"
                    required
                  />
                  <textarea
                    placeholder="What blocked your progress?"
                    value={review.whatBlocked}
                    onChange={(e) => setReview({ ...review, whatBlocked: e.target.value })}
                    className="form-textarea"
                    required
                  />
                  <textarea
                    placeholder="Additional notes..."
                    value={review.notes}
                    onChange={(e) => setReview({ ...review, notes: e.target.value })}
                    className="form-textarea"
                  />
                  <div className="form-actions">
                    <button type="submit" className="btn btn-primary">
                      Save Review
                    </button>
                    <button type="button" onClick={() => setShowReviewForm(false)} className="btn btn-secondary">
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {selectedGoal.reviews.length > 0 ? (
                <div className="review-list">
                  {selectedGoal.reviews.slice().reverse().map((rev, idx) => (
                    <div key={rev._id || idx} className="review-item">
                      <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "8px" }}>
                        {new Date(rev.date).toLocaleDateString()}
                      </div>
                      <div style={{ fontSize: "13px", color: "var(--success)", marginBottom: "4px" }}>
                        <strong>What helped:</strong> {rev.whatHelped}
                      </div>
                      <div style={{ fontSize: "13px", color: "var(--danger)", marginBottom: "4px" }}>
                        <strong>What blocked:</strong> {rev.whatBlocked}
                      </div>
                      {rev.notes && <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}><strong>Notes:</strong> {rev.notes}</div>}
                      <button
                        onClick={async () => {
                          if (!selectedGoal || !rev._id) {
                            console.log("Cannot delete: missing data", { selectedGoal: !!selectedGoal, reviewId: rev._id });
                            alert("Cannot delete: review doesn't have an ID. This review was created before the schema update.");
                            return;
                          }
                          if (!window.confirm("Delete this review?")) return;
                          try {
                            console.log("Deleting review:", { goalId: selectedGoal._id, reviewId: rev._id });
                            const updatedGoal = await goalService.deleteReview(selectedGoal._id, rev._id);
                            console.log("Delete successful, updated goal:", updatedGoal);
                            console.log("Reviews count before:", selectedGoal.reviews?.length, "after:", updatedGoal.reviews?.length);
                            
                            // Update selectedGoal immediately with the response
                            setSelectedGoal(updatedGoal);
                            
                            // Also update the goals list in the background
                            const freshGoals = await goalService.getGoals();
                            setGoals(freshGoals);
                            
                            // Find and set the updated goal from the fresh list to ensure consistency
                            const freshGoal = freshGoals.find(g => g._id === selectedGoal._id);
                            if (freshGoal) {
                              setSelectedGoal(freshGoal);
                            }
                          } catch (error) {
                            console.error("Failed to delete review:", error);
                            alert("Failed to delete review. Check console for details.");
                          }
                        }}
                        className="btn-icon danger"
                        title="Delete review"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">No reviews yet</div>
              )}
            </div>
          </div>
        ) : (
          <div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="btn btn-primary"
            >
              + Add Goal
            </button>

            {showAddForm && (
              <form onSubmit={handleAddGoal} className="form-container">
                <input
                  type="text"
                  placeholder="Goal Title"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                  className="form-input"
                  required
                />
                <textarea
                  placeholder="Description (optional)"
                  value={newGoal.description}
                  onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                  className="form-textarea"
                />
                <div className="form-grid">
                  <select
                    value={newGoal.type}
                    onChange={(e) => setNewGoal({ ...newGoal, type: e.target.value as GoalType })}
                    className="form-select"
                  >
                    <option value="count">Count</option>
                    <option value="financial">Financial</option>
                    <option value="time">Time</option>
                    <option value="binary">Yes/No</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Target Value"
                    value={newGoal.targetValue}
                    onChange={(e) => setNewGoal({ ...newGoal, targetValue: e.target.value })}
                    className="form-input"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Unit (e.g., km, hours)"
                    value={newGoal.unit}
                    onChange={(e) => setNewGoal({ ...newGoal, unit: e.target.value })}
                    className="form-input"
                  />
                </div>
                <input
                  type="date"
                  value={newGoal.targetDate}
                  onChange={(e) => setNewGoal({ ...newGoal, targetDate: e.target.value })}
                  className="form-input"
                />
                <div className="form-actions">
                  <button type="submit" className="btn btn-primary">
                    Create Goal
                  </button>
                  <button type="button" onClick={() => setShowAddForm(false)} className="btn btn-secondary">
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {loading ? (
              <div className="loading-state">Loading...</div>
            ) : goals.length > 0 ? (
              <div className="item-list">
                {goals.map(goal => {
                  const progress = calculateProgress(goal);
                  const daysLeft = getDaysRemaining(goal);
                  return (
                    <div
                      key={goal._id}
                      className="item-card"
                      onClick={() => setSelectedGoal(goal)}
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--accent)"}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = "transparent"}
                    >
                      <div className="item-header">
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span className="item-icon">{getGoalIcon(goal.type)}</span>
                          <div>
                            <div className="item-title">{goal.title}</div>
                            {daysLeft !== null && (
                              <div style={{ fontSize: "11px", color: daysLeft > 0 ? "var(--text-secondary)" : "var(--danger)" }}>
                                {daysLeft > 0 ? `${daysLeft}d left` : daysLeft === 0 ? "Due today" : `${Math.abs(daysLeft)}d overdue`}
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteGoal(goal._id);
                          }}
                          className="btn-icon danger"
                        >
                          ×
                        </button>
                      </div>
                      <div className="progress-label">
                        {goal.currentValue} / {goal.targetValue} {goal.unit}
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{
                          background: getProgressColor(progress),
                          width: `${progress}%`
                        }} />
                      </div>
                      <div className="progress-text" style={{ color: getProgressColor(progress) }}>
                        {progress.toFixed(1)}% complete
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state">
                No goals yet. Click "Add Goal" to get started!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
