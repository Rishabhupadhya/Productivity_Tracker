import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import type { Goal, GoalType } from "../services/goal.service";
import * as goalService from "../services/goal.service";

export default function Goals() {
  const navigate = useNavigate();
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
  const [progressInput, setProgressInput] = useState("");

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
      const updatedGoal = await goalService.getGoals("active");
      const updated = updatedGoal.find(g => g._id === selectedGoal._id);
      if (updated) setSelectedGoal(updated);
      await loadGoals();
    } catch (error) {
      console.error("Failed to add review:", error);
    }
  };

  const handleDeleteGoal = async (id: string) => {
    if (!confirm("Delete this goal?")) return;
    try {
      await goalService.deleteGoal(id);
      setSelectedGoal(null);
      await loadGoals();
    } catch (error) {
      console.error("Failed to delete goal:", error);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!selectedGoal || !confirm("Delete this review?")) return;
    try {
      const updatedGoal = await goalService.deleteReview(selectedGoal._id, reviewId);
      setSelectedGoal(updatedGoal);
      await loadGoals();
    } catch (error) {
      console.error("Failed to delete review:", error);
      alert('Failed to delete review');
    }
  };

  const handleUpdateProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal || !progressInput) return;
    try {
      const increment = parseFloat(progressInput);
      const updatedGoal = await goalService.updateGoalProgress(selectedGoal._id, increment);
      setSelectedGoal(updatedGoal);
      setProgressInput("");
      await loadGoals();
    } catch (error) {
      console.error("Failed to update progress:", error);
      alert('Failed to update progress');
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
    <AppLayout>
      <div style={{ padding: "24px", background: "#0b0f14", minHeight: "100%", color: "#fff", overflow: "auto" }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
          {!selectedGoal && (
            <div style={{ marginBottom: "32px", display: "flex", alignItems: "center", gap: "16px" }}>
              <button
                onClick={() => navigate("/dashboard")}
                style={{
                  padding: "12px 20px",
                  background: "#333",
                  color: "#00ffff",
                  border: "1px solid #00ffff",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "14px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}
              >
                ← Home
              </button>
              <div>
                <h1 style={{ color: "#00ffff", fontSize: "32px", marginBottom: "8px" }}>🎯 Goal Tracker</h1>
                <p style={{ color: "#888", fontSize: "14px" }}>Set and track your personal, financial, and professional goals</p>
              </div>
            </div>
          )}

          {selectedGoal ? (
          // Goal Detail View
          <div>
            <button
              onClick={() => setSelectedGoal(null)}
              style={{
                padding: "12px 24px",
                background: "#333",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                marginBottom: "24px",
                fontSize: "14px"
              }}
            >
              ← Back to Goals
            </button>

            <div style={{ padding: "32px", background: "#1a1a1a", borderRadius: "12px", marginBottom: "24px", border: "1px solid #00ffff" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px" }}>
                <span style={{ fontSize: "48px" }}>{getGoalIcon(selectedGoal.type)}</span>
                <div style={{ flex: 1 }}>
                  <h2 style={{ color: "#00ffff", margin: 0, fontSize: "28px" }}>{selectedGoal.title}</h2>
                  {selectedGoal.description && <p style={{ color: "#888", fontSize: "14px", margin: "8px 0 0 0" }}>{selectedGoal.description}</p>}
                </div>
                <button
                  onClick={() => handleDeleteGoal(selectedGoal._id)}
                  style={{ padding: "8px 16px", background: "#ff0000", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px" }}
                >
                  Delete Goal
                </button>
              </div>

              <div style={{ marginBottom: "24px" }}>
                <div style={{ fontSize: "16px", color: "#888", marginBottom: "12px" }}>
                  {selectedGoal.currentValue} / {selectedGoal.targetValue} {selectedGoal.unit}
                </div>
                <div style={{ background: "#0a0a0a", height: "20px", borderRadius: "10px", overflow: "hidden" }}>
                  <div style={{
                    background: getProgressColor(calculateProgress(selectedGoal)),
                    height: "100%",
                    width: `${calculateProgress(selectedGoal)}%`,
                    transition: "width 0.3s"
                  }} />
                </div>
                <div style={{ fontSize: "24px", color: getProgressColor(calculateProgress(selectedGoal)), marginTop: "12px", fontWeight: "bold" }}>
                  {calculateProgress(selectedGoal).toFixed(1)}% Complete
                </div>
              </div>

              {/* Update Progress */}
              <form onSubmit={handleUpdateProgress} style={{ marginBottom: "24px", padding: "20px", background: "#0a0a0a", borderRadius: "8px" }}>
                <div style={{ fontSize: "14px", color: "#00ffff", marginBottom: "12px", fontWeight: "500" }}>Update Progress</div>
                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                  <input
                    type="number"
                    step="any"
                    placeholder={`Add ${selectedGoal.unit || 'value'}`}
                    value={progressInput}
                    onChange={(e) => setProgressInput(e.target.value)}
                    style={{ flex: 1, padding: "12px", background: "#1a1a1a", border: "1px solid #00ffff", borderRadius: "8px", color: "#00ffff", fontSize: "14px" }}
                  />
                  <button 
                    type="submit"
                    style={{ padding: "12px 24px", background: "#00ffff", color: "#000", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: "14px" }}
                  >
                    Add Progress
                  </button>
                </div>
                <div style={{ fontSize: "12px", color: "#666", marginTop: "8px" }}>
                  Enter the amount to add to your current progress ({selectedGoal.currentValue} {selectedGoal.unit})
                </div>
              </form>

              {getDaysRemaining(selectedGoal) !== null && (
                <div style={{ padding: "16px", background: "#0a0a0a", borderRadius: "8px", marginBottom: "16px" }}>
                  <div style={{ fontSize: "14px", color: "#00ffff", marginBottom: "4px" }}>Target Date</div>
                  <div style={{ fontSize: "16px", color: getDaysRemaining(selectedGoal)! > 0 ? "#fff" : "#ff0000" }}>
                    {new Date(selectedGoal.targetDate!).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                  <div style={{ fontSize: "14px", color: getDaysRemaining(selectedGoal)! > 0 ? "#888" : "#ff0000", marginTop: "4px" }}>
                    {getDaysRemaining(selectedGoal)! > 0 
                      ? `${getDaysRemaining(selectedGoal)} days remaining`
                      : getDaysRemaining(selectedGoal) === 0
                      ? "Due today!"
                      : `${Math.abs(getDaysRemaining(selectedGoal)!)} days overdue`
                    }
                  </div>
                </div>
              )}
            </div>

            {/* Milestones */}
            {selectedGoal.milestones.length > 0 && (
              <div style={{ marginBottom: "24px" }}>
                <h3 style={{ color: "#00ffff", marginBottom: "16px", fontSize: "20px" }}>🏆 Milestones</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {selectedGoal.milestones.map((milestone, idx) => (
                    <div key={idx} style={{ padding: "20px", background: "#1a1a1a", borderRadius: "8px", display: "flex", alignItems: "center", gap: "16px", border: milestone.completed ? "1px solid #00ff00" : "1px solid #333" }}>
                      <div style={{ fontSize: "32px" }}>{milestone.completed ? "✅" : "⭕"}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: milestone.completed ? "#00ff00" : "#fff", fontSize: "16px", fontWeight: "500", marginBottom: "4px" }}>{milestone.title}</div>
                        <div style={{ fontSize: "14px", color: "#666" }}>Target: {milestone.targetValue} {selectedGoal.unit}</div>
                      </div>
                      {milestone.completed && milestone.completedAt && (
                        <div style={{ fontSize: "12px", color: "#666" }}>
                          Completed: {new Date(milestone.completedAt).toLocaleDateString('en-IN')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h3 style={{ color: "#00ffff", margin: 0, fontSize: "20px" }}>📝 Progress Reviews</h3>
                <button
                  onClick={() => setShowReviewForm(!showReviewForm)}
                  style={{
                    padding: "8px 16px",
                    background: "#00ffff",
                    color: "#000",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "bold"
                  }}
                >
                  + Add Review
                </button>
              </div>

              {showReviewForm && (
                <form onSubmit={handleAddReview} style={{ marginBottom: "24px", padding: "24px", background: "#1a1a1a", borderRadius: "8px" }}>
                  <textarea
                    placeholder="What helped you make progress?"
                    value={review.whatHelped}
                    onChange={(e) => setReview({ ...review, whatHelped: e.target.value })}
                    style={{ width: "100%", padding: "12px", background: "#0a0a0a", border: "1px solid #00ffff", borderRadius: "8px", color: "#00ffff", marginBottom: "16px", minHeight: "80px", fontSize: "14px" }}
                    required
                  />
                  <textarea
                    placeholder="What blocked your progress?"
                    value={review.whatBlocked}
                    onChange={(e) => setReview({ ...review, whatBlocked: e.target.value })}
                    style={{ width: "100%", padding: "12px", background: "#0a0a0a", border: "1px solid #00ffff", borderRadius: "8px", color: "#00ffff", marginBottom: "16px", minHeight: "80px", fontSize: "14px" }}
                    required
                  />
                  <textarea
                    placeholder="Additional notes..."
                    value={review.notes}
                    onChange={(e) => setReview({ ...review, notes: e.target.value })}
                    style={{ width: "100%", padding: "12px", background: "#0a0a0a", border: "1px solid #00ffff", borderRadius: "8px", color: "#00ffff", marginBottom: "16px", minHeight: "80px", fontSize: "14px" }}
                  />
                  <div style={{ display: "flex", gap: "12px" }}>
                    <button type="submit" style={{ padding: "12px 24px", background: "#00ffff", color: "#000", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: "14px" }}>
                      Save Review
                    </button>
                    <button type="button" onClick={() => setShowReviewForm(false)} style={{ padding: "12px 24px", background: "#333", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px" }}>
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {selectedGoal.reviews.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {selectedGoal.reviews.slice().reverse().map((rev) => (
                    <div key={rev._id} style={{ padding: "20px", background: "#1a1a1a", borderRadius: "8px", position: "relative" }}>
                      <button
                        onClick={() => handleDeleteReview(rev._id)}
                        style={{
                          position: "absolute",
                          top: "12px",
                          right: "12px",
                          background: "#ff4444",
                          color: "#fff",
                          border: "none",
                          borderRadius: "6px",
                          padding: "6px 12px",
                          cursor: "pointer",
                          fontSize: "12px",
                          fontWeight: "bold"
                        }}
                      >
                        Delete
                      </button>
                      <div style={{ fontSize: "12px", color: "#666", marginBottom: "12px" }}>
                        {new Date(rev.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </div>
                      <div style={{ fontSize: "14px", color: "#00ff00", marginBottom: "8px" }}>
                        <strong>✅ What helped:</strong> {rev.whatHelped}
                      </div>
                      <div style={{ fontSize: "14px", color: "#ff0000", marginBottom: "8px" }}>
                        <strong>🚫 What blocked:</strong> {rev.whatBlocked}
                      </div>
                      {rev.notes && <div style={{ fontSize: "14px", color: "#888" }}><strong>📌 Notes:</strong> {rev.notes}</div>}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: "center", color: "#666", padding: "40px", background: "#1a1a1a", borderRadius: "8px" }}>
                  No reviews yet. Add your first review to track your progress and learnings.
                </div>
              )}
            </div>
          </div>
        ) : (
          // Goals List
          <div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              style={{
                padding: "12px 24px",
                background: "#00ffff",
                color: "#000",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                marginBottom: "24px",
                fontWeight: "bold",
                fontSize: "14px"
              }}
            >
              + Create Goal
            </button>

            {showAddForm && (
              <form onSubmit={handleAddGoal} style={{ marginBottom: "32px", padding: "24px", background: "#1a1a1a", borderRadius: "8px" }}>
                <input
                  type="text"
                  placeholder="Goal Title"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                  style={{ width: "100%", padding: "12px", background: "#0a0a0a", border: "1px solid #00ffff", borderRadius: "8px", color: "#00ffff", marginBottom: "16px", fontSize: "14px" }}
                  required
                />
                <textarea
                  placeholder="Description (optional)"
                  value={newGoal.description}
                  onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                  style={{ width: "100%", padding: "12px", background: "#0a0a0a", border: "1px solid #00ffff", borderRadius: "8px", color: "#00ffff", marginBottom: "16px", minHeight: "80px", fontSize: "14px" }}
                />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                  <select
                    value={newGoal.type}
                    onChange={(e) => setNewGoal({ ...newGoal, type: e.target.value as GoalType })}
                    style={{ padding: "12px", background: "#0a0a0a", border: "1px solid #00ffff", borderRadius: "8px", color: "#00ffff", fontSize: "14px" }}
                  >
                    <option value="count">Count Goal</option>
                    <option value="financial">Financial Goal</option>
                    <option value="time">Time-based Goal</option>
                    <option value="binary">Yes/No Goal</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Target Value"
                    value={newGoal.targetValue}
                    onChange={(e) => setNewGoal({ ...newGoal, targetValue: e.target.value })}
                    style={{ padding: "12px", background: "#0a0a0a", border: "1px solid #00ffff", borderRadius: "8px", color: "#00ffff", fontSize: "14px" }}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Unit (e.g., km, hours, ₹)"
                    value={newGoal.unit}
                    onChange={(e) => setNewGoal({ ...newGoal, unit: e.target.value })}
                    style={{ padding: "12px", background: "#0a0a0a", border: "1px solid #00ffff", borderRadius: "8px", color: "#00ffff", fontSize: "14px" }}
                  />
                </div>
                <input
                  type="date"
                  value={newGoal.targetDate}
                  onChange={(e) => setNewGoal({ ...newGoal, targetDate: e.target.value })}
                  style={{ width: "100%", padding: "12px", background: "#0a0a0a", border: "1px solid #00ffff", borderRadius: "8px", color: "#00ffff", marginBottom: "16px", fontSize: "14px" }}
                />
                <div style={{ display: "flex", gap: "12px" }}>
                  <button type="submit" style={{ padding: "12px 24px", background: "#00ffff", color: "#000", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: "14px" }}>
                    Create Goal
                  </button>
                  <button type="button" onClick={() => setShowAddForm(false)} style={{ padding: "12px 24px", background: "#333", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px" }}>
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {loading ? (
              <div style={{ textAlign: "center", color: "#00ffff", padding: "80px" }}>Loading...</div>
            ) : goals.length > 0 ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "16px" }}>
                {goals.map(goal => {
                  const progress = calculateProgress(goal);
                  const daysLeft = getDaysRemaining(goal);
                  return (
                    <div
                      key={goal._id}
                      style={{ padding: "24px", background: "#1a1a1a", borderRadius: "12px", cursor: "pointer", border: "1px solid transparent", transition: "border-color 0.2s" }}
                      onClick={() => setSelectedGoal(goal)}
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = "#00ffff"}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = "transparent"}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <span style={{ fontSize: "32px" }}>{getGoalIcon(goal.type)}</span>
                          <div>
                            <div style={{ color: "#fff", fontSize: "18px", fontWeight: "500" }}>{goal.title}</div>
                            {daysLeft !== null && (
                              <div style={{ fontSize: "12px", color: daysLeft > 0 ? "#888" : "#ff0000", marginTop: "4px" }}>
                                {daysLeft > 0 ? `${daysLeft} days left` : daysLeft === 0 ? "Due today" : `${Math.abs(daysLeft)} days overdue`}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div style={{ fontSize: "14px", color: "#888", marginBottom: "12px" }}>
                        {goal.currentValue} / {goal.targetValue} {goal.unit}
                      </div>
                      <div style={{ background: "#0a0a0a", height: "10px", borderRadius: "5px", overflow: "hidden", marginBottom: "8px" }}>
                        <div style={{
                          background: getProgressColor(progress),
                          height: "100%",
                          width: `${progress}%`,
                          transition: "width 0.3s"
                        }} />
                      </div>
                      <div style={{ fontSize: "14px", color: getProgressColor(progress), fontWeight: "bold" }}>
                        {progress.toFixed(1)}% complete
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: "center", color: "#666", padding: "80px", background: "#1a1a1a", borderRadius: "8px" }}>
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>🎯</div>
                <h3 style={{ marginBottom: "12px" }}>No goals yet</h3>
                <p style={{ fontSize: "14px", maxWidth: "400px", margin: "0 auto" }}>
                  Create your first goal to start tracking your progress towards what matters most.
                </p>
              </div>
            )}
          </div>
        )}
        </div>
      </div>
    </AppLayout>
  );
}
