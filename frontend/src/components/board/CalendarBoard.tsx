import { TIME_SLOTS } from "../../constants/timeSlots";
import TaskCard from "./TaskCard";
import UndoToast from "../ui/UndoToast";
import CurrentTimeLine from "./CurrentTimeLine";
import { useTasks } from "../../hooks/useTasks";
import { useUser } from "../../contexts/UserContext";
import { useMemo } from "react";
import "./board.css";
import { useSelectedDate } from "../../hooks/useSelectedDate";
import { getWeekDays, formatDate } from "../../utils/date";

export default function CalendarBoard() {
  const { tasks, moveTask, deleteTask, undoTask, undoDelete } = useTasks();
  const { user } = useUser();
  const selectedDate = useSelectedDate();
  
  // Get settings with defaults
  const settings = user?.settings || {};
  const weekStartDay = settings.weekStartDay ?? 1;
  const showCurrentTimeline = settings.showCurrentTimeline ?? true;
  const enableDragDrop = settings.enableDragDrop ?? true;
  const enableUndoDelete = settings.enableUndoDelete ?? true;
  const focusMode = settings.focusMode ?? false;
  
  // Recalculate week when selectedDate or weekStartDay changes
  const week = useMemo(() => {
    console.log('Recalculating week for date:', selectedDate);
    const weekDays = getWeekDays(selectedDate, weekStartDay);
    console.log('Week days:', weekDays.map(d => d.toDateString()));
    return weekDays;
  }, [selectedDate, weekStartDay]);
  
  const today = formatDate(new Date());

  return (
    <>
      <div style={{ display: "flex", gap: "16px" }}>
        <div className="board">
          {week.map((dateObj) => {
            const dateStr = formatDate(dateObj);
            const isToday = today === dateStr;
            
            // Hide non-today columns in focus mode
            if (focusMode && !isToday) return null;

            return (
              <div key={dateStr} className="column">
                <h4>
                  {dateObj.toLocaleDateString("en-US", {
                    weekday: "short",
                    day: "numeric",
                    month: "short"
                  })}
                </h4>

                <div className="column-body">
                  {isToday && showCurrentTimeline && <CurrentTimeLine />}

                  {TIME_SLOTS.map((slot) => (
                    <div
                      key={slot}
                      className="time-slot"
                      onDragOver={(e) => enableDragDrop && e.preventDefault()}
                      onDrop={(e) => {
                        if (!enableDragDrop) return;
                        const taskId = e.dataTransfer.getData("taskId");
                        moveTask(taskId, dateStr, slot);
                      }}
                    >
                      <span className="slot-label">{slot}</span>

                      {tasks
                        .filter(
                          (t) => t.day === dateStr && t.startTime === slot
                        )
                        .map((task) => (
                          <TaskCard
                            key={task._id}
                            task={task}
                            onDelete={deleteTask}
                            draggable={enableDragDrop}
                          />
                        ))}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {undoTask && enableUndoDelete && (
        <UndoToast message="Task deleted" onUndo={undoDelete} />
      )}
    </>
  );
}
