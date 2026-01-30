import "./task.css";

export default function TaskCard({
  task,
  onDelete
}: {
  task: any;
  onDelete: (id: string) => void;
}) {
  return (
    <div
      className="task green"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("taskId", task._id);
      }}
    >
      <div className="task-header">
        <h5>{task.title}</h5>
        <button
          className="delete"
          onClick={() => {
            if (confirm("Delete this task?")) {
              onDelete(task._id);
            }
          }}
        >
          ✕
        </button>
      </div>

      <span>{task.duration}</span>
    </div>
  );
}
