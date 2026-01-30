import TaskCard from "./TaskCard";
import WaitingList from "./WaitingList";
import { useTasks } from "../../hooks/useTasks";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];

export default function CalendarBoard() {
  const { tasks, moveTask, deleteTask } = useTasks();

  return (
    <div style={{ display: "flex", gap: "16px" }}>
      <div className="board">
        {days.map((day) => (
          <div
            key={day}
            className="column"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              const taskId = e.dataTransfer.getData("taskId");
              moveTask(taskId, day);
            }}
          >
            <h4>{day}</h4>

            {tasks
              .filter((t) => t.day === day)
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

      <WaitingList />
    </div>
  );
}
