import { motion } from "framer-motion";
import { memo } from "react";
import { cardVariants } from "../../utils/motionVariants";
import "./task.css";

function TaskCard({
  task,
  onDelete,
  draggable = true
}: {
  task: any;
  onDelete: (task: any) => void;
  draggable?: boolean;
}) {
  const getTaskColor = () => {
    if (task.teamId) return '#00ffff20'; // Team tasks get cyan tint
    return 'transparent';
  };

  return (
    <motion.div
      className="task green"
      draggable={draggable}
      onDragStart={(e) =>
        e.dataTransfer.setData("taskId", task._id)
      }
      style={{ background: getTaskColor() }}
      variants={cardVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
    >
      <div className="task-header">
        <h5 style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
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
            title={`Assigned to: ${task.assignedTo.name}`}
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
              ...(task.assignedTo.avatar ? {
                backgroundImage: `url(http://localhost:5001${task.assignedTo.avatar})`,
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
            {!task.assignedTo.avatar && task.assignedTo.name.charAt(0).toUpperCase()}
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
