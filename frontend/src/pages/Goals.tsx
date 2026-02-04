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
      const updatedGoals = await goalService.getGoals();
      const updated = updatedGoals.find(g => g._id === selectedGoal._id);
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
      const updatedGoals = await goalService.getGoals();
      const updated = updatedGoals.find(g => g._id === selectedGoal._id);
      if (updated) setSelectedGoal(updated);
      await loadGoals();
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

  const getGoalIcon = (type: string) => {
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

  const calculateProgress = (goal: any) => {
    if (!goal || !goal.targetValue) return 0;
    return Math.min(((goal.currentValue || 0) / goal.targetValue) * 100, 100);
  };

  return (
    <div className="page-container">
      <div className="page-inner">
        {!selectedGoal && (
          <div className="page-header">
            <button className="page-header-back-btn" onClick={() => navigate("/dashboard")}>
              ← Home
            </button>
            <h1 className="page-header-title">🎯 Goal Tracker</h1>
          </div>
        )}

        {selectedGoal ? (
          <div>
            <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
              <button className="btn-secondary" onClick={() => setSelectedGoal(null)}>← Back</button>
              <button className="btn-danger" onClick={() => handleDeleteGoal(selectedGoal._id)}>Delete</button>
            </div>

            <div className="card card-elevated" style={{ marginBottom: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "15px" }}>
                <span style={{ fontSize: "40px" }}>{getGoalIcon(selectedGoal.type)}</span>
                <h2 style={{ color: "var(--accent)", margin: 0 }}>{selectedGoal.title}</h2>
              </div>
              <div className="progress-bar-container">
                <div className="progress-bar-fill" style={{ background: getProgressColor(calculateProgress(selectedGoal)), width: `${calculateProgress(selectedGoal)}%` }} />
              </div>
              <div style={{ marginTop: "10px", fontWeight: "bold" }}>{calculateProgress(selectedGoal).toFixed(1)}% Complete</div>

              <form onSubmit={handleUpdateProgress} style={{ marginTop: "20px", display: "flex", gap: "8px" }}>
                <input type="number" step="any" placeholder="Add progress" value={progressInput} onChange={(e) => setProgressInput(e.target.value)} className="form-input" style={{ flex: 1 }} />
                <button type="submit" className="btn-primary">Update</button>
              </form>
            </div>

            {/* Reviews Section */}
            <div style={{ marginTop: "30px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                <h3 style={{ margin: 0 }}>📝 Reviews</h3>
                <button className="btn-primary" onClick={() => setShowReviewForm(!showReviewForm)}>+ Review</button>
              </div>

              {showReviewForm && (
                <form onSubmit={handleAddReview} className="card" style={{ marginBottom: "20px", background: "var(--bg-tertiary)" }}>
                  <textarea placeholder="Learning/Blocks" value={review.notes} onChange={(e) => setReview({ ...review, notes: e.target.value })} className="form-textarea" style={{ marginBottom: "10px" }} />
                  <button type="submit" className="btn-primary">Save Review</button>
                </form>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {selectedGoal.reviews?.map((rev: any) => (
                  <div key={rev._id} className="card" style={{ display: "flex", justifyContent: "space-between" }}>
                    <div>{rev.notes || "No notes"}</div>
                    <button onClick={() => handleDeleteReview(rev._id)} className="btn-danger" style={{ padding: "4px 8px", fontSize: "12px" }}>×</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div>
            <button className="btn-primary" onClick={() => setShowAddForm(!showAddForm)} style={{ marginBottom: "20px" }}>+ New Goal</button>
            {showAddForm && (
              <form onSubmit={handleAddGoal} className="card" style={{ marginBottom: "20px" }}>
                <input type="text" placeholder="Title" value={newGoal.title} onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })} className="form-input" required style={{ marginBottom: "10px" }} />
                <input type="number" placeholder="Target" value={newGoal.targetValue} onChange={(e) => setNewGoal({ ...newGoal, targetValue: e.target.value })} className="form-input" required style={{ marginBottom: "10px" }} />
                <button type="submit" className="btn-primary">Create</button>
              </form>
            )}

            {loading ? (
              <div className="loading-state">Loading goals...</div>
            ) : (
              <div className="list-grid">
                {goals.map(goal => (
                  <div key={goal._id} className="card" onClick={() => setSelectedGoal(goal)} style={{ cursor: "pointer" }}>
                    <div style={{ fontWeight: "bold", marginBottom: "8px" }}>{goal.title}</div>
                    <div className="progress-bar-container" style={{ height: "8px" }}>
                      <div className="progress-bar-fill" style={{ background: getProgressColor(calculateProgress(goal)), width: `${calculateProgress(goal)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
