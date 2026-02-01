import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import type { Habit, HabitFrequency, HabitStats } from "../services/habit.service";
import * as habitService from "../services/habit.service";

export default function Habits() {
  const navigate = useNavigate();
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
        await habitService.uncompleteHabit(habitId, new Date());
      } else {
        await habitService.completeHabit(habitId);
      }
      await loadHabits();
      if (selectedHabit?._id === habitId) {
        await loadHabitStats(habitId);
        const updatedHabits = await habitService.getTodaysHabits();
        const updated = updatedHabits.find(h => h._id === habitId);
        if (updated) setSelectedHabit(updated);
      }
    } catch (error) {
      console.error("Failed to toggle habit:", error);
    }
  };

  const handleDeleteHabit = async (id: string) => {
    if (!confirm("Delete this habit?")) return;
    try {
      await habitService.deleteHabit(id);
      setSelectedHabit(null);
      await loadHabits();
    } catch (error) {
      console.error("Failed to delete habit:", error);
    }
  };

  const getStreakColor = (streak: number) => {
    if (streak >= 30) return "#ff0000";
    if (streak >= 14) return "#ff6600";
    if (streak >= 7) return "#ffaa00";
    return "#00ffff";
  };

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 80) return "#00ff00";
    if (rate >= 60) return "#ffaa00";
    return "#ff0000";
  };

  return (
    <AppLayout>
      <div style={{ padding: "24px", background: "#0b0f14", minHeight: "100%", color: "#fff", overflow: "auto" }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
          {/* Header */}
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
              <h1 style={{ color: "#00ffff", fontSize: "32px", marginBottom: "8px" }}>✅ Habit Tracker</h1>
              <p style={{ color: "#888", fontSize: "14px" }}>Build lasting habits with daily tracking and streak monitoring</p>
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
              ← Back to Habits
            </button>

            <div style={{ padding: "32px", background: "#1a1a1a", borderRadius: "12px", marginBottom: "24px", border: "1px solid #00ffff" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
                <div style={{ flex: 1 }}>
                  <h2 style={{ color: "#00ffff", margin: 0, marginBottom: "8px", fontSize: "28px" }}>{selectedHabit.name}</h2>
                  {selectedHabit.description && <p style={{ color: "#888", fontSize: "14px", margin: 0 }}>{selectedHabit.description}</p>}
                </div>
                <div style={{ fontSize: "64px", color: getStreakColor(habitStats.currentStreak), display: "flex", alignItems: "center", gap: "8px" }}>
                  🔥 <span style={{ fontSize: "48px", fontWeight: "bold" }}>{habitStats.currentStreak}</span>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px" }}>
                <div style={{ padding: "20px", background: "#0a0a0a", borderRadius: "8px" }}>
                  <div style={{ fontSize: "12px", color: "#666", marginBottom: "8px" }}>Current Streak</div>
                  <div style={{ fontSize: "28px", color: getStreakColor(habitStats.currentStreak), fontWeight: "bold" }}>
                    {habitStats.currentStreak} days
                  </div>
                </div>
                <div style={{ padding: "20px", background: "#0a0a0a", borderRadius: "8px" }}>
                  <div style={{ fontSize: "12px", color: "#666", marginBottom: "8px" }}>Longest Streak</div>
                  <div style={{ fontSize: "28px", color: "#00ffff", fontWeight: "bold" }}>
                    {habitStats.longestStreak} days
                  </div>
                </div>
                <div style={{ padding: "20px", background: "#0a0a0a", borderRadius: "8px" }}>
                  <div style={{ fontSize: "12px", color: "#666", marginBottom: "8px" }}>Total Completions</div>
                  <div style={{ fontSize: "28px", color: "#00ffff", fontWeight: "bold" }}>
                    {habitStats.totalCompletions}
                  </div>
                </div>
                <div style={{ padding: "20px", background: "#0a0a0a", borderRadius: "8px" }}>
                  <div style={{ fontSize: "12px", color: "#666", marginBottom: "8px" }}>Success Rate</div>
                  <div style={{ fontSize: "28px", color: getSuccessRateColor(habitStats.successRate), fontWeight: "bold" }}>
                    {habitStats.successRate.toFixed(1)}%
                  </div>
                </div>
                <div style={{ padding: "20px", background: "#0a0a0a", borderRadius: "8px" }}>
                  <div style={{ fontSize: "12px", color: "#666", marginBottom: "8px" }}>Last 7 Days</div>
                  <div style={{ fontSize: "28px", color: "#00ffff", fontWeight: "bold" }}>
                    {habitStats.last7DaysCount} / 7
                  </div>
                </div>
                <div style={{ padding: "20px", background: "#0a0a0a", borderRadius: "8px" }}>
                  <div style={{ fontSize: "12px", color: "#666", marginBottom: "8px" }}>Last 30 Days</div>
                  <div style={{ fontSize: "28px", color: "#00ffff", fontWeight: "bold" }}>
                    {habitStats.last30DaysCount} / 30
                  </div>
                </div>
              </div>
            </div>

            {/* Today's Action */}
            <div style={{ padding: "24px", background: "#1a1a1a", borderRadius: "12px", marginBottom: "24px", border: "1px solid #00ffff" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <button
                  onClick={() => handleToggleComplete(selectedHabit._id, selectedHabit.completedToday || false)}
                  style={{
                    width: "60px",
                    height: "60px",
                    background: selectedHabit.completedToday ? "#00ff00" : "#0a0a0a",
                    border: selectedHabit.completedToday ? "none" : "3px solid #00ffff",
                    borderRadius: "12px",
                    cursor: "pointer",
                    fontSize: "32px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.2s"
                  }}
                >
                  {selectedHabit.completedToday ? "✓" : ""}
                </button>
                <div>
                  <div style={{ fontSize: "18px", color: "#00ffff", fontWeight: "500", marginBottom: "4px" }}>
                    {selectedHabit.completedToday ? "Completed Today! 🎉" : "Mark as completed today"}
                  </div>
                  <div style={{ fontSize: "14px", color: "#888" }}>
                    {selectedHabit.completedToday ? "Great job maintaining your streak!" : "Click the checkbox to complete this habit"}
                  </div>
                </div>
              </div>
            </div>

            {/* Recent History */}
            <div>
              <h3 style={{ color: "#00ffff", marginBottom: "16px", fontSize: "20px" }}>📅 Recent History</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {habitStats.completionHistory.slice(0, 21).map((completion, idx) => (
                  <div key={idx} style={{ 
                    padding: "16px", 
                    background: completion.completed ? "#0a3020" : "#0a0a0a", 
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    border: completion.completed ? "1px solid #00ff00" : "1px solid #333"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <span style={{ fontSize: "24px" }}>{completion.completed ? "✅" : "⭕"}</span>
                      <span style={{ color: completion.completed ? "#00ff00" : "#888", fontSize: "16px" }}>
                        {new Date(completion.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                    {completion.notes && <span style={{ fontSize: "13px", color: "#666" }}>{completion.notes}</span>}
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => handleDeleteHabit(selectedHabit._id)}
              style={{
                padding: "12px 24px",
                background: "#ff0000",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                marginTop: "24px",
                fontSize: "14px"
              }}
            >
              Delete Habit
            </button>
          </div>
        ) : (
          // Habits List
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
              + Create Habit
            </button>

            {showAddForm && (
              <form onSubmit={handleAddHabit} style={{ marginBottom: "32px", padding: "24px", background: "#1a1a1a", borderRadius: "8px" }}>
                <input
                  type="text"
                  placeholder="Habit Name (e.g., Morning Workout, Read 30 min)"
                  value={newHabit.name}
                  onChange={(e) => setNewHabit({ ...newHabit, name: e.target.value })}
                  style={{ width: "100%", padding: "12px", background: "#0a0a0a", border: "1px solid #00ffff", borderRadius: "8px", color: "#00ffff", marginBottom: "16px", fontSize: "14px" }}
                  required
                />
                <textarea
                  placeholder="Description (optional)"
                  value={newHabit.description}
                  onChange={(e) => setNewHabit({ ...newHabit, description: e.target.value })}
                  style={{ width: "100%", padding: "12px", background: "#0a0a0a", border: "1px solid #00ffff", borderRadius: "8px", color: "#00ffff", marginBottom: "16px", minHeight: "80px", fontSize: "14px" }}
                />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                  <select
                    value={newHabit.frequency}
                    onChange={(e) => setNewHabit({ ...newHabit, frequency: e.target.value as HabitFrequency })}
                    style={{ padding: "12px", background: "#0a0a0a", border: "1px solid #00ffff", borderRadius: "8px", color: "#00ffff", fontSize: "14px" }}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="custom">Custom</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Times per Week"
                    value={newHabit.timesPerWeek}
                    onChange={(e) => setNewHabit({ ...newHabit, timesPerWeek: e.target.value })}
                    style={{ padding: "12px", background: "#0a0a0a", border: "1px solid #00ffff", borderRadius: "8px", color: "#00ffff", fontSize: "14px" }}
                    min="1"
                    max="7"
                  />
                  <input
                    type="number"
                    placeholder="Grace Days (0-3)"
                    value={newHabit.graceDays}
                    onChange={(e) => setNewHabit({ ...newHabit, graceDays: e.target.value })}
                    style={{ padding: "12px", background: "#0a0a0a", border: "1px solid #00ffff", borderRadius: "8px", color: "#00ffff", fontSize: "14px" }}
                    min="0"
                    max="3"
                  />
                </div>
                <div style={{ display: "flex", gap: "12px" }}>
                  <button type="submit" style={{ padding: "12px 24px", background: "#00ffff", color: "#000", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: "14px" }}>
                    Create Habit
                  </button>
                  <button type="button" onClick={() => setShowAddForm(false)} style={{ padding: "12px 24px", background: "#333", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px" }}>
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {loading ? (
              <div style={{ textAlign: "center", color: "#00ffff", padding: "80px" }}>Loading...</div>
            ) : habits.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {habits.map(habit => (
                  <div
                    key={habit._id}
                    style={{ 
                      padding: "24px", 
                      background: "#1a1a1a", 
                      borderRadius: "12px", 
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      border: "1px solid transparent",
                      transition: "border-color 0.2s"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = "#00ffff"}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = "transparent"}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "20px", flex: 1 }}>
                      <button
                        onClick={() => handleToggleComplete(habit._id, habit.completedToday || false)}
                        style={{
                          width: "50px",
                          height: "50px",
                          background: habit.completedToday ? "#00ff00" : "#0a0a0a",
                          border: habit.completedToday ? "none" : "3px solid #00ffff",
                          borderRadius: "10px",
                          cursor: "pointer",
                          fontSize: "24px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "all 0.2s"
                        }}
                      >
                        {habit.completedToday ? "✓" : ""}
                      </button>
                      <div style={{ flex: 1 }}>
                        <div 
                          style={{ color: "#fff", fontSize: "18px", cursor: "pointer", fontWeight: "500", marginBottom: "6px" }}
                          onClick={() => setSelectedHabit(habit)}
                        >
                          {habit.name}
                        </div>
                        <div style={{ fontSize: "14px", color: "#888", display: "flex", alignItems: "center", gap: "12px" }}>
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
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: "center", color: "#666", padding: "80px", background: "#1a1a1a", borderRadius: "8px" }}>
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>✅</div>
                <h3 style={{ marginBottom: "12px" }}>No habits yet</h3>
                <p style={{ fontSize: "14px", maxWidth: "400px", margin: "0 auto" }}>
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
