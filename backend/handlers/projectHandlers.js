const Project = require('../models/Project');
const Task = require('../models/Task');

// Get all projects for user
const getAllProjects = async (req, res) => {
  try {
    const projects = await Project.find({ userId: req.user.userId }).sort({ createdAt: -1 });

    // Get task counts for each project
    const projectsWithCounts = await Promise.all(
      projects.map(async (project) => {
        const totalTasks = await Task.countDocuments({ projectId: project.projectId, userId: req.user.userId });
        const completedTasks = await Task.countDocuments({ projectId: project.projectId, userId: req.user.userId, status: 'completed' });
        const progressTasks = await Task.countDocuments({ projectId: project.projectId, userId: req.user.userId, status: 'progress' });
        return {
          ...project.toObject(),
          totalTasks,
          completedTasks,
          progressTasks
        };
      })
    );

    res.status(200).json({
      success: true,
      data: projectsWithCounts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching projects',
      error: error.message
    });
  }
};

// Get single project with tasks
const getProjectById = async (req, res) => {
  try {
    const project = await Project.findOne({ projectId: req.params.id, userId: req.user.userId });
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const tasks = await Task.find({ projectId: project.projectId, userId: req.user.userId }).sort({ createdAt: -1 });
    const completedTasks = tasks.filter(t => t.status === 'completed');
    const progressTasks = tasks.filter(t => t.status === 'progress');

    res.status(200).json({
      success: true,
      data: {
        ...project.toObject(),
        tasks,
        completedTasks: completedTasks.length,
        progressTasks: progressTasks.length,
        totalTasks: tasks.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching project',
      error: error.message
    });
  }
};

// Create project
const createProject = async (req, res) => {
  try {
    const { name, description, deadline } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Project name is required'
      });
    }

    const project = await Project.create({
      userId: req.user.userId,
      name,
      description: description || '',
      deadline: deadline || null
    });

    res.status(201).json({
      success: true,
      data: { ...project.toObject(), totalTasks: 0, completedTasks: 0, progressTasks: 0 },
      message: 'Project created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating project',
      error: error.message
    });
  }
};

// Update project
const updateProject = async (req, res) => {
  try {
    const { name, description, deadline } = req.body;
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (deadline !== undefined) updateData.deadline = deadline;

    const project = await Project.findOneAndUpdate(
      { projectId: req.params.id, userId: req.user.userId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    res.status(200).json({
      success: true,
      data: project,
      message: 'Project updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating project',
      error: error.message
    });
  }
};

// Delete project and its tasks
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findOneAndDelete({ projectId: req.params.id, userId: req.user.userId });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Delete all tasks belonging to this project
    await Task.deleteMany({ projectId: project.projectId, userId: req.user.userId });

    res.status(200).json({
      success: true,
      message: 'Project and its tasks deleted successfully',
      data: project
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting project',
      error: error.message
    });
  }
};

module.exports = {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject
};
