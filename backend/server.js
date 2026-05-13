const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
require('dotenv').config();

const auth = require('./middleware/auth');
const authHandlers = require('./handlers/authHandlers');
const taskHandlers = require('./handlers/taskHandlers');
const projectHandlers = require('./handlers/projectHandlers');
const reportHandlers = require('./handlers/reportHandlers');

const app = express();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max per file
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      'application/pdf',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain', 'text/csv',
      'application/zip', 'application/x-rar-compressed'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'), false);
    }
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(uploadsDir));

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/todolist');
    console.log('✅ MongoDB Connected Successfully');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

// ===== AUTH ROUTES (public) =====
app.post('/api/auth/signup', authHandlers.signup);
app.post('/api/auth/login', authHandlers.login);

// ===== PROTECTED ROUTES (require JWT) =====

// Auth profile routes
app.get('/api/auth/me', auth, authHandlers.getMe);
app.put('/api/auth/update-profile', auth, authHandlers.updateProfile);
app.put('/api/auth/change-password', auth, authHandlers.changePassword);

// Task routes
app.get('/api/tasks', auth, taskHandlers.getAllTasks);
app.get('/api/tasks/:id', auth, taskHandlers.getTaskById);
app.post('/api/tasks', auth, upload.array('attachments', 5), taskHandlers.createTask);
app.put('/api/tasks/:id', auth, upload.array('attachments', 5), taskHandlers.updateTask);
app.delete('/api/tasks/:id', auth, taskHandlers.deleteTask);
app.delete('/api/tasks/:id/attachments/:attachmentId', auth, taskHandlers.deleteAttachment);

// Project routes
app.get('/api/projects', auth, projectHandlers.getAllProjects);
app.get('/api/projects/:id', auth, projectHandlers.getProjectById);
app.post('/api/projects', auth, projectHandlers.createProject);
app.put('/api/projects/:id', auth, projectHandlers.updateProject);
app.delete('/api/projects/:id', auth, projectHandlers.deleteProject);
app.post('/api/projects/:id/members', auth, projectHandlers.addProjectMember);
app.get('/api/projects/:id/members', auth, projectHandlers.getProjectMembers);

// Report routes
app.post('/api/report/generate', auth, reportHandlers.generateReport);

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running'
  });
});

// Multer error handling middleware
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 10MB.'
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  if (err.message === 'File type not allowed') {
    return res.status(400).json({
      success: false,
      message: 'File type not allowed. Supported: images, PDF, Office documents, text, CSV, ZIP.'
    });
  }
  next(err);
});

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
};

startServer();
