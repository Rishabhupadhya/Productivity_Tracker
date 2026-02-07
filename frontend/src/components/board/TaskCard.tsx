import { motion } from "framer-motion";
import { memo, useState } from "react";
import { cardVariants } from "../../utils/motionVariants";
import { toggleTaskCompletion } from "../../services/task.service";
import { env } from "../../config/env";
import "./task.css";

function TaskCard({
  task,
  onDelete,
  onUpdate,
  draggable = true
}: {
  task: any;
  onDelete: (task: any) => void;
  onUpdate?: () => void;
  draggable?: boolean;
}) {
  const [isCompleting, setIsCompleting] = useState(false);
  const [completed, setCompleted] = useState(task.completed || false);

  const handleToggleComplete = async (e: React.SyntheticEvent) => {
    e.stopPropagation(); // Prevent drag start

    try {
      setIsCompleting(true);
      const newCompletedState = !completed;
      await toggleTaskCompletion(task._id, newCompletedState);
      setCompleted(newCompletedState);

      // Notify parent to refresh data
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Failed to toggle task completion:", error);
      alert("Failed to update task. Please try again.");
    } finally {
      setIsCompleting(false);
    }
  };

  const getTaskColor = () => {
    if (completed) return 'rgba(16, 185, 129, 0.1)'; // Success tint
    if (task.teamId) return 'rgba(59, 130, 246, 0.1)'; // Team tint
    return 'var(--bg-card)';
  };

  return (
    <motion.div
      className={`task ${completed ? 'completed' : ''}`}
      draggable={draggable && !isCompleting}
      onDragStart={(e: any) => e.dataTransfer.setData("taskId", task._id)}
      style={{
        background: getTaskColor(),
        opacity: completed ? 0.6 : 1,
        borderLeft: `3px solid ${task.teamId ? 'var(--accent-primary)' : (completed ? 'var(--success)' : 'var(--border-strong)')}`,
      }}
      variants={cardVariants}
      initial="initial"
      animate="animate"
      whileHover={{ y: -2, boxShadow: 'var(--shadow-md)', scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="task-header">
        <label className="checkbox-container" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={completed}
            onChange={handleToggleComplete}
            disabled={isCompleting}
          />
          <span className="checkmark"></span>
        </label>

        <h5 style={{
          textDecoration: completed ? 'line-through' : 'none',
          color: completed ? 'var(--text-secondary)' : 'var(--text-primary)',
          flex: 1
        }}>
          {task.teamId && (
            <span className="team-badge" title="Team Task">
              T
            </span>
          )}
          {task.title}
        </h5>

        <button
          className="delete-btn"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(task);
          }}
        >
          ✕
        </button>
      </div>

      <div className="task-footer">
        <span className="duration">{task.duration}</span>
        {task.assignedTo && (
          <div
            className="assignee-avatar"
            title={`Assigned to: ${task.assignedTo?.name || 'Unassigned'}`}
            style={{
              backgroundImage: task.assignedTo?.avatar ? `url(${env.BASE_URL}${task.assignedTo.avatar})` : undefined,
            }}
          >
            {!task.assignedTo?.avatar && (task.assignedTo?.name?.charAt(0)?.toUpperCase() || '?')}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default memo(TaskCard, (prevProps, nextProps) => {
  return (
    prevProps.task._id === nextProps.task._id &&
    prevProps.task.title === nextProps.task.title &&
    prevProps.task.day === nextProps.task.day &&
    prevProps.task.startTime === nextProps.task.startTime &&
    prevProps.task.duration === nextProps.task.duration &&
    prevProps.task.teamId === nextProps.task.teamId &&
    prevProps.task.completed === nextProps.task.completed &&
    prevProps.task.assignedTo?.name === nextProps.task.assignedTo?.name &&
    prevProps.task.assignedTo?.avatar === nextProps.task.assignedTo?.avatar &&
    prevProps.draggable === nextProps.draggable
  );
});
