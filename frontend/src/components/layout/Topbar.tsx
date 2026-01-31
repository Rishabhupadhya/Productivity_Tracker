import { useState, useEffect } from "react";
import AddTaskModal from "../task/AddTaskModal";
import UserMenu from "./UserMenu";
import { getTeamMembers } from "../../services/team.service";
import "./topbar.css";

export default function Topbar() {
  const [open, setOpen] = useState(false);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);

  useEffect(() => {
    getTeamMembers().then(setTeamMembers).catch(console.error);
  }, []);

  return (
    <>
      <header className="topbar">
        <div className="left">
          <button className="primary" onClick={() => setOpen(true)}>
            + Add Task
          </button>
          <div className="date-picker">
            <input
              type="date"
              className="date-input"
              onChange={(e) => {
                window.dispatchEvent(
                  new CustomEvent("date-change", {
                    detail: e.target.value
                  })
                );
              }}
            />
          </div>
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

      {open && (
        <AddTaskModal
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
