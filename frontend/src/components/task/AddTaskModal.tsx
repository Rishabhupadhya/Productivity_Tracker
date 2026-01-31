import { useState } from "react";
import { useTasks } from "../../hooks/useTasks";
import "./modal.css";

export default function AddTaskModal({ onClose }: { onClose: () => void }) {
  const { addTask } = useTasks();
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState("");
  const [day, setDay] = useState("Mon");
  const [startTime, setStartTime] = useState("09:00");

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h3>Add Task</h3>

        <input
          placeholder="Task title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <input
          placeholder="Duration (1h 30m)"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
        />

        <select value={day} onChange={(e) => setDay(e.target.value)}>
          <option>Mon</option>
          <option>Tue</option>
          <option>Wed</option>
          <option>Thu</option>
          <option>Fri</option>
        </select>

        <input
          type="time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
        />

        <div className="actions">
          <button onClick={onClose}>Cancel</button>
          <button
            className="primary"
            onClick={async () => {
              await addTask({ title, duration, day, startTime });
              onClose();
            }}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
