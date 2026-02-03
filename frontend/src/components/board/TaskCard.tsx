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

  const handleToggleComplete = async (e: React.MouseEvent) => {
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
    if (completed) return '#48bb7840'; // Green tint for completed
    if (task.teamId) return '#00ffff20'; // Cyan tint for team tasks
    return 'transparent';
  };

  return (
    <motion.div
      className={`task green ${completed ? 'completed-task' : ''}`}
      draggable={draggable && !isCompleting}
      onDragStart={(e) =>
        e.dataTransfer.setData("taskId", task._id)
      }
      style={{ 
        background: getTaskColor(),
        opacity: completed ? 0.7 : 1,
        transition: 'all 0.3s ease'
      }}
      variants={cardVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
    >
      <div className="task-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
          {/* Completion Checkbox */}
          <button
            onClick={handleToggleComplete}
            disabled={isCompleting}
            className="task-checkbox"
            title={completed ? "Mark as incomplete" : "Mark as complete"}
            style={{
              width: '20px',
              height: '20px',
              border: '2px solid #00ffff',
              borderRadius: '4px',
              background: completed ? '#48bb78' : 'transparent',
              cursor: isCompleting ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'all 0.2s',
            }}
          >
            {completed && <span style={{ color: 'white', fontSize: '14px' }}>✓</span>}
          </button>

          <h5 style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '4px', 
            margin: 0,
            textDecoration: completed ? 'line-through' : 'none',
            flex: 1
          }}>
            {task.teamId && (
              <span 
                style={{ 
                  fontSize: '12px',
                  background: '#00ffff',
                  color: '#000',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  fontWeight: 'bold'
                }}
                title="Team Task"
              >
                👥
              </span>
            )}
            {task.title}
          </h5>
        </div>

        <button
          className="delete"
          onClick={() => onDelete(task)}
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
              position: 'relative',
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              border: '2px solid #00ffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'transform 0.2s',
              ...(task.assignedTo?.avatar && task.assignedTo.avatar.length > 1 ? {
                backgroundImage: `url(${env.BASE_URL}${task.assignedTo.avatar})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              } : {
                background: 'linear-gradient(135deg, #00ffff, #00aaaa)',
                color: '#000',
              })
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
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
    prevProps.task.assignedTo?.name === nextProps.task.assignedTo?.name &&
    prevProps.task.assignedTo?.avatar === nextProps.task.assignedTo?.avatar &&
    prevProps.draggable === nextProps.draggable
  );
});
