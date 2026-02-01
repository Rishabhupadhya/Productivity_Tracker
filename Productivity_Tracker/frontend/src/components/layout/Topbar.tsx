import { useState, useEffect } from "react";
import AddTaskModal from "../task/AddTaskModal";
import UserMenu from "./UserMenu";
import { getTeamMembers } from "../../services/team.service";
import "./topbar.css";

export default function Topbar({ showTaskControls = true }: { showTaskControls?: boolean }) {
  const [open, setOpen] = useState(false);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  useEffect(() => {
    getTeamMembers().then(setTeamMembers).catch(console.error);
  }, []);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    console.log('Date changed to:', newDate);
    setSelectedDate(newDate);
    window.dispatchEvent(
      new CustomEvent("date-change", {
        detail: newDate
      })
    );
  };

  return (
    <>
      <header className="topbar">
        <div className="left">
          {showTaskControls && (
            <>
              <button className="primary" onClick={() => setOpen(true)}>
                + Add Task
              </button>
              <div className="date-picker">
                <input
                  type="date"
                  className="date-input"
                  value={selectedDate}
                  onChange={handleDateChange}
                />
              </div>
            </>
          )}
        </div>

        <div className="right">
          <div className="avatar-group">
            {teamMembers.slice(0, 3).map((member) => (
              <span key={member._id} className="avatar" title={member.name}>
                {member.avatar || member.name.charAt(0).toUpperCase()}
              </span>
            ))}
            {teamMembers.length > 3 && (
              <span className="avatar" title={`+${teamMembers.length - 3} more`}>
                +{teamMembers.length - 3}
              </span>
            )}
          </div>
          <UserMenu />
        </div>
      </header>

      {open && showTaskControls && (
        <AddTaskModal
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
