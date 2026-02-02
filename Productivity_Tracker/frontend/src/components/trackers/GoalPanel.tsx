import { useState, useEffect } from "react";
import type { Goal, GoalType } from "../../services/goal.service";
import * as goalService from "../../services/goal.service";

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
      const data = await goalService.getGoals("active");
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
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        style={{ 
          background: "#1a1a1a", 
          padding: "24px", 
          borderradius: "8px", 
          border: "1px solid #00ffff",
          maxWidth: "900px",
          width: "90%",
          maxHeight: "85vh",
          overflow: "auto"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ color: "#00ffff", margin: 0 }}>🎯 Goals</h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#00ffff",
              fontSize: "24px",
              cursor: "pointer",
              padding: "0"
            }}
          >
            ×
          </button>
        </div>

        {selectedGoal ? (
          <div>
            <button
              onClick={() => setSelectedGoal(null)}
              style={{
                padding: "8px 16px",
                background: "#333",
                color: "#fff",
                border: "none",
                borderradius: "4px",
                cursor: "pointer",
                marginBottom: "16px"
              }}
            >
              ← Back to Goals
            </button>

            <div style={{ padding: "20px", background: "#0a0a0a", borderradius: "8px", marginBottom: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                <span style={{ fontSize: "32px" }}>{getGoalIcon(selectedGoal.type)}</span>
                <div>
                  <h3 style={{ color: "#00ffff", margin: 0 }}>{selectedGoal.title}</h3>
                  {selectedGoal.description && <p style={{ color: "#888", fontSize: "14px", margin: "4px 0 0 0" }}>{selectedGoal.description}</p>}
                </div>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <div style={{ fontSize: "14px", color: "#888", marginBottom: "8px" }}>
                  {selectedGoal.currentValue} / {selectedGoal.targetValue} {selectedGoal.unit}
                </div>
                <div style={{ background: "#1a1a1a", height: "12px", borderradius: "6px", overflow: "hidden" }}>
                  <div style={{
                    background: getProgressColor(calculateProgress(selectedGoal)),
                    height: "100%",
                    width: `${calculateProgress(selectedGoal)}%`,
                    transition: "width 0.3s"
                  }} />
                </div>
                <div style={{ fontSize: "18px", color: getProgressColor(calculateProgress(selectedGoal)), marginTop: "8px", fontWeight: "bold" }}>
                  {calculateProgress(selectedGoal).toFixed(1)}% Complete
                </div>
              </div>

              {getDaysRemaining(selectedGoal) !== null && (
                <div style={{ fontSize: "14px", color: "#888" }}>
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
              <div style={{ marginBottom: "20px" }}>
                <h4 style={{ color: "#00ffff", marginBottom: "12px" }}>Milestones</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {selectedGoal.milestones.map((milestone, idx) => (
                    <div key={idx} style={{ padding: "12px", background: "#0a0a0a", borderradius: "8px", display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ fontSize: "20px" }}>{milestone.completed ? "✅" : "⭕"}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: milestone.completed ? "#00ff00" : "#fff" }}>{milestone.title}</div>
                        <div style={{ fontSize: "12px", color: "#666" }}>Target: {milestone.targetValue} {selectedGoal.unit}</div>
                      </div>
                      {milestone.completed && milestone.completedAt && (
                        <div style={{ fontSize: "11px", color: "#666" }}>
                          {new Date(milestone.completedAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginBottom: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <h4 style={{ color: "#00ffff", margin: 0 }}>Reviews</h4>
                <button
                  onClick={() => setShowReviewForm(!showReviewForm)}
                  style={{
                    padding: "6px 12px",
                    background: "#00ffff",
                    color: "#000",
                    border: "none",
                    borderradius: "4px",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: "bold"
                  }}
                >
                  + Add Review
                </button>
              </div>

              {showReviewForm && (
                <form onSubmit={handleAddReview} style={{ marginBottom: "16px", padding: "16px", background: "#0a0a0a", borderradius: "8px" }}>
                  <textarea
                    placeholder="What helped you make progress?"
                    value={review.whatHelped}
                    onChange={(e) => setReview({ ...review, whatHelped: e.target.value })}
                    style={{ width: "100%", padding: "8px", background: "#1a1a1a", border: "1px solid #00ffff", borderradius: "4px", color: "#00ffff", marginBottom: "12px", minHeight: "60px" }}
                    required
                  />
                  <textarea
                    placeholder="What blocked your progress?"
                    value={review.whatBlocked}
                    onChange={(e) => setReview({ ...review, whatBlocked: e.target.value })}
                    style={{ width: "100%", padding: "8px", background: "#1a1a1a", border: "1px solid #00ffff", borderradius: "4px", color: "#00ffff", marginBottom: "12px", minHeight: "60px" }}
                    required
                  />
                  <textarea
                    placeholder="Additional notes..."
                    value={review.notes}
                    onChange={(e) => setReview({ ...review, notes: e.target.value })}
                    style={{ width: "100%", padding: "8px", background: "#1a1a1a", border: "1px solid #00ffff", borderradius: "4px", color: "#00ffff", marginBottom: "12px", minHeight: "60px" }}
                  />
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button type="submit" style={{ padding: "8px 16px", background: "#00ffff", color: "#000", border: "none", borderradius: "4px", cursor: "pointer", fontWeight: "bold" }}>
                      Save Review
                    </button>
                    <button type="button" onClick={() => setShowReviewForm(false)} style={{ padding: "8px 16px", background: "#333", color: "#fff", border: "none", borderradius: "4px", cursor: "pointer" }}>
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {selectedGoal.reviews.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {selectedGoal.reviews.slice().reverse().map((rev, idx) => (
                    <div key={idx} style={{ padding: "12px", background: "#0a0a0a", borderradius: "8px" }}>
                      <div style={{ fontSize: "11px", color: "#666", marginBottom: "8px" }}>
                        {new Date(rev.date).toLocaleDateString()}
                      </div>
                      <div style={{ fontSize: "13px", color: "#00ff00", marginBottom: "4px" }}>
                        <strong>What helped:</strong> {rev.whatHelped}
                      </div>
                      <div style={{ fontSize: "13px", color: "#ff0000", marginBottom: "4px" }}>
                        <strong>What blocked:</strong> {rev.whatBlocked}
                      </div>
                      {rev.notes && <div style={{ fontSize: "13px", color: "#888" }}><strong>Notes:</strong> {rev.notes}</div>}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: "center", color: "#666", padding: "20px" }}>No reviews yet</div>
              )}
            </div>
          </div>
        ) : (
          <div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              style={{
                padding: "8px 16px",
                background: "#00ffff",
                color: "#000",
                border: "none",
                borderradius: "4px",
                cursor: "pointer",
                marginBottom: "16px",
                fontWeight: "bold"
              }}
            >
              + Add Goal
            </button>

            {showAddForm && (
              <form onSubmit={handleAddGoal} style={{ marginBottom: "20px", padding: "16px", background: "#0a0a0a", borderradius: "8px" }}>
                <input
                  type="text"
                  placeholder="Goal Title"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                  style={{ width: "100%", padding: "8px", background: "#1a1a1a", border: "1px solid #00ffff", borderradius: "4px", color: "#00ffff", marginBottom: "12px" }}
                  required
                />
                <textarea
                  placeholder="Description (optional)"
                  value={newGoal.description}
                  onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                  style={{ width: "100%", padding: "8px", background: "#1a1a1a", border: "1px solid #00ffff", borderradius: "4px", color: "#00ffff", marginBottom: "12px", minHeight: "60px" }}
                />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                  <select
                    value={newGoal.type}
                    onChange={(e) => setNewGoal({ ...newGoal, type: e.target.value as GoalType })}
                    style={{ padding: "8px", background: "#1a1a1a", border: "1px solid #00ffff", borderradius: "4px", color: "#00ffff" }}
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
                    style={{ padding: "8px", background: "#1a1a1a", border: "1px solid #00ffff", borderradius: "4px", color: "#00ffff" }}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Unit (e.g., km, hours)"
                    value={newGoal.unit}
                    onChange={(e) => setNewGoal({ ...newGoal, unit: e.target.value })}
                    style={{ padding: "8px", background: "#1a1a1a", border: "1px solid #00ffff", borderradius: "4px", color: "#00ffff" }}
                  />
                </div>
                <input
                  type="date"
                  value={newGoal.targetDate}
                  onChange={(e) => setNewGoal({ ...newGoal, targetDate: e.target.value })}
                  style={{ width: "100%", padding: "8px", background: "#1a1a1a", border: "1px solid #00ffff", borderradius: "4px", color: "#00ffff", marginBottom: "12px" }}
                />
                <div style={{ display: "flex", gap: "8px" }}>
                  <button type="submit" style={{ padding: "8px 16px", background: "#00ffff", color: "#000", border: "none", borderradius: "4px", cursor: "pointer", fontWeight: "bold" }}>
                    Create Goal
                  </button>
                  <button type="button" onClick={() => setShowAddForm(false)} style={{ padding: "8px 16px", background: "#333", color: "#fff", border: "none", borderradius: "4px", cursor: "pointer" }}>
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {loading ? (
              <div style={{ textAlign: "center", color: "#00ffff", padding: "40px" }}>Loading...</div>
            ) : goals.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {goals.map(goal => {
                  const progress = calculateProgress(goal);
                  const daysLeft = getDaysRemaining(goal);
                  return (
                    <div
                      key={goal._id}
                      style={{ padding: "16px", background: "#0a0a0a", borderradius: "8px", cursor: "pointer", border: "1px solid transparent", transition: "border-color 0.2s" }}
                      onClick={() => setSelectedGoal(goal)}
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = "#00ffff"}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = "transparent"}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "24px" }}>{getGoalIcon(goal.type)}</span>
                          <div>
                            <div style={{ color: "#fff", fontSize: "16px" }}>{goal.title}</div>
                            {daysLeft !== null && (
                              <div style={{ fontSize: "11px", color: daysLeft > 0 ? "#888" : "#ff0000" }}>
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
                          style={{ background: "none", border: "none", color: "#ff0000", cursor: "pointer", fontSize: "18px" }}
                        >
                          ×
                        </button>
                      </div>
                      <div style={{ fontSize: "12px", color: "#888", marginBottom: "8px" }}>
                        {goal.currentValue} / {goal.targetValue} {goal.unit}
                      </div>
                      <div style={{ background: "#1a1a1a", height: "8px", borderradius: "4px", overflow: "hidden" }}>
                        <div style={{
                          background: getProgressColor(progress),
                          height: "100%",
                          width: `${progress}%`,
                          transition: "width 0.3s"
                        }} />
                      </div>
                      <div style={{ fontSize: "12px", color: getProgressColor(progress), marginTop: "4px" }}>
                        {progress.toFixed(1)}% complete
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: "center", color: "#666", padding: "40px" }}>
                No goals yet. Click "Add Goal" to get started!
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
