import { TIME_SLOTS } from "../../constants/timeSlots";
import TaskCard from "./TaskCard";
import UndoToast from "../ui/UndoToast";
import CurrentTimeLine from "./CurrentTimeLine";
import MobileDateSelector from "../ui/MobileDateSelector";
import { useTasks } from "../../hooks/useTasks";
import { useUser } from "../../contexts/UserContext";
import { useMemo, useCallback } from "react";
import "./board.css";
import { useSelectedDate } from "../../hooks/useSelectedDate";
import { getWeekDays, formatDate } from "../../utils/date";

export default function CalendarBoard() {
  const { tasks, moveTask: moveTaskOriginal, deleteTask: deleteTaskOriginal, undoTask, undoDelete, refreshTasks } = useTasks();
  const { user } = useUser();
  const selectedDate = useSelectedDate();

  // Memoize handlers to prevent re-creating functions
  const moveTask = useCallback((taskId: string, day: string, startTime?: string) => {
    moveTaskOriginal(taskId, day, startTime);
  }, [moveTaskOriginal]);

  const deleteTask = useCallback((task: any) => {
    deleteTaskOriginal(task);
  }, [deleteTaskOriginal]);

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
    console.log('Week days:', weekDays.map((d: Date) => d.toDateString()));
    return weekDays;
  }, [selectedDate, weekStartDay]);

  const today = formatDate(new Date());

  // Convert selectedDate to string format for MobileDateSelector
  const selectedDateString = selectedDate instanceof Date
    ? formatDate(selectedDate)
    : typeof selectedDate === 'string'
      ? selectedDate
      : formatDate(new Date());

  // Pre-calculate task map for O(1) lookups during render
  // This prevents filtered calculations in every single slot
  const taskMap = useMemo(() => {
    const map: Record<string, Record<string, any[]>> = {};
    if (!Array.isArray(tasks)) {
      console.warn("CalendarBoard: tasks is not an array", tasks);
      return map;
    }

    tasks.forEach(task => {
      if (!task || !task.day || !task.startTime) return;
      if (!map[task.day]) map[task.day] = {};
      if (!map[task.day][task.startTime]) map[task.day][task.startTime] = [];
      map[task.day][task.startTime].push(task);
    });
    return map;
  }, [tasks]);

  // Memoize drag handlers to prevent function re-creation
  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (enableDragDrop) e.preventDefault();
  }, [enableDragDrop]);

  const createDropHandler = useCallback((dateStr: string, slot: string) => {
    return (e: React.DragEvent) => {
      if (!enableDragDrop) return;
      const taskId = e.dataTransfer.getData("taskId");
      moveTask(taskId, dateStr, slot);
    };
  }, [enableDragDrop, moveTask]);

  return (
    <>
      {/* Mobile Date Selector - shows only on mobile/tablet */}
      <MobileDateSelector value={selectedDateString} />

      <div style={{ display: "flex", gap: "16px" }}>
        <div className="board">
          {week.map((dateObj: Date) => {
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

                  {TIME_SLOTS.map((slot) => {
                    const dropHandler = createDropHandler(dateStr, slot);
                    const slotTasks = taskMap[dateStr]?.[slot] || [];

                    return (
                      <div
                        key={slot}
                        className="time-slot"
                        onDragOver={handleDragOver}
                        onDrop={dropHandler}
                      >
                        <span className="slot-label">{slot}</span>

                        {slotTasks.map((task: any) => (
                          <TaskCard
                            key={task._id}
                            task={task}
                            onDelete={deleteTask}
                            onUpdate={refreshTasks}
                            draggable={enableDragDrop}
                          />
                        ))}
                      </div>
                    );
                  })}
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
