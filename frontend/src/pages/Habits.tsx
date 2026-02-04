import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
    if (toggling) return;
    setToggling(habitId);
    try {
      if (completed) {
        await habitService.uncompleteHabit(habitId);
      } else {
        await habitService.completeHabit(habitId);
      }
      await loadHabits();
      if (selectedHabit?._id === habitId) {
        await loadHabitStats(habitId);
        // Refresh selected habit data
        const updatedHabits = await habitService.getTodaysHabits();
        const updated = updatedHabits.find(h => h._id === habitId);
        if (updated) setSelectedHabit(updated);
      }
    } catch (error) {
      console.error("Failed to toggle habit:", error);
    } finally {
      setToggling(null);
    }
  };

  const handleDeleteHabit = async (id: string) => {
    if (!confirm("Delete this habit and all its history?")) return;
    try {
      await habitService.deleteHabit(id);
      setSelectedHabit(null);
      setHabitStats(null);
      await loadHabits();
    } catch (error) {
      console.error("Failed to delete habit:", error);
    }
  };

  const getStreakColor = (streak: number) => {
    if (streak >= 30) return "var(--danger)";
    if (streak >= 7) return "var(--warning)";
    return "var(--accent)";
  };

  return (
    <div className="page-container">
      <div className="page-inner">
        <div className="page-header">
          <button className="page-header-back-btn" onClick={() => navigate("/dashboard")}>
            ← Home
          </button>
          <h1 className="page-header-title">✅ Habit Tracker</h1>
        </div>

        {selectedHabit && habitStats ? (
          <div>
            <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
              <button onClick={() => { setSelectedHabit(null); setHabitStats(null); }} className="btn-secondary">← Back</button>
              <button onClick={() => handleDeleteHabit(selectedHabit._id)} className="btn-danger">Delete</button>
            </div>

            <div className="card card-elevated" style={{ marginBottom: "20px" }}>
              <h2 style={{ color: "var(--accent)", margin: 0 }}>{selectedHabit.name}</h2>
              <div style={{ fontSize: "40px", color: getStreakColor(habitStats.currentStreak) }}>🔥 {habitStats.currentStreak} day streak</div>
              <div style={{ color: "var(--text-muted)", marginTop: "10px" }}>Success Rate: {habitStats.successRate.toFixed(1)}%</div>
            </div>

            <div className="card" style={{ marginBottom: "20px", display: "flex", gap: "16px", alignItems: "center" }}>
              <button
                onClick={() => handleToggleComplete(selectedHabit._id, selectedHabit.completedToday || false)}
                style={{
                  width: "50px",
                  height: "50px",
                  borderRadius: "10px",
                  border: "2px solid var(--accent)",
                  background: selectedHabit.completedToday ? "var(--success)" : "none",
                  cursor: "pointer",
                  fontSize: "24px",
                  color: "#000"
                }}
              >
                {selectedHabit.completedToday ? "✓" : ""}
              </button>
              <div style={{ fontWeight: "bold", color: "var(--accent)" }}>
                {selectedHabit.completedToday ? "Completed Today! 🎉" : "Mark as done for today"}
              </div>
            </div>

            <div>
              <h3 style={{ marginBottom: "10px" }}>History (Last 7 days)</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {habitStats.completionHistory.slice(0, 7).map((c, i) => (
                  <div key={i} className="card" style={{ display: "flex", justifyContent: "space-between", padding: "12px" }}>
                    <span>{new Date(c.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                    <span>{c.completed ? "✅ Done" : "⭕ Pending"}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div>
            <button className="btn-primary" onClick={() => setShowAddForm(!showAddForm)} style={{ marginBottom: "20px" }}>+ New Habit</button>

            {showAddForm && (
              <form onSubmit={handleAddHabit} className="card" style={{ marginBottom: "20px" }}>
                <input type="text" placeholder="Habit Name" value={newHabit.name} onChange={(e) => setNewHabit({ ...newHabit, name: e.target.value })} className="form-input" required style={{ marginBottom: "10px" }} />
                <button type="submit" className="btn-primary">Create Habit</button>
              </form>
            )}

            {loading ? (
              <div className="loading-state">Loading...</div>
            ) : (
              <div className="list-grid">
                {habits.map(habit => (
                  <div key={habit._id} className="card" onClick={() => setSelectedHabit(habit)} style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: "bold" }}>{habit.name}</div>
                      <div style={{ color: getStreakColor(habit.currentStreak || 0), fontSize: "14px" }}>🔥 {habit.currentStreak || 0} days</div>
                    </div>
                    <div style={{
                      width: "30px",
                      height: "30px",
                      borderRadius: "6px",
                      border: "2px solid var(--accent)",
                      background: habit.completedToday ? "var(--success)" : "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#000"
                    }}>
                      {habit.completedToday ? "✓" : ""}
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
