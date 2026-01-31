import { useState } from "react";
import "./sidebar.css";

export default function Sidebar() {
  const [active, setActive] = useState("My Work");

  const Item = ({ label }: { label: string }) => (
    <a
      className={active === label ? "active" : ""}
      onClick={() => {
        setActive(label);
        // Dispatch custom event to notify CalendarBoard
        window.dispatchEvent(new CustomEvent('viewChanged', { detail: { view: label } }));
      }}
    >
      {label}
    </a>
  );

  return (
    <aside className="sidebar">
      <h2 className="logo">⚡ Tracker</h2>

      <p className="section">Workspace</p>
      <Item label="My Work" />
      <Item label="Teams" />

      <p className="section">Projects</p>
      <Item label="Marketing" />
      <Item label="Design" />
      <Item label="Development" />
    </aside>
  );
}
