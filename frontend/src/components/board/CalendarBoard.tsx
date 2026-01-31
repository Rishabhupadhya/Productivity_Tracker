import { TIME_SLOTS } from "../../constants/timeSlots";
import TaskCard from "./TaskCard";
import UndoToast from "../ui/UndoToast";
import { useTasks } from "../../hooks/useTasks";
import "./board.css";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];

export default function CalendarBoard() {
  const { tasks, moveTask, deleteTask, undoTask, undoDelete } = useTasks();

  return (
    <>
      <div style={{ display: "flex", gap: "16px" }}>
        <div className="board">
          {days.map((day) => (
            <div key={day} className="column">
              <h4>{day}</h4>

              {TIME_SLOTS.map((slot) => (
                <div
                  key={slot}
                  className="time-slot"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    const taskId = e.dataTransfer.getData("taskId");
                    moveTask(taskId, day, slot);
                  }}
                >
                  <span className="slot-label">{slot}</span>

                  {tasks
                    .filter(
                      (t) => t.day === day && t.startTime === slot
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
          ))}
        </div>
      </div>

      {undoTask && (
        <UndoToast message="Task deleted" onUndo={undoDelete} />
      )}
    </>
  );
}
