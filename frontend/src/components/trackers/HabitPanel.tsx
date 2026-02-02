import { useState, useEffect } from "react";
import type { Habit, HabitFrequency, HabitStats } from "../../services/habit.service";
import * as habitService from "../../services/habit.service";

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
        await habitService.uncompleteHabit(habitId, new Date());
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
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        style={{ 
          background: "#1a1a1a", 
          padding: "24px", 
          borderRadius: "8px", 
          border: "1px solid #00ffff",
          maxWidth: "900px",
          width: "90%",
          maxHeight: "85vh",
          overflow: "auto"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ color: "#00ffff", margin: 0 }}>✅ Habit Tracker</h2>
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

        {selectedHabit && habitStats ? (
          <div>
            <button
              onClick={() => {
                setSelectedHabit(null);
                setHabitStats(null);
              }}
              style={{
                padding: "8px 16px",
                background: "#333",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                marginBottom: "16px"
              }}
            >
              ← Back to Habits
            </button>

            <div style={{ padding: "20px", background: "#0a0a0a", borderRadius: "8px", marginBottom: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                <div>
                  <h3 style={{ color: "#00ffff", margin: 0, marginBottom: "4px" }}>{selectedHabit.name}</h3>
                  {selectedHabit.description && <p style={{ color: "#888", fontSize: "14px", margin: 0 }}>{selectedHabit.description}</p>}
                </div>
                <div style={{ fontSize: "32px", color: getStreakColor(habitStats.currentStreak) }}>
                  🔥 {habitStats.currentStreak}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px" }}>
                <div style={{ padding: "12px", background: "#1a1a1a", borderRadius: "8px" }}>
                  <div style={{ fontSize: "12px", color: "#666" }}>Current Streak</div>
                  <div style={{ fontSize: "20px", color: getStreakColor(habitStats.currentStreak), marginTop: "4px" }}>
                    {habitStats.currentStreak} days
                  </div>
                </div>
                <div style={{ padding: "12px", background: "#1a1a1a", borderRadius: "8px" }}>
                  <div style={{ fontSize: "12px", color: "#666" }}>Longest Streak</div>
                  <div style={{ fontSize: "20px", color: "#00ffff", marginTop: "4px" }}>
                    {habitStats.longestStreak} days
                  </div>
                </div>
                <div style={{ padding: "12px", background: "#1a1a1a", borderRadius: "8px" }}>
                  <div style={{ fontSize: "12px", color: "#666" }}>Total Completions</div>
                  <div style={{ fontSize: "20px", color: "#00ffff", marginTop: "4px" }}>
                    {habitStats.totalCompletions}
                  </div>
                </div>
                <div style={{ padding: "12px", background: "#1a1a1a", borderRadius: "8px" }}>
                  <div style={{ fontSize: "12px", color: "#666" }}>Success Rate</div>
                  <div style={{ fontSize: "20px", color: getSuccessRateColor(habitStats.successRate), marginTop: "4px" }}>
                    {habitStats.successRate.toFixed(1)}%
                  </div>
                </div>
                <div style={{ padding: "12px", background: "#1a1a1a", borderRadius: "8px" }}>
                  <div style={{ fontSize: "12px", color: "#666" }}>Last 7 Days</div>
                  <div style={{ fontSize: "20px", color: "#00ffff", marginTop: "4px" }}>
                    {habitStats.last7DaysCount} / 7
                  </div>
                </div>
                <div style={{ padding: "12px", background: "#1a1a1a", borderRadius: "8px" }}>
                  <div style={{ fontSize: "12px", color: "#666" }}>Last 30 Days</div>
                  <div style={{ fontSize: "20px", color: "#00ffff", marginTop: "4px" }}>
                    {habitStats.last30DaysCount} / 30
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 style={{ color: "#00ffff", marginBottom: "12px" }}>Recent History</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {habitStats.completionHistory.slice(0, 14).map((completion, idx) => (
                  <div key={idx} style={{ 
                    padding: "10px", 
                    background: completion.completed ? "#0a3020" : "#0a0a0a", 
                    borderRadius: "6px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    border: completion.completed ? "1px solid #00ff00" : "1px solid #333"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "20px" }}>{completion.completed ? "✅" : "⭕"}</span>
                      <span style={{ color: completion.completed ? "#00ff00" : "#888", fontSize: "14px" }}>
                        {new Date(completion.date).toLocaleDateString()}
                      </span>
                    </div>
                    {completion.notes && <span style={{ fontSize: "12px", color: "#666" }}>{completion.notes}</span>}
                  </div>
                ))}
              </div>
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
                borderRadius: "4px",
                cursor: "pointer",
                marginBottom: "16px",
                fontWeight: "bold"
              }}
            >
              + Add Habit
            </button>

            {showAddForm && (
              <form onSubmit={handleAddHabit} style={{ marginBottom: "20px", padding: "16px", background: "#0a0a0a", borderRadius: "8px" }}>
                <input
                  type="text"
                  placeholder="Habit Name"
                  value={newHabit.name}
                  onChange={(e) => setNewHabit({ ...newHabit, name: e.target.value })}
                  style={{ width: "100%", padding: "8px", background: "#1a1a1a", border: "1px solid #00ffff", borderRadius: "4px", color: "#00ffff", marginBottom: "12px" }}
                  required
                />
                <textarea
                  placeholder="Description (optional)"
                  value={newHabit.description}
                  onChange={(e) => setNewHabit({ ...newHabit, description: e.target.value })}
                  style={{ width: "100%", padding: "8px", background: "#1a1a1a", border: "1px solid #00ffff", borderRadius: "4px", color: "#00ffff", marginBottom: "12px", minHeight: "60px" }}
                />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                  <select
                    value={newHabit.frequency}
                    onChange={(e) => setNewHabit({ ...newHabit, frequency: e.target.value as HabitFrequency })}
                    style={{ padding: "8px", background: "#1a1a1a", border: "1px solid #00ffff", borderRadius: "4px", color: "#00ffff" }}
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
                    style={{ padding: "8px", background: "#1a1a1a", border: "1px solid #00ffff", borderRadius: "4px", color: "#00ffff" }}
                    min="1"
                    max="7"
                  />
                  <input
                    type="number"
                    placeholder="Grace Days"
                    value={newHabit.graceDays}
                    onChange={(e) => setNewHabit({ ...newHabit, graceDays: e.target.value })}
                    style={{ padding: "8px", background: "#1a1a1a", border: "1px solid #00ffff", borderRadius: "4px", color: "#00ffff" }}
                    min="0"
                    max="3"
                  />
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button type="submit" style={{ padding: "8px 16px", background: "#00ffff", color: "#000", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>
                    Create Habit
                  </button>
                  <button type="button" onClick={() => setShowAddForm(false)} style={{ padding: "8px 16px", background: "#333", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}>
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {loading ? (
              <div style={{ textAlign: "center", color: "#00ffff", padding: "40px" }}>Loading...</div>
            ) : habits.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {habits.map(habit => (
                  <div
                    key={habit._id}
                    style={{ 
                      padding: "16px", 
                      background: "#0a0a0a", 
                      borderRadius: "8px", 
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      border: "1px solid transparent",
                      transition: "border-color 0.2s"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = "#00ffff"}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = "transparent"}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
                      <button
                        onClick={() => handleToggleComplete(habit._id, habit.completedToday || false)}
                        style={{
                          width: "40px",
                          height: "40px",
                          background: habit.completedToday ? "#00ff00" : "#1a1a1a",
                          border: habit.completedToday ? "none" : "2px solid #00ffff",
                          borderRadius: "8px",
                          cursor: "pointer",
                          fontSize: "20px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}
                      >
                        {habit.completedToday ? "✓" : ""}
                      </button>
                      <div style={{ flex: 1 }}>
                        <div 
                          style={{ color: "#fff", fontSize: "16px", cursor: "pointer" }}
                          onClick={() => setSelectedHabit(habit)}
                        >
                          {habit.name}
                        </div>
                        <div style={{ fontSize: "12px", color: "#888", marginTop: "2px" }}>
                          {habit.currentStreak > 0 && (
                            <span style={{ color: getStreakColor(habit.currentStreak) }}>
                              🔥 {habit.currentStreak} day streak
                            </span>
                          )}
                          {habit.currentStreak === 0 && <span>No streak yet</span>}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteHabit(habit._id);
                      }}
                      style={{ background: "none", border: "none", color: "#ff0000", cursor: "pointer", fontSize: "18px", marginLeft: "8px" }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: "center", color: "#666", padding: "40px" }}>
                No habits yet. Click "Add Habit" to start building positive routines!
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
