import { useState, useEffect } from "react";
import { getMomentumStats } from "../services/momentum.service";
import type { MomentumStats } from "../services/momentum.service";
import { getTodaysHabits } from "../services/habit.service";
import type { Habit } from "../services/habit.service";

export default function MomentumDashboard() {
  const [stats, setStats] = useState<MomentumStats | null>(null);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [momentumStats, habitsData] = await Promise.all([
        getMomentumStats(),
        getTodaysHabits()
      ]);
      setStats(momentumStats);
      setHabits(habitsData);
    } catch (error) {
      console.error("Failed to load momentum data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "24px", textAlign: "center", color: "#00ffff" }}>
        Loading momentum...
      </div>
    );
  }

  if (!stats) {
    return (
      <div style={{ padding: "24px", textAlign: "center", color: "#ff0000" }}>
        Failed to load momentum stats
      </div>
    );
  }

  const activeStreaks = habits.filter(h => h.currentStreak > 0);
  const completedToday = habits.filter(h => h.completedToday).length;

  return (
    <div style={{ padding: "24px", background: "#0b0f14", minHeight: "100%", color: "#fff" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ marginBottom: "32px" }}>
          <h1 style={{ color: "#00ffff", fontSize: "32px", marginBottom: "8px" }}>⚡ Momentum Dashboard</h1>
          <p style={{ color: "#888", fontSize: "14px" }}>Track your progress and level up through consistency</p>
        </div>

        {/* XP & Level Section */}
        <div style={{ 
          background: "linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)", 
          padding: "32px", 
          borderradius: "16px", 
          marginBottom: "24px",
          border: "2px solid #00ffff"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
            <div>
              <div style={{ fontSize: "14px", color: "#00ffff", marginBottom: "4px" }}>LEVEL</div>
              <div style={{ fontSize: "48px", fontWeight: "bold", color: "#fff" }}>{stats.level}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "14px", color: "#888", marginBottom: "4px" }}>TOTAL XP</div>
              <div style={{ fontSize: "24px", fontWeight: "bold", color: "#00ffff" }}>{stats.xp.toLocaleString()}</div>
            </div>
          </div>

          {/* XP Progress Bar */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#888", marginBottom: "8px" }}>
              <span>Level {stats.level}</span>
              <span>{stats.levelProgress.toFixed(1)}% to Level {stats.level + 1}</span>
            </div>
            <div style={{ background: "#0a0a0a", height: "16px", borderradius: "8px", overflow: "hidden" }}>
              <div style={{
                background: "linear-gradient(90deg, #00ffff 0%, #00ff00 100%)",
                height: "100%",
                width: `${stats.levelProgress}%`,
                transition: "width 0.5s ease",
                boxShadow: "0 0 10px rgba(0, 255, 255, 0.5)"
              }} />
            </div>
            <div style={{ fontSize: "12px", color: "#666", marginTop: "8px" }}>
              {(stats.xpForNextLevel - stats.xp).toLocaleString()} XP to next level
            </div>
          </div>
        </div>

        {/* Momentum Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "16px", marginBottom: "24px" }}>
          {/* Today's Momentum */}
          <div style={{ background: "#1a1a1a", padding: "24px", borderradius: "12px", border: "1px solid #333" }}>
            <div style={{ fontSize: "14px", color: "#00ffff", marginBottom: "12px" }}>🔥 TODAY'S MOMENTUM</div>
            <div style={{ fontSize: "36px", fontWeight: "bold", color: "#fff", marginBottom: "8px" }}>
              {stats.momentumToday}
            </div>
            <div style={{ fontSize: "12px", color: "#888" }}>XP earned today</div>
          </div>

          {/* Weekly Momentum */}
          <div style={{ background: "#1a1a1a", padding: "24px", borderradius: "12px", border: "1px solid #333" }}>
            <div style={{ fontSize: "14px", color: "#00ffff", marginBottom: "12px" }}>📊 WEEK'S MOMENTUM</div>
            <div style={{ fontSize: "36px", fontWeight: "bold", color: "#fff", marginBottom: "8px" }}>
              {stats.momentumWeek}
            </div>
            <div style={{ fontSize: "12px", color: "#888" }}>XP earned this week</div>
          </div>

          {/* Habits Completed Today */}
          <div style={{ background: "#1a1a1a", padding: "24px", borderradius: "12px", border: "1px solid #333" }}>
            <div style={{ fontSize: "14px", color: "#00ffff", marginBottom: "12px" }}>✅ COMPLETED TODAY</div>
            <div style={{ fontSize: "36px", fontWeight: "bold", color: "#fff", marginBottom: "8px" }}>
              {completedToday} / {habits.length}
            </div>
            <div style={{ fontSize: "12px", color: "#888" }}>Habits completed</div>
          </div>

          {/* Active Streaks */}
          <div style={{ background: "#1a1a1a", padding: "24px", borderradius: "12px", border: "1px solid #333" }}>
            <div style={{ fontSize: "14px", color: "#00ffff", marginBottom: "12px" }}>🔥 ACTIVE STREAKS</div>
            <div style={{ fontSize: "36px", fontWeight: "bold", color: "#fff", marginBottom: "8px" }}>
              {activeStreaks.length}
            </div>
            <div style={{ fontSize: "12px", color: "#888" }}>Habits with streaks</div>
          </div>
        </div>

        {/* Streaks List */}
        {activeStreaks.length > 0 && (
          <div>
            <h2 style={{ color: "#00ffff", fontSize: "20px", marginBottom: "16px" }}>🏆 Current Streaks</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "12px" }}>
              {activeStreaks.map(habit => (
                <div 
                  key={habit._id}
                  style={{ 
                    background: "#1a1a1a", 
                    padding: "20px", 
                    borderradius: "12px",
                    border: "1px solid #333",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between"
                  }}
                >
                  <div>
                    <div style={{ fontSize: "16px", fontWeight: "500", color: "#fff", marginBottom: "4px" }}>
                      {habit.name}
                    </div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "32px", fontWeight: "bold", color: "#00ff00" }}>
                      {habit.currentStreak}
                    </div>
                    <div style={{ fontSize: "12px", color: "#888" }}>days</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* XP Rules Info */}
        <div style={{ 
          marginTop: "32px", 
          padding: "24px", 
          background: "#1a1a1a", 
          borderradius: "12px",
          border: "1px solid #333"
        }}>
          <h3 style={{ color: "#00ffff", fontSize: "18px", marginBottom: "16px" }}>💡 How to Earn XP</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
            <div>
              <div style={{ fontSize: "24px", marginBottom: "4px" }}>🎯</div>
              <div style={{ fontSize: "14px", color: "#fff", fontWeight: "500" }}>+10 XP</div>
              <div style={{ fontSize: "12px", color: "#888" }}>Complete a habit</div>
            </div>
            <div>
              <div style={{ fontSize: "24px", marginBottom: "4px" }}>✓</div>
              <div style={{ fontSize: "14px", color: "#fff", fontWeight: "500" }}>+15 XP</div>
              <div style={{ fontSize: "12px", color: "#888" }}>Complete a task</div>
            </div>
            <div>
              <div style={{ fontSize: "24px", marginBottom: "4px" }}>📈</div>
              <div style={{ fontSize: "14px", color: "#fff", fontWeight: "500" }}>+50 XP</div>
              <div style={{ fontSize: "12px", color: "#888" }}>Reach a milestone</div>
            </div>
            <div>
              <div style={{ fontSize: "24px", marginBottom: "4px" }}>🏆</div>
              <div style={{ fontSize: "14px", color: "#fff", fontWeight: "500" }}>+100 XP</div>
              <div style={{ fontSize: "12px", color: "#888" }}>Complete a goal</div>
            </div>
            <div>
              <div style={{ fontSize: "24px", marginBottom: "4px" }}>🔥</div>
              <div style={{ fontSize: "14px", color: "#fff", fontWeight: "500" }}>+2 XP/day</div>
              <div style={{ fontSize: "12px", color: "#888" }}>Streak bonus</div>
            </div>
            <div>
              <div style={{ fontSize: "24px", marginBottom: "4px" }}>👥</div>
              <div style={{ fontSize: "14px", color: "#fff", fontWeight: "500" }}>+50% XP</div>
              <div style={{ fontSize: "12px", color: "#888" }}>Team habits</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
