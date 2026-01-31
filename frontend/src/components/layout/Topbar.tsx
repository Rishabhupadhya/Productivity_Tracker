import { useState } from "react";
import AddTaskModal from "../task/AddTaskModal";
import "./topbar.css";

export default function Topbar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="topbar">
        <div>
          <button className="primary" onClick={() => setOpen(true)}>
            + Add Task
          </button>
          <span className="date">Today</span>
        </div>

        <div className="right">
          <div className="avatar-group">
            <span className="avatar">A</span>
            <span className="avatar">M</span>
          </div>
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
