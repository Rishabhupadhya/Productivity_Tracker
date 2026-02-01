import "./waiting.css";

export default function WaitingList() {
  return (
    <aside className="waiting">
      <h4>Waiting List</h4>

      <div className="waiting-task blue">Upload translations</div>
      <div className="waiting-task green">Write announcement</div>
      <div className="waiting-task purple">Review SEO article</div>
    </aside>
  );
}
