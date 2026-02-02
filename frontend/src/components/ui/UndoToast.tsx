import "./undoToast.css";

export default function UndoToast({
  message,
  onUndo
}: {
  message: string;
  onUndo: () => void;
}) {
  return (
    <div className="undo-toast">
      <span>{message}</span>
      <button onClick={onUndo}>UNDO</button>
    </div>
  );
}
