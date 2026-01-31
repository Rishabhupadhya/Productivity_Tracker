import { useState, useEffect } from "react";
import { useTasks } from "../../hooks/useTasks";
import { useSelectedDate } from "../../hooks/useSelectedDate";
import { formatDate, getWeekDays } from "../../utils/date";
import { TIME_SLOTS } from "../../constants/timeSlots";
import { getTeamMembers } from "../../services/team.service";
import "./modal.css";

export default function AddTaskModal({ onClose }: { onClose: () => void }) {
  const { addTask } = useTasks();
  const selectedDate = useSelectedDate();
  const weekDays = getWeekDays(selectedDate);
  
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState("1h");
  const [startTime, setStartTime] = useState("09:00");
  const [date, setDate] = useState(formatDate(selectedDate));
  const [category, setCategory] = useState("work");
  const [assignedTo, setAssignedTo] = useState("");
  const [teamMembers, setTeamMembers] = useState<any[]>([]);

  useEffect(() => {
    getTeamMembers().then(setTeamMembers).catch(console.error);
  }, []);

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h3>Add Task</h3>

        <input
          placeholder="Task title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <select value={duration} onChange={(e) => setDuration(e.target.value)}>
          <option value="30m">30 minutes</option>
          <option value="1h">1 hour</option>
          <option value="1h 30m">1 hour 30 minutes</option>
          <option value="2h">2 hours</option>
          <option value="2h 30m">2 hours 30 minutes</option>
          <option value="3h">3 hours</option>
          <option value="4h">4 hours</option>
        </select>

        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          min={formatDate(new Date())}
        />

        <select value={startTime} onChange={(e) => setStartTime(e.target.value)}>
          {TIME_SLOTS.map((slot) => (
            <option key={slot} value={slot}>
              {slot}
            </option>
          ))}
        </select>

        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="work">Work</option>
          <option value="personal">Personal</option>
          <option value="meeting">Meeting</option>
          <option value="study">Study</option>
          <option value="other">Other</option>
        </select>

        <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}>
          <option value="">Assign to...</option>
          {teamMembers.map((member) => (
            <option key={member._id} value={member._id}>
              {member.name} ({member.email})
            </option>
          ))}
        </select>

        <div className="actions">
          <button onClick={onClose}>Cancel</button>
          <button
            className="primary"
            onClick={async () => {
              await addTask({ title, duration, day: date, startTime, assignedTo });
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
