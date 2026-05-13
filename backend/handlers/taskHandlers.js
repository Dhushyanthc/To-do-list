const Task = require('../models/Task');
const ProjectMember = require('../models/ProjectMember');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Helper function
async function memberProjectIds(userId) {
  const memberships = await ProjectMember.find({ userId }).select('projectId');
  return memberships.map(m => m.projectId);
}

// Get all tasks for authenticated user (and their shared projects)
const getAllTasks = async (req, res) => {
  try {
    const projectIds = await memberProjectIds(req.user.userId);
    
    let query = {
      $or: [
        { userId: req.user.userId },
        { projectId: { $in: projectIds } }
      ]
    };

    // Optional filter by projectId
    if (req.query.projectId) {
      query.projectId = req.query.projectId;
    }

    const tasks = await Task.find(query).sort({ createdAt: -1 }).lean();

    // Fetch user projects to map project names
    const Project = require('../models/Project');
    // Fetch all projects the user is a member of or owns
    const projects = await Project.find({
       $or: [
         { userId: req.user.userId },
         { projectId: { $in: projectIds } }
       ]
    }).lean();
    
    const projectMap = {};
    projects.forEach(p => {
      projectMap[p.projectId] = p.name;
    });

    const tasksWithProjectName = tasks.map(task => ({
      ...task,
      projectName: task.projectId ? projectMap[task.projectId] || null : null
    }));

    res.status(200).json({
      success: true,
      data: tasksWithProjectName
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching tasks',
      error: error.message
    });
  }
};

// Get single task
const getTaskById = async (req, res) => {
  try {
    const task = await Task.findOne({ taskId: req.params.id });
    
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const projectIds = await memberProjectIds(req.user.userId);
    if (task.userId !== req.user.userId && !projectIds.includes(task.projectId)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    
    res.status(200).json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching task', error: error.message });
  }
};

// Create new task
const createTask = async (req, res) => {
  try {
    const { task, description, dueDate, priority, projectId } = req.body;
    
    if (!task) {
      return res.status(400).json({ success: false, message: 'Task description is required' });
    }

    if (projectId) {
      const projectIds = await memberProjectIds(req.user.userId);
      if (!projectIds.includes(projectId)) {
        // Double check they aren't the sole owner without a membership (legacy check)
        const Project = require('../models/Project');
        const legacyProj = await Project.findOne({ projectId, userId: req.user.userId });
        if (!legacyProj) {
           return res.status(403).json({ success: false, message: 'Not authorized to add tasks to this project' });
        }
      }
    }

    // Build attachments array from uploaded files
    const attachments = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        attachments.push({
          attachmentId: uuidv4(),
          filename: file.filename,
          originalName: file.originalname,
          path: `/uploads/${file.filename}`,
          mimetype: file.mimetype,
          size: file.size
        });
      });
    }
    
    const newTask = await Task.create({
      userId: req.user.userId,
      projectId: projectId || null,
      task,
      description: description || '',
      dueDate: dueDate || null,
      priority: priority ? parseInt(priority, 10) : 4,
      attachments,
      status: 'progress'
    });
    
    res.status(201).json({ success: true, data: newTask, message: 'Task created successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating task', error: error.message });
  }
};

// Update task
const updateTask = async (req, res) => {
  try {
    const taskObj = await Task.findOne({ taskId: req.params.id });
    if (!taskObj) return res.status(404).json({ success: false, message: 'Task not found' });

    const projectIds = await memberProjectIds(req.user.userId);
    if (taskObj.userId !== req.user.userId && !projectIds.includes(taskObj.projectId)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const { task, status, description, dueDate, priority, projectId } = req.body;
    
    const updateData = {};
    if (task !== undefined) updateData.task = task;
    if (status !== undefined) updateData.status = status;
    if (description !== undefined) updateData.description = description;
    if (dueDate !== undefined) updateData.dueDate = dueDate;
    if (priority !== undefined) updateData.priority = parseInt(priority, 10);
    if (projectId !== undefined) {
      if (projectId && !projectIds.includes(projectId)) {
        return res.status(403).json({ success: false, message: 'Not authorized for target project' });
      }
      updateData.projectId = projectId;
    }

    // If new files are uploaded, append them to existing attachments
    if (req.files && req.files.length > 0) {
      const newAttachments = req.files.map(file => ({
        attachmentId: uuidv4(),
        filename: file.filename,
        originalName: file.originalname,
        path: `/uploads/${file.filename}`,
        mimetype: file.mimetype,
        size: file.size
      }));
      updateData.attachments = [...(taskObj.attachments || []), ...newAttachments];
    }
    
    const updatedTask = await Task.findOneAndUpdate(
      { taskId: req.params.id },
      updateData,
      { new: true, runValidators: true }
    );
    
    res.status(200).json({ success: true, data: updatedTask, message: 'Task updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating task', error: error.message });
  }
};

// Delete task
const deleteTask = async (req, res) => {
  try {
    const taskObj = await Task.findOne({ taskId: req.params.id });
    if (!taskObj) return res.status(404).json({ success: false, message: 'Task not found' });

    const projectIds = await memberProjectIds(req.user.userId);
    if (taskObj.userId !== req.user.userId && !projectIds.includes(taskObj.projectId)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const deletedTask = await Task.findOneAndDelete({ taskId: req.params.id });

    // Clean up attached files from filesystem
    if (deletedTask.attachments && deletedTask.attachments.length > 0) {
      deletedTask.attachments.forEach(attachment => {
        const filePath = path.join(__dirname, '..', attachment.path);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    }
    
    res.status(200).json({ success: true, message: 'Task deleted successfully', data: deletedTask });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting task', error: error.message });
  }
};

// Delete a specific attachment from a task
const deleteAttachment = async (req, res) => {
  try {
    const { id, attachmentId } = req.params;

    const taskObj = await Task.findOne({ taskId: id });
    if (!taskObj) return res.status(404).json({ success: false, message: 'Task not found' });

    const projectIds = await memberProjectIds(req.user.userId);
    if (taskObj.userId !== req.user.userId && !projectIds.includes(taskObj.projectId)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const attachment = taskObj.attachments.find(a => a.attachmentId === attachmentId);
    if (!attachment) {
      return res.status(404).json({ success: false, message: 'Attachment not found' });
    }

    // Remove file from filesystem
    const filePath = path.join(__dirname, '..', attachment.path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Remove attachment from task document
    taskObj.attachments = taskObj.attachments.filter(a => a.attachmentId !== attachmentId);
    await taskObj.save();

    res.status(200).json({ success: true, message: 'Attachment deleted successfully', data: taskObj });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting attachment', error: error.message });
  }
};

module.exports = {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  deleteAttachment
};
