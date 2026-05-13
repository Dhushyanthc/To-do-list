const mongoose = require('mongoose');

const projectMemberSchema = new mongoose.Schema({
  projectId: { 
    type: String, 
    required: true 
  },
  userId: { 
    type: String, 
    required: true 
  },
  role: { 
    type: String, 
    enum: ['owner', 'member'], 
    default: 'member' 
  }
}, { 
  timestamps: true 
});

// Prevent duplicate memberships for the same project/user
projectMemberSchema.index({ projectId: 1, userId: 1 }, { unique: true });

// Index for fast lookup of projects a user belongs to
projectMemberSchema.index({ userId: 1 });

const ProjectMember = mongoose.model('ProjectMember', projectMemberSchema);

module.exports = ProjectMember;
