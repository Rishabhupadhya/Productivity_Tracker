import { TIME_SLOTS } from "../../constants/timeSlots";
import TaskCard from "./TaskCard";
import UndoToast from "../ui/UndoToast";
import CurrentTimeLine from "./CurrentTimeLine";
import { useTasks } from "../../hooks/useTasks";
import "./board.css";
import { useSelectedDate } from "../../hooks/useSelectedDate";
import { getWeekDays, formatDate } from "../../utils/date";

export default function CalendarBoard() {
  const { tasks, moveTask, deleteTask, undoTask, undoDelete } = useTasks();
  const selectedDate = useSelectedDate();
  const week = getWeekDays(selectedDate);

  return (
    <>
      <div style={{ display: "flex", gap: "16px" }}>
        <div className="board">
          {week.map((dateObj) => {
            const dateStr = formatDate(dateObj);
            const isToday = formatDate(new Date()) === dateStr;

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
                  {isToday && <CurrentTimeLine />}

                  {TIME_SLOTS.map((slot) => (
                    <div
                      key={slot}
                      className="time-slot"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
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

      {undoTask && (
        <UndoToast message="Task deleted" onUndo={undoDelete} />
      )}
    </>
  );
}
