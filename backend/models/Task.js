const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const taskSchema = new mongoose.Schema({
  taskId: {
    type: String,
    default: uuidv4,
    unique: true,
    required: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  projectId: {
    type: String,
    default: null,
    index: true
  },
  task: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  dueDate: {
    type: Date,
    default: null
  },
  priority: {
    type: Number,
    enum: [1, 2, 3, 4],
    default: 4
  },
  attachments: [{
    attachmentId: {
      type: String,
      default: uuidv4
    },
    filename: {
      type: String,
      required: true
    },
    originalName: {
      type: String,
      required: true
    },
    path: {
      type: String,
      required: true
    },
    mimetype: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    }
  }],
  status: {
    type: String,
    enum: ['completed', 'progress'],
    default: 'progress'
  }
}, {
  timestamps: true
});

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;
