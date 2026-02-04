import { Task } from "./task.model";
import { User } from "../auth.model";
import { Team } from "../team/team.model";
import { logActivity } from "../activity/activity.service";

export const createTask = async (
  title: string,
  duration: string,
  day: string,
  startTime: string,
  userId: string,
  assignedTo?: string
) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  const taskData: any = {
    title,
    duration,
    day,
    startTime,
    userId,
    assignedTo: assignedTo || userId,
    workspaceId: user.workspaceId,
    scheduledTime: startTime,
    completed: false,
    status: "pending"
    // scheduledDate will be auto-set by pre-save middleware from day field
  };

  // If user has active team, add teamId
  if (user.activeTeamId) {
    const team = await Team.findById(user.activeTeamId);
    if (team) {
      // Check if user is a member
      const isMember = team.members.some(m => m.userId.toString() === userId);
      if (isMember) {
        taskData.teamId = user.activeTeamId;
      }
    }
  }

  const task = await Task.create(taskData);

  // Log activity for all tasks (team or personal)
  await logActivity({
    teamId: taskData.teamId?.toString() || "",
    userId,
    action: "task_created",
    targetType: "task",
    targetId: task._id.toString(),
    details: { taskTitle: title }
  });

  return task;
};

export const getTasksByUser = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  // Get personal tasks or team tasks
  const query: any = {
    $or: [
      { userId, teamId: { $exists: false } }, // Personal tasks
      { userId, teamId: null } // Personal tasks with null teamId
    ]
  };

  // If user has active team, also get team tasks
  if (user.activeTeamId) {
    query.$or.push({ teamId: user.activeTeamId });
  }

  return Task.find(query).populate('assignedTo', 'name email avatar');
};

export const updateTaskDay = async (
  taskId: string,
  day: string,
  userId: string
) => {
  const task = await Task.findById(taskId);
  if (!task) throw new Error("Task not found");

  // Check permissions
  if (task.teamId) {
    const team = await Team.findById(task.teamId);
    if (!team) throw new Error("Team not found");

    const member = team.members.find(m => m.userId.toString() === userId);
    if (!member) throw new Error("Not authorized");

    // Members can only update their assigned tasks, admins can update any
    if (member.role !== "admin" && task.assignedTo?.toString() !== userId) {
      throw new Error("Not authorized");
    }
  } else {
    // Personal task - only owner can update
    if (task.userId.toString() !== userId) {
      throw new Error("Not authorized");
    }
  }

  const updatedTask = await Task.findOneAndUpdate(
    { _id: taskId },
    { day },
    { new: true }
  );

  // Log activity for all tasks
  await logActivity({
    teamId: task.teamId?.toString() || "",
    userId,
    action: "task_updated",
    targetType: "task",
    targetId: taskId,
    details: {
      taskTitle: task.title,
      changes: `Moved to ${day}`
    }
  });

  return updatedTask;
};

export const deleteTask = async (taskId: string, userId: string) => {
  const task = await Task.findById(taskId);
  if (!task) throw new Error("Task not found");

  // Check permissions
  if (task.teamId) {
    const team = await Team.findById(task.teamId);
    if (!team) throw new Error("Team not found");

    const member = team.members.find(m => m.userId.toString() === userId);
    if (!member || member.role !== "admin") {
      throw new Error("Only admins can delete team tasks");
    }
  } else {
    // Personal task - only owner can delete
    if (task.userId.toString() !== userId) {
      throw new Error("Not authorized");
    }
  }

  const deletedTask = await Task.findOneAndDelete({ _id: taskId });

  // Log activity for all tasks
  await logActivity({
    teamId: task.teamId?.toString() || "",
    userId,
    action: "task_deleted",
    targetType: "task",
    targetId: taskId,
    details: { taskTitle: task.title }
  });

  return deletedTask;
};

export const updateTaskSlot = async (
  taskId: string,
  day: string,
  startTime: string,
  userId: string
) => {
  const task = await Task.findById(taskId);
  if (!task) throw new Error("Task not found");

  // Check permissions (same as updateTaskDay)
  if (task.teamId) {
    const team = await Team.findById(task.teamId);
    if (!team) throw new Error("Team not found");

    const member = team.members.find(m => m.userId.toString() === userId);
    if (!member) throw new Error("Not authorized");

    if (member.role !== "admin" && task.assignedTo?.toString() !== userId) {
      throw new Error("Not authorized");
    }
  } else {
    if (task.userId.toString() !== userId) {
      throw new Error("Not authorized");
    }
  }

  return Task.findOneAndUpdate(
    { _id: taskId },
    { day, startTime },
    { new: true }
  ).populate('assignedTo', 'name email avatar');
};

/**
 * Toggle task completion status
 * Updates completed, completedAt, and status fields
 */
export const toggleTaskCompletion = async (
  taskId: string,
  userId: string,
  completed: boolean
) => {
  const task = await Task.findById(taskId);
  if (!task) throw new Error("Task not found");

  // Check permissions
  if (task.teamId) {
    const team = await Team.findById(task.teamId);
    if (!team) throw new Error("Team not found");

    const member = team.members.find(m => m.userId.toString() === userId);
    if (!member) throw new Error("Not authorized");

    // Only assigned user or admin can toggle completion
    if (member.role !== "admin" && task.assignedTo?.toString() !== userId) {
      throw new Error("Not authorized");
    }
  } else {
    // Personal task - only owner can toggle
    if (task.userId.toString() !== userId) {
      throw new Error("Not authorized");
    }
  }

  // Update completion fields
  const updateData: any = {
    completed,
    status: completed ? "completed" : "pending"
  };

  if (completed) {
    updateData.completedAt = new Date();
  } else {
    updateData.completedAt = null;
  }

  const updatedTask = await Task.findOneAndUpdate(
    { _id: taskId },
    updateData,
    { new: true }
  ).populate('assignedTo', 'name email avatar');

  // Log activity for all tasks
  await logActivity({
    teamId: task.teamId?.toString() || "",
    userId,
    action: completed ? "task_completed" : "task_uncompleted",
    targetType: "task",
    targetId: taskId,
    details: { taskTitle: task.title }
  });

  return updatedTask;
};
