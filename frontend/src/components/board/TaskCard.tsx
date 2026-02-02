import "./task.css";

export default function TaskCard({
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
    <div
      className="task green"
      draggable={draggable}
      onDragStart={(e) =>
        e.dataTransfer.setData("taskId", task._id)
      }
      style={{ background: getTaskColor() }}
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
    </div>
  );
}
