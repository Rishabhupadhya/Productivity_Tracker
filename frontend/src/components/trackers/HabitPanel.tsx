import { useState, useEffect } from "react";
import type { Habit, HabitFrequency, HabitStats } from "../../services/habit.service";
import * as habitService from "../../services/habit.service";
import "./tracker.css";

export default function HabitPanel({ onClose }: { onClose: () => void }) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [habitStats, setHabitStats] = useState<HabitStats | null>(null);
  const [newHabit, setNewHabit] = useState({
    name: "",
    description: "",
    frequency: "daily" as HabitFrequency,
    timesPerWeek: "7",
    graceDays: "1"
  });

  useEffect(() => {
    loadHabits();
  }, []);

  useEffect(() => {
    if (selectedHabit) {
      loadHabitStats(selectedHabit._id);
    }
  }, [selectedHabit]);

  const loadHabits = async () => {
    try {
      setLoading(true);
      const data = await habitService.getTodaysHabits();
      setHabits(data);
    } catch (error) {
      console.error("Failed to load habits:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadHabitStats = async (habitId: string) => {
    try {
      const stats = await habitService.getStats(habitId);
      setHabitStats(stats);
    } catch (error) {
      console.error("Failed to load habit stats:", error);
    }
  };

  const handleAddHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await habitService.createHabit({
        name: newHabit.name,
        description: newHabit.description,
        frequency: newHabit.frequency,
        timesPerWeek: parseInt(newHabit.timesPerWeek),
        graceDays: parseInt(newHabit.graceDays)
      });
      setNewHabit({ name: "", description: "", frequency: "daily", timesPerWeek: "7", graceDays: "1" });
      setShowAddForm(false);
      await loadHabits();
    } catch (error) {
      console.error("Failed to add habit:", error);
    }
  };

  const handleToggleComplete = async (habitId: string, completed: boolean) => {
    try {
      if (completed) {
        await habitService.uncompleteHabit(habitId);
      } else {
        await habitService.completeHabit(habitId);
      }
      await loadHabits();
      if (selectedHabit?._id === habitId) {
        await loadHabitStats(habitId);
      }
    } catch (error) {
      console.error("Failed to toggle habit:", error);
    }
  };

  const handleDeleteHabit = async (id: string) => {
    if (!confirm("Delete this habit?")) return;
    try {
      await habitService.deleteHabit(id);
      if (selectedHabit?._id === id) {
        setSelectedHabit(null);
      }
      await loadHabits();
    } catch (error) {
      console.error("Failed to delete habit:", error);
    }
  };

  const getStreakColor = (streak: number) => {
    if (streak >= 30) return "var(--danger)";
    if (streak >= 14) return "var(--warning)";
    if (streak >= 7) return "var(--warning)";
    return "var(--accent)";
  };

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 80) return "var(--success)";
    if (rate >= 60) return "var(--warning)";
    return "var(--danger)";
  };

  return (
    <div className="tracker-backdrop" onClick={onClose}>
      <div className="tracker-modal" onClick={(e) => e.stopPropagation()}>
        <div className="tracker-header">
          <h2>✅ Habit Tracker</h2>
          <button onClick={onClose} className="tracker-close">
            ×
          </button>
        </div>

        <div className="tracker-content">
        {selectedHabit ? (
          <div>
            <button
              onClick={() => {
                setSelectedHabit(null);
                setHabitStats(null);
              }}
              className="btn btn-back"
            >
              ← Back to Habits
            </button>

            {habitStats ? (
              <div className="detail-container">
              <div className="detail-header">
                <div>
                  <h3 style={{ color: "var(--accent)", margin: 0, marginBottom: "4px" }}>{selectedHabit.name}</h3>
                  {selectedHabit.description && <p style={{ color: "var(--text-secondary)", fontSize: "14px", margin: 0 }}>{selectedHabit.description}</p>}
                </div>
                <div className="detail-icon" style={{ color: getStreakColor(habitStats.currentStreak) }}>
                  🔥 {habitStats.currentStreak}
                </div>
              </div>

              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-label">Current Streak</div>
                  <div className="stat-value" style={{ color: getStreakColor(habitStats.currentStreak) }}>
                    {habitStats.currentStreak} days
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Longest Streak</div>
                  <div className="stat-value">
                    {habitStats.longestStreak} days
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Total Completions</div>
                  <div className="stat-value">
                    {habitStats.totalCompletions}
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Success Rate</div>
                  <div className="stat-value" style={{ color: getSuccessRateColor(habitStats.successRate) }}>
                    {habitStats.successRate.toFixed(1)}%
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Last 7 Days</div>
                  <div className="stat-value">
                    {habitStats.last7DaysCount} / 7
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Last 30 Days</div>
                  <div className="stat-value">
                    {habitStats.last30DaysCount} / 30
                  </div>
                </div>
              </div>
            </div>

            <div className="review-section">
              <h4 className="section-title">Recent History</h4>
              <div className="history-list">
                {habitStats.completionHistory.slice(0, 14).map((completion, idx) => (
                  <div key={idx} className="history-item" style={{
                    background: completion.completed ? "rgba(0, 255, 136, 0.1)" : "var(--bg-secondary)",
                    border: completion.completed ? "1px solid var(--success)" : "1px solid var(--bg-tertiary)"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "20px" }}>{completion.completed ? "✅" : "⭕"}</span>
                      <span style={{ color: completion.completed ? "var(--success)" : "var(--text-secondary)", fontSize: "14px" }}>
                        {new Date(completion.date).toLocaleDateString()}
                      </span>
                    </div>
                    {completion.notes && <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{completion.notes}</span>}
                  </div>
                ))}
              </div>
            </div>
            ) : (
              <div className="loading-state">Loading habit statistics...</div>
            )}
          </div>
        ) : (
          <div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="btn btn-primary"
            >
              + Add Habit
            </button>

            {showAddForm && (
              <form onSubmit={handleAddHabit} className="form-container">
                <input
                  type="text"
                  placeholder="Habit Name"
                  value={newHabit.name}
                  onChange={(e) => setNewHabit({ ...newHabit, name: e.target.value })}
                  className="form-input"
                  required
                />
                <textarea
                  placeholder="Description (optional)"
                  value={newHabit.description}
                  onChange={(e) => setNewHabit({ ...newHabit, description: e.target.value })}
                  className="form-textarea"
                />
                <div className="form-grid">
                  <select
                    value={newHabit.frequency}
                    onChange={(e) => setNewHabit({ ...newHabit, frequency: e.target.value as HabitFrequency })}
                    className="form-select"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="custom">Custom</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Times/Week"
                    value={newHabit.timesPerWeek}
                    onChange={(e) => setNewHabit({ ...newHabit, timesPerWeek: e.target.value })}
                    className="form-input"
                    min="1"
                    max="7"
                  />
                  <input
                    type="number"
                    placeholder="Grace Days"
                    value={newHabit.graceDays}
                    onChange={(e) => setNewHabit({ ...newHabit, graceDays: e.target.value })}
                    className="form-input"
                    min="0"
                    max="3"
                  />
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn btn-primary">
                    Create Habit
                  </button>
                  <button type="button" onClick={() => setShowAddForm(false)} className="btn btn-secondary">
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {loading ? (
              <div className="loading-state">Loading...</div>
            ) : habits.length > 0 ? (
              <div className="item-list">
                {habits.map(habit => (
                  <div
                    key={habit._id}
                    className="item-card"
                    style={{ display: "flex", alignItems: "center", gap: "16px" }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--accent)"}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = "transparent"}
                  >
                    <div 
                      style={{ 
                        flex: 1, 
                        cursor: "pointer",
                        userSelect: "none"
                      }}
                      onClick={() => {
                        console.log("Habit clicked:", habit.name);
                        setSelectedHabit(habit);
                      }}
                    >
                      <div className="item-title">
                        {habit.name}
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
                        {habit.currentStreak > 0 && (
                          <span style={{ color: getStreakColor(habit.currentStreak) }}>
                            🔥 {habit.currentStreak} day streak
                          </span>
                        )}
                        {habit.currentStreak === 0 && <span>No streak yet</span>}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteHabit(habit._id);
                      }}
                      style={{
                        background: "var(--danger)",
                        border: "none",
                        color: "#fff",
                        padding: "8px 16px",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: "600",
                        transition: "all 0.2s",
                        flexShrink: 0
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "#dc2626"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "var(--danger)"}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                No habits yet. Click "Add Habit" to start building positive routines!
              </div>
            )}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
