const Task = require('../models/Task');
const Project = require('../models/Project');

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

// Generate report for a project using Gemini API
const generateReport = async (req, res) => {
  try {
    const { projectId } = req.body;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: 'Project ID is required'
      });
    }

    // Verify project belongs to user
    const project = await Project.findOne({ projectId, userId: req.user.userId });
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Fetch all tasks for this project
    const tasks = await Task.find({ projectId, userId: req.user.userId });
    const completedTasks = tasks.filter(t => t.status === 'completed');
    const pendingTasks = tasks.filter(t => t.status === 'progress');

    if (tasks.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          report: 'No tasks found in this project yet. Add some tasks to generate a report!',
          projectName: project.name
        }
      });
    }

    // Format tasks for Gemini prompt
    const completedList = completedTasks.map(t => {
      const completedAt = t.updatedAt ? new Date(t.updatedAt).toLocaleString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      }) : 'Unknown';
      return `- Task: "${t.task}"${t.description ? ` (${t.description})` : ''}\n  Completed at: ${completedAt}`;
    }).join('\n');

    const pendingList = pendingTasks.map(t => {
      const deadline = t.dueDate ? new Date(t.dueDate).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
      }) : 'No deadline set';
      return `- Task: "${t.task}"${t.description ? ` (${t.description})` : ''}\n  Deadline: ${deadline}`;
    }).join('\n');

    const prompt = `You are My Personal assistant.

You will be given with the tasks completed and the tasks yet to complete grounded to a project.

Rules -
- Don't answer on the tasks that are not there in the provided list
- Don't give too excitement answers keep it positive

Project Name: "${project.name}"

COMPLETED TASKS (${completedTasks.length}):
${completedList || 'None'}

INCOMPLETE/IN-PROGRESS TASKS (${pendingTasks.length}):
${pendingList || 'None'}

output format:-

for the task completed
Task description
Time he completed it

short summary

for the incomplete tasks
task description
deadline

summary`;

    // Call Gemini API
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: 'Gemini API key not configured'
      });
    }

    const geminiResponse = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.6,
          maxOutputTokens: 10000
        }
      })
    });

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.text();
      console.error('Gemini API error:', errorData);
      return res.status(500).json({
        success: false,
        message: 'Failed to generate report from AI'
      });
    }

    const geminiData = await geminiResponse.json();
    const reportText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'Unable to generate report.';

    res.status(200).json({
      success: true,
      data: {
        report: reportText,
        projectName: project.name,
        completedCount: completedTasks.length,
        pendingCount: pendingTasks.length,
        totalCount: tasks.length
      }
    });
  } catch (error) {
    console.error('Report generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating report',
      error: error.message
    });
  }
};

module.exports = {
  generateReport
};
