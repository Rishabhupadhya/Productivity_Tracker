import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import type { Habit, HabitFrequency, HabitStats } from "../services/habit.service";
import * as habitService from "../services/habit.service";
import "./pages.css";

export default function Habits() {
  const navigate = useNavigate();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
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
    if (toggling) return; // Prevent double-clicks
    
    console.log('Toggle clicked:', { habitId, completed });
    setToggling(habitId);
    
    try {
      // Optimistically update UI
      setHabits(prevHabits => 
        prevHabits.map(h => 
          h._id === habitId 
            ? { ...h, completedToday: !completed } 
            : h
        )
      );
      
      if (selectedHabit?._id === habitId) {
        setSelectedHabit({ ...selectedHabit, completedToday: !completed });
      }
      
      if (completed) {
        console.log('Calling uncompleteHabit');
        const result = await habitService.uncompleteHabit(habitId);
        console.log('Uncomplete result:', result);
      } else {
        console.log('Calling completeHabit');
        const result = await habitService.completeHabit(habitId);
        console.log('Complete result:', result);
      }
      
      console.log('Reloading habits...');
      await loadHabits();
      
      if (selectedHabit?._id === habitId) {
        await loadHabitStats(habitId);
        const updatedHabits = await habitService.getTodaysHabits();
        const updated = updatedHabits.find(h => h._id === habitId);
        if (updated) setSelectedHabit(updated);
      }
      
      console.log('Toggle complete');
    } catch (error: any) {
      // Revert optimistic update on error
      await loadHabits();
      if (selectedHabit?._id === habitId) {
        const updatedHabits = await habitService.getTodaysHabits();
        const updated = updatedHabits.find(h => h._id === habitId);
        if (updated) setSelectedHabit(updated);
      }
      
      console.error("Failed to toggle habit:", error);
      console.error("Error details:", error?.response?.data);
      alert('Failed to toggle habit: ' + (error?.response?.data?.message || error?.message || 'Unknown error'));
    } finally {
      setToggling(null);
    }
  };

  const handleDeleteCompletion = async (habitId: string, date: string) => {
    if (!confirm(`Delete completion for ${new Date(date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}?`)) return;
    
    try {
      await habitService.uncompleteHabit(habitId);
      await loadHabits();
      if (selectedHabit?._id === habitId) {
        await loadHabitStats(habitId);
        const updatedHabits = await habitService.getTodaysHabits();
        const updated = updatedHabits.find(h => h._id === habitId);
        if (updated) setSelectedHabit(updated);
      }
    } catch (error) {
      console.error("Failed to delete completion:", error);
      alert('Failed to delete completion');
    }
  };

  const handleDeleteHabit = async (id: string) => {
    if (!confirm("Delete this habit?")) return;
    try {
      // Immediately remove from state for instant UI feedback
      setHabits(prevHabits => prevHabits.filter(h => h._id !== id));
      
      // Clear selection if the deleted habit was selected
      if (selectedHabit?._id === id) {
        setSelectedHabit(null);
        setHabitStats(null);
      }
      
      // Delete from backend
      await habitService.deleteHabit(id);
      
      // Reload to ensure consistency
      await loadHabits();
    } catch (error) {
      console.error("Failed to delete habit:", error);
      // Reload on error to restore correct state
      await loadHabits();
      alert("Failed to delete habit. Please try again.");
    }
  };

  const getStreakColor = (streak: number) => {
    if (streak >= 30) return "var(--danger)";
    if (streak >= 14) return "#ff6600";
    if (streak >= 7) return "var(--warning)";
    return "var(--accent)";
  };

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 80) return "var(--success)";
    if (rate >= 60) return "var(--warning)";
    return "var(--danger)";
  };

  const getIndiaDateTime = () => {
    const now = new Date();
    // Convert to India timezone (GMT+5:30)
    const indiaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    return indiaTime;
  };

  const todayDate = getIndiaDateTime();

  return (
    <AppLayout>
      <div className="page-container">
        <div className="page-inner">
          {/* Header */}
          <div className="page-header">
            <button className="page-header-back-btn" onClick={() => navigate("/dashboard")}>
              ← Home
            </button>
            <div>
              <h1 className="page-header-title">✅ Habit Tracker</h1>
              <p className="page-header-subtitle">Build lasting habits with daily tracking and streak monitoring</p>
            </div>
          </div>

        {selectedHabit && habitStats ? (
          // Habit Detail View
          <div>
            <button
              onClick={() => {
                setSelectedHabit(null);
                setHabitStats(null);
              }}
              className="btn-secondary"
              style={{ marginBottom: "var(--space-2xl)" }}
            >
              ← Back to Habits
            </button>

            <div className="card card-elevated" style={{ marginBottom: "var(--space-2xl)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
                <div style={{ flex: 1 }}>
                  <h2 style={{ color: "var(--accent)", margin: 0, marginBottom: "var(--space-sm)", fontSize: "var(--text-2xl)", fontWeight: "var(--font-bold)" }}>{selectedHabit.name}</h2>
                  {selectedHabit.description && <p style={{ color: "var(--text-muted)", fontSize: "var(--text-sm)", margin: 0 }}>{selectedHabit.description}</p>}
                </div>
                <div style={{ fontSize: "64px", color: getStreakColor(habitStats.currentStreak), display: "flex", alignItems: "center", gap: "8px" }}>
                  🔥 <span style={{ fontSize: "48px", fontWeight: "bold" }}>{habitStats.currentStreak}</span>
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
                  <div className="stat-value" style={{ color: "var(--accent)" }}>
                    {habitStats.longestStreak} days
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Total Completions</div>
                  <div className="stat-value" style={{ color: "var(--accent)" }}>
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
                  <div className="stat-value" style={{ color: "var(--accent)" }}>
                    {habitStats.last7DaysCount} / 7
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Last 30 Days</div>
                  <div className="stat-value" style={{ color: "var(--accent)" }}>
                    {habitStats.last30DaysCount} / 30
                  </div>
                </div>
              </div>
            </div>

            {/* Today's Action */}
            <div className="card card-elevated" style={{ marginBottom: "var(--space-2xl)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <button
                  onClick={() => handleToggleComplete(selectedHabit._id, selectedHabit.completedToday || false)}
                  style={{
                    width: "60px",
                    height: "60px",
                    background: selectedHabit.completedToday ? "var(--success)" : "var(--bg-tertiary)",
                    border: selectedHabit.completedToday ? "none" : "3px solid var(--accent)",
                    borderRadius: "var(--radius-lg)",
                    cursor: "pointer",
                    fontSize: "36px",
                    color: "#000",
                    fontWeight: "bold",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.2s",
                    position: "relative",
                    zIndex: 10,
                    flexShrink: 0
                  }}
                >
                  {selectedHabit.completedToday ? "✔" : ""}
                </button>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "var(--text-lg)", color: "var(--accent)", fontWeight: "var(--font-medium)", marginBottom: "var(--space-xs)" }}>
                    {selectedHabit.completedToday ? "Completed Today! 🎉" : "Mark as completed today"}
                  </div>
                  <div style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>
                    {todayDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} • {todayDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", marginTop: "var(--space-xs)" }}>
                    {selectedHabit.completedToday ? "Great job maintaining your streak!" : "Click the checkbox to complete this habit for today"}
                  </div>
                </div>
              </div>
            </div>

            {/* Recent History */}
            <div>
              <h3 style={{ color: "var(--accent)", marginBottom: "var(--space-lg)", fontSize: "var(--text-xl)" }}>📅 Recent History</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
                {habitStats.completionHistory.slice(0, 21).map((completion, idx) => (
                  <div key={idx} className="card" style={{ 
                    background: completion.completed ? "rgba(34, 197, 94, 0.1)" : "var(--bg-tertiary)", 
                    padding: "var(--space-lg)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderColor: completion.completed ? "var(--success)" : "var(--border-default)"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-md)" }}>
                      <span style={{ fontSize: "24px" }}>{completion.completed ? "✅" : "⭕"}</span>
                      <div>
                        <span style={{ color: completion.completed ? "var(--success)" : "var(--text-muted)", fontSize: "var(--text-base)", fontWeight: "var(--font-medium)" }}>
                          {new Date(completion.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                        </span>
                        {completion.notes && <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", marginTop: "var(--space-xs)" }}>{completion.notes}</div>}
                      </div>
                    </div>
                    {completion.completed && (
                      <button
                        onClick={() => handleDeleteCompletion(selectedHabit._id, completion.date)}
                        className="btn-danger"
                        style={{
                          padding: "6px 12px",
                          fontSize: "var(--text-xs)"
                        }}
                      >
                        🗑️ Delete
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => handleDeleteHabit(selectedHabit._id)}
              className="btn-danger"
              style={{ marginTop: "var(--space-2xl)" }}
            >
              Delete Habit
            </button>
          </div>
        ) : (
          // Habits List
          <div>
            <button className="btn-primary" onClick={() => setShowAddForm(!showAddForm)} style={{ marginBottom: "var(--space-2xl)" }}>
              + Create Habit
            </button>

            {showAddForm && (
              <form onSubmit={handleAddHabit} className="card" style={{ marginBottom: "var(--space-2xl)" }}>
                <input
                  type="text"
                  placeholder="Habit Name (e.g., Morning Workout, Read 30 min)"
                  value={newHabit.name}
                  onChange={(e) => setNewHabit({ ...newHabit, name: e.target.value })}
                  className="form-input"
                  style={{ marginBottom: "var(--space-lg)" }}
                  required
                />
                <textarea
                  placeholder="Description (optional)"
                  value={newHabit.description}
                  onChange={(e) => setNewHabit({ ...newHabit, description: e.target.value })}
                  className="form-textarea"
                  style={{ marginBottom: "var(--space-lg)" }}
                />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--space-lg)", marginBottom: "var(--space-lg)" }}>
                  <div>
                    <label className="form-label">Frequency</label>
                    <select
                      value={newHabit.frequency}
                      onChange={(e) => setNewHabit({ ...newHabit, frequency: e.target.value as HabitFrequency })}
                      className="form-select"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Times per Week</label>
                    <input
                      type="number"
                      placeholder="7"
                      value={newHabit.timesPerWeek}
                      onChange={(e) => setNewHabit({ ...newHabit, timesPerWeek: e.target.value })}
                      className="form-input"
                      min="1"
                      max="7"
                    />
                  </div>
                  <div>
                    <label className="form-label">Grace Days</label>
                    <input
                      type="number"
                      placeholder="1"
                      value={newHabit.graceDays}
                      onChange={(e) => setNewHabit({ ...newHabit, graceDays: e.target.value })}
                      className="form-input"
                      min="0"
                      max="3"
                    />
                  </div>
                </div>
                <div className="flex-gap">
                  <button type="submit" className="btn-primary">Create Habit</button>
                  <button type="button" className="btn-secondary" onClick={() => setShowAddForm(false)}>Cancel</button>
                </div>
              </form>
            )}

            {loading ? (
              <div className="loading-state">Loading...</div>
            ) : habits.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-lg)" }}>
                {habits.map(habit => (
                  <div
                    key={habit._id}
                    className="card"
                    style={{ 
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "var(--space-lg)"
                    }}
                  >
                    <div 
                      style={{ 
                        display: "flex", 
                        alignItems: "center", 
                        gap: "var(--space-lg)", 
                        flex: 1,
                        cursor: "pointer"
                      }}
                      onClick={() => setSelectedHabit(habit)}
                    >
                      <div style={{ flex: 1 }}>
                        <div 
                          style={{ color: "var(--text-primary)", fontSize: "var(--text-lg)", fontWeight: "var(--font-medium)", marginBottom: "var(--space-xs)" }}
                        >
                          {habit.name}
                        </div>
                        <div style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "var(--space-md)" }}>
                          {habit.currentStreak > 0 ? (
                            <span style={{ color: getStreakColor(habit.currentStreak), display: "flex", alignItems: "center", gap: "4px" }}>
                              <span style={{ fontSize: "16px" }}>🔥</span> {habit.currentStreak} day streak
                            </span>
                          ) : (
                            <span>No streak yet - start today!</span>
                          )}
                          {habit.successRate > 0 && (
                            <span style={{ color: getSuccessRateColor(habit.successRate) }}>
                              • {habit.successRate.toFixed(0)}% success rate
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteHabit(habit._id);
                      }}
                      className="btn-danger"
                      style={{
                        padding: "8px 16px",
                        fontSize: "var(--text-sm)",
                        flexShrink: 0
                      }}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">✅</div>
                <h3 className="empty-state-title">No habits yet</h3>
                <p className="empty-state-description">
                  Create your first habit to start building positive routines and tracking your progress.
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
