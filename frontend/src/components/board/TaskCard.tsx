import "./task.css";

export default function TaskCard({
  task,
  onDelete
}: {
  task: any;
  onDelete: (task: any) => void;
}) {
  return (
    <div
      className="task green"
      draggable
      onDragStart={(e) =>
        e.dataTransfer.setData("taskId", task._id)
      }
    >
      <div className="task-header">
        <h5>{task.title}</h5>
        <button
          className="delete"
          onClick={() => onDelete(task)}
        >
          ✕
        </button>
      </div>

      <span>{task.duration}</span>
    </div>
  );
}
