const Project = require('../models/Project');
const Task = require('../models/Task');
const ProjectMember = require('../models/ProjectMember');
const User = require('../models/User');

// Helper to get project IDs a user is a member of
async function memberProjectIds(userId) {
  const memberships = await ProjectMember.find({ userId }).select('projectId');
  return memberships.map(m => m.projectId);
}

// Get all projects for user
const getAllProjects = async (req, res) => {
  try {
    const projectIds = await memberProjectIds(req.user.userId);
    const projects = await Project.find({ projectId: { $in: projectIds } }).sort({ createdAt: -1 });

    // Get task counts for each project
    const projectsWithCounts = await Promise.all(
      projects.map(async (project) => {
        // Shared projects -> count all tasks in project, not just user's tasks
        const totalTasks = await Task.countDocuments({ projectId: project.projectId });
        const completedTasks = await Task.countDocuments({ projectId: project.projectId, status: 'completed' });
        const progressTasks = await Task.countDocuments({ projectId: project.projectId, status: 'progress' });
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
    const membership = await ProjectMember.findOne({ projectId: req.params.id, userId: req.user.userId });
    if (!membership) {
      return res.status(404).json({
        success: false,
        message: 'Project not found or unauthorized'
      });
    }

    const project = await Project.findOne({ projectId: req.params.id });
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const tasks = await Task.find({ projectId: project.projectId }).sort({ createdAt: -1 });
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

    // Add creator as owner in ProjectMember
    await ProjectMember.create({
      projectId: project.projectId,
      userId: req.user.userId,
      role: 'owner'
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
    // Check if user is at least a member
    const membership = await ProjectMember.findOne({ projectId: req.params.id, userId: req.user.userId });
    if (!membership) {
      return res.status(403).json({ success: false, message: 'Not authorized to update project' });
    }

    const { name, description, deadline } = req.body;
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (deadline !== undefined) updateData.deadline = deadline;

    const project = await Project.findOneAndUpdate(
      { projectId: req.params.id },
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
    // Only owner should delete project, but for simplicity we can check membership or owner
    const membership = await ProjectMember.findOne({ projectId: req.params.id, userId: req.user.userId, role: 'owner' });
    if (!membership) {
      return res.status(403).json({ success: false, message: 'Only project owner can delete' });
    }

    const project = await Project.findOneAndDelete({ projectId: req.params.id });
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Delete all tasks belonging to this project
    await Task.deleteMany({ projectId: project.projectId });
    
    // Delete all memberships
    await ProjectMember.deleteMany({ projectId: project.projectId });

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

// Add a member to a project
const addProjectMember = async (req, res) => {
  try {
    const { email } = req.body;
    const { id: projectId } = req.params;

    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    // 1. Check caller is already a member of this project
    const callerMembership = await ProjectMember.findOne({
      projectId,
      userId: req.user.userId
    });
    if (!callerMembership) return res.status(403).json({ success: false, message: 'Not authorized to invite to this project' });

    // 2. Look up the invited user by email
    const invitee = await User.findOne({ email });
    if (!invitee) return res.status(404).json({ success: false, message: 'No user found with that email' });

    // 3. Add them (upsert so re-inviting is safe)
    await ProjectMember.findOneAndUpdate(
      { projectId, userId: invitee.userId },
      { role: 'member' },
      { upsert: true, new: true }
    );

    res.status(200).json({ success: true, message: `${email} added to project` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error adding teammate', error: error.message });
  }
};

// Get members of a project
const getProjectMembers = async (req, res) => {
  try {
    const { id: projectId } = req.params;

    const membership = await ProjectMember.findOne({ projectId, userId: req.user.userId });
    if (!membership) return res.status(403).json({ success: false, message: 'Not authorized' });

    const members = await ProjectMember.find({ projectId });
    
    // Map to user info
    const userIds = members.map(m => m.userId);
    const users = await User.find({ userId: { $in: userIds } }, 'userId name email');
    
    // Merge role
    const membersList = users.map(u => {
      const mem = members.find(m => m.userId === u.userId);
      return {
        userId: u.userId,
        name: u.name,
        email: u.email,
        role: mem ? mem.role : 'member'
      };
    });

    res.status(200).json({ success: true, data: membersList });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching members', error: error.message });
  }
};

module.exports = {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  addProjectMember,
  getProjectMembers
};
