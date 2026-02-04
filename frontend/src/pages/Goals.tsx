import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { Goal, GoalType } from "../services/goal.service";
import * as goalService from "../services/goal.service";
import "./pages.css";

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
      await goalService.deleteReview(selectedGoal._id, reviewId);
      const freshGoals = await goalService.getGoals();
      setGoals(freshGoals);
      const freshGoal = freshGoals.find(g => g._id === selectedGoal._id);
      if (freshGoal) setSelectedGoal({ ...freshGoal });
    } catch (error) {
      console.error("Failed to delete review:", error);
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
    if (progress >= 100) return "var(--success)";
    if (progress >= 75) return "var(--accent)";
    if (progress >= 50) return "var(--warning)";
    return "var(--danger)";
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
    <div className="page-container">
      <div className="page-inner">
        {!selectedGoal && (
          <div className="page-header">
            <button className="page-header-back-btn" onClick={() => navigate("/dashboard")}>
              ← Home
            </button>
            <div>
              <h1 className="page-header-title">🎯 Goal Tracker</h1>
              <p className="page-header-subtitle">Set and track your personal, financial, and professional goals</p>
            </div>
          </div>
        )}

        {selectedGoal ? (
          // Goal Detail View
          <div>
            <button className="btn-secondary" onClick={() => setSelectedGoal(null)} style={{ marginBottom: "var(--space-2xl)" }}>
              ← Back to Goals
            </button>

            <div className="card card-elevated" style={{ marginBottom: "var(--space-2xl)" }}>
              <div className="flex-between" style={{ marginBottom: "var(--space-lg)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-lg)" }}>
                  <span style={{ fontSize: "48px" }}>{getGoalIcon(selectedGoal.type)}</span>
                  <div>
                    <h2 style={{ color: "var(--accent)", margin: 0, fontSize: "var(--text-2xl)", fontWeight: "var(--font-bold)" }}>{selectedGoal.title}</h2>
                    {selectedGoal.description && <p style={{ color: "var(--text-muted)", fontSize: "var(--text-sm)", margin: "var(--space-sm) 0 0 0" }}>{selectedGoal.description}</p>}
                  </div>
                </div>
                <button className="btn-danger" onClick={() => handleDeleteGoal(selectedGoal._id)}>
                  Delete Goal
                </button>
              </div>

              <div style={{ marginBottom: "var(--space-xl)" }}>
                <div style={{ fontSize: "var(--text-lg)", color: "var(--text-secondary)", marginBottom: "var(--space-md)", fontWeight: "var(--font-medium)" }}>
                  {selectedGoal.currentValue} / {selectedGoal.targetValue} {selectedGoal.unit}
                </div>
                <div className="progress-bar-container">
                  <div className="progress-bar-fill" style={{
                    background: getProgressColor(calculateProgress(selectedGoal)),
                    width: `${calculateProgress(selectedGoal)}%`
                  }} />
                </div>
                <div style={{ fontSize: "var(--text-2xl)", color: getProgressColor(calculateProgress(selectedGoal)), marginTop: "var(--space-md)", fontWeight: "var(--font-bold)" }}>
                  {calculateProgress(selectedGoal).toFixed(1)}% Complete
                </div>
              </div>

              <form onSubmit={handleUpdateProgress} className="card" style={{ background: "var(--bg-tertiary)" }}>
                <div style={{ fontSize: "var(--text-sm)", color: "var(--accent)", marginBottom: "var(--space-md)", fontWeight: "var(--font-medium)" }}>Update Progress</div>
                <div className="flex-gap">
                  <input
                    type="number"
                    step="any"
                    placeholder={`Add ${selectedGoal.unit || 'value'}`}
                    value={progressInput}
                    onChange={(e) => setProgressInput(e.target.value)}
                    className="form-input"
                    style={{ flex: 1 }}
                  />
                  <button type="submit" className="btn-primary">
                    Add Progress
                  </button>
                </div>
                <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", marginTop: "var(--space-sm)" }}>
                  Enter the amount to add to your current progress ({selectedGoal.currentValue} {selectedGoal.unit})
                </div>
              </form>

              {getDaysRemaining(selectedGoal) !== null && (
                <div className="stat-card" style={{ marginTop: "var(--space-lg)" }}>
                  <div className="stat-label">Target Date</div>
                  <div style={{ fontSize: "var(--text-lg)", color: getDaysRemaining(selectedGoal)! > 0 ? "var(--text-primary)" : "var(--danger)", marginBottom: "var(--space-sm)" }}>
                    {new Date(selectedGoal.targetDate!).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                  <div style={{ fontSize: "var(--text-sm)", color: getDaysRemaining(selectedGoal)! > 0 ? "var(--text-muted)" : "var(--danger)" }}>
                    {getDaysRemaining(selectedGoal)! > 0
                      ? `${getDaysRemaining(selectedGoal)} days remaining`
                      : getDaysRemaining(selectedGoal) === 0 ? "Due today!" : `${Math.abs(getDaysRemaining(selectedGoal)!)} days overdue`
                    }
                  </div>
                </div>
              )}
            </div>

            {/* Milestones */}
            {selectedGoal.milestones.length > 0 && (
              <div style={{ marginBottom: "var(--space-2xl)" }}>
                <h3 style={{ color: "var(--accent)", marginBottom: "var(--space-lg)", fontSize: "var(--text-xl)" }}>🏆 Milestones</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
                  {selectedGoal.milestones.map((milestone, idx) => (
                    <div key={idx} className="card" style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--space-lg)",
                      borderColor: milestone.completed ? "var(--success)" : "var(--border-default)"
                    }}>
                      <div style={{ fontSize: "32px" }}>{milestone.completed ? "✅" : "⭕"}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: milestone.completed ? "var(--success)" : "var(--text-primary)", fontSize: "var(--text-lg)", fontWeight: "var(--font-medium)", marginBottom: "var(--space-xs)" }}>{milestone.title}</div>
                        <div style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>Target: {milestone.targetValue} {selectedGoal.unit}</div>
                      </div>
                      {milestone.completed && milestone.completedAt && (
                        <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
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
              <div className="flex-between" style={{ marginBottom: "var(--space-lg)" }}>
                <h3 style={{ color: "var(--accent)", margin: 0, fontSize: "var(--text-xl)" }}>📝 Progress Reviews</h3>
                <button className="btn-primary" onClick={() => setShowReviewForm(!showReviewForm)}>
                  + Add Review
                </button>
              </div>

              {showReviewForm && (
                <form onSubmit={handleAddReview} className="card" style={{ marginBottom: "var(--space-xl)", background: "var(--bg-tertiary)" }}>
                  <textarea
                    placeholder="What helped you make progress?"
                    value={review.whatHelped}
                    onChange={(e) => setReview({ ...review, whatHelped: e.target.value })}
                    className="form-textarea"
                    style={{ marginBottom: "var(--space-lg)" }}
                    required
                  />
                  <textarea
                    placeholder="What blocked your progress?"
                    value={review.whatBlocked}
                    onChange={(e) => setReview({ ...review, whatBlocked: e.target.value })}
                    className="form-textarea"
                    style={{ marginBottom: "var(--space-lg)" }}
                    required
                  />
                  <textarea
                    placeholder="Additional notes..."
                    value={review.notes}
                    onChange={(e) => setReview({ ...review, notes: e.target.value })}
                    className="form-textarea"
                    style={{ marginBottom: "var(--space-lg)" }}
                  />
                  <div className="flex-gap">
                    <button type="submit" className="btn-primary">Save Review</button>
                    <button type="button" className="btn-secondary" onClick={() => setShowReviewForm(false)}>Cancel</button>
                  </div>
                </form>
              )}

              {selectedGoal.reviews.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }} key={`reviews-${selectedGoal.reviews.length}`}>
                  {selectedGoal.reviews.slice().reverse().map((rev, idx) => (
                    <div key={`${rev._id}-${idx}`} className="card" style={{ position: "relative" }}>
                      <button
                        onClick={() => handleDeleteReview(rev._id)}
                        className="btn-danger"
                        style={{
                          position: "absolute",
                          top: "var(--space-md)",
                          right: "var(--space-md)",
                          padding: "6px 12px",
                          fontSize: "var(--text-xs)"
                        }}
                      >
                        Delete
                      </button>
                      <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", marginBottom: "var(--space-md)" }}>
                        {new Date(rev.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </div>
                      <div style={{ fontSize: "var(--text-sm)", color: "var(--success)", marginBottom: "var(--space-sm)" }}>
                        <strong>✅ What helped:</strong> {rev.whatHelped}
                      </div>
                      <div style={{ fontSize: "var(--text-sm)", color: "var(--danger)", marginBottom: "var(--space-sm)" }}>
                        <strong>🚫 What blocked:</strong> {rev.whatBlocked}
                      </div>
                      {rev.notes && <div style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)" }}><strong>📌 Notes:</strong> {rev.notes}</div>}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  No reviews yet. Add your first review to track your progress and learnings.
                </div>
              )}
            </div>
          </div>
        ) : (
          // Goals List
          <div>
            <button className="btn-primary" onClick={() => setShowAddForm(!showAddForm)} style={{ marginBottom: "var(--space-2xl)" }}>
              + Create Goal
            </button>

            {showAddForm && (
              <form onSubmit={handleAddGoal} className="card" style={{ marginBottom: "var(--space-2xl)" }}>
                <input
                  type="text"
                  placeholder="Goal Title"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                  className="form-input"
                  style={{ marginBottom: "var(--space-lg)" }}
                  required
                />
                <textarea
                  placeholder="Description (optional)"
                  value={newGoal.description}
                  onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                  className="form-textarea"
                  style={{ marginBottom: "var(--space-lg)" }}
                />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--space-lg)", marginBottom: "var(--space-lg)" }}>
                  <select
                    value={newGoal.type}
                    onChange={(e) => setNewGoal({ ...newGoal, type: e.target.value as GoalType })}
                    className="form-select"
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
                    className="form-input"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Unit (e.g., km, hours, ₹)"
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
                  style={{ marginBottom: "var(--space-lg)" }}
                />
                <div className="flex-gap">
                  <button type="submit" className="btn-primary">Create Goal</button>
                  <button type="button" className="btn-secondary" onClick={() => setShowAddForm(false)}>Cancel</button>
                </div>
              </form>
            )}

            {loading ? (
              <div className="loading-state">Loading...</div>
            ) : goals.length > 0 ? (
              <div className="list-grid">
                {goals.map(goal => {
                  const progress = calculateProgress(goal);
                  const daysLeft = getDaysRemaining(goal);
                  return (
                    <div
                      key={goal._id}
                      className="card"
                      onClick={() => setSelectedGoal(goal)}
                      style={{ cursor: "pointer" }}
                    >
                      <div className="flex-between" style={{ marginBottom: "var(--space-md)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-md)" }}>
                          <span style={{ fontSize: "32px" }}>{getGoalIcon(goal.type)}</span>
                          <div>
                            <div style={{ color: "var(--text-primary)", fontSize: "var(--text-lg)", fontWeight: "var(--font-medium)" }}>{goal.title}</div>
                            {daysLeft !== null && (
                              <div style={{ fontSize: "var(--text-xs)", color: daysLeft > 0 ? "var(--text-muted)" : "var(--danger)", marginTop: "var(--space-xs)" }}>
                                {daysLeft > 0 ? `${daysLeft} days left` : daysLeft === 0 ? "Due today" : `${Math.abs(daysLeft)} days overdue`}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)", marginBottom: "var(--space-md)" }}>
                        {goal.currentValue} / {goal.targetValue} {goal.unit}
                      </div>
                      <div className="progress-bar-container" style={{ height: "10px", marginBottom: "var(--space-sm)" }}>
                        <div className="progress-bar-fill" style={{
                          background: getProgressColor(progress),
                          width: `${progress}%`
                        }} />
                      </div>
                      <div style={{ fontSize: "var(--text-sm)", color: getProgressColor(progress), fontWeight: "var(--font-bold)" }}>
                        {progress.toFixed(1)}% complete
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">🎯</div>
                <h3 className="empty-state-title">No goals yet</h3>
                <p className="empty-state-description">
                  Create your first goal to start tracking your progress towards what matters most.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
