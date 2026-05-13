import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import TaskItem from '../shared/TaskItem';
import AddTaskForm from '../shared/AddTaskForm';
import 'react-datepicker/dist/react-datepicker.css';
import './ProjectDetail.css';

const API_URL = process.env.REACT_APP_API_URL;

const ProjectDetail = () => {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const fetchProjectDetails = React.useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/api/projects/${id}`);
      if (response.data.success) {
        setProject(response.data.data);
        setTasks(response.data.data.tasks || []);
      }
    } catch (err) {
      setError('Failed to fetch project details');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProjectDetails();
  }, [fetchProjectDetails]);

  const handleCreateTask = async (taskData) => {
    try {
      const hasFiles = taskData.attachments && taskData.attachments.length > 0;
      let response;

      // Add projectId to the payload
      if (hasFiles) {
        const formData = new FormData();
        formData.append('task', taskData.task);
        if (taskData.description) formData.append('description', taskData.description);
        if (taskData.dueDate) formData.append('dueDate', taskData.dueDate);
        if (taskData.priority) formData.append('priority', taskData.priority);
        formData.append('projectId', id);
        
        taskData.attachments.forEach(file => {
          formData.append('attachments', file);
        });
        
        response = await axios.post(`${API_URL}/api/tasks`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        response = await axios.post(`${API_URL}/api/tasks`, {
          task: taskData.task,
          description: taskData.description || '',
          dueDate: taskData.dueDate || null,
          priority: taskData.priority || 4,
          projectId: id
        });
      }

      if (response.data.success) {
        setTasks(prev => [response.data.data, ...prev]);
        setShowAddForm(false);
      }
    } catch (err) {
      setError('Failed to create task');
    }
  };

  const handleToggleStatus = async (taskId, currentStatus) => {
    const newStatus = currentStatus === 'completed' ? 'progress' : 'completed';
    try {
      const response = await axios.put(`${API_URL}/api/tasks/${taskId}`, { status: newStatus });
      if (response.data.success) {
        setTasks(prev => prev.map(task =>
          task.taskId === taskId ? { ...task, status: newStatus } : task
        ));
      }
    } catch (err) {
      setError('Failed to update task');
    }
  };

  const handleEditTask = async (taskId, updateData) => {
    try {
      const response = await axios.put(`${API_URL}/api/tasks/${taskId}`, updateData);
      if (response.data.success) {
        setTasks(prev => prev.map(task =>
          task.taskId === taskId ? response.data.data : task
        ));
      }
    } catch (err) {
      setError('Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      const response = await axios.delete(`${API_URL}/api/tasks/${taskId}`);
      if (response.data.success) {
        setTasks(prev => prev.filter(task => task.taskId !== taskId));
      }
    } catch (err) {
      setError('Failed to delete task');
    }
  };

  const handleDeleteAttachment = async (taskId, attachmentId) => {
    try {
      const response = await axios.delete(`${API_URL}/api/tasks/${taskId}/attachments/${attachmentId}`);
      if (response.data.success) {
        setTasks(prev => prev.map(task =>
          task.taskId === taskId ? response.data.data : task
        ));
      }
    } catch (err) {
      setError('Failed to delete attachment');
    }
  };

  // Filter tasks for the selected date
  const tasksForSelectedDate = useMemo(() => {
    return tasks.filter(task => {
      if (!task.dueDate) return false;
      const taskDate = new Date(task.dueDate);
      return (
        taskDate.getDate() === selectedDate.getDate() &&
        taskDate.getMonth() === selectedDate.getMonth() &&
        taskDate.getFullYear() === selectedDate.getFullYear()
      );
    });
  }, [tasks, selectedDate]);

  if (isLoading) return <div className="projects-loading">Loading project...</div>;
  if (error || !project) return <div className="projects-error">{error || 'Project not found'}</div>;

  return (
    <div className="project-detail-page">
      <div className="project-detail-header">
        <Link to="/projects" className="back-link">← Back to Projects</Link>
        <h1>{project.name}</h1>
        {project.deadline && (
          <div className="project-deadline" style={{ fontSize: '14px', color: '#d1453b', marginBottom: '8px', fontWeight: '600' }}>
            Deadline: {new Date(project.deadline).toLocaleDateString()}
          </div>
        )}
        {project.description && <p className="project-description">{project.description}</p>}
      </div>

      <div className="project-detail-layout">
        {/* Left Column: Calendar & Date tasks */}
        <div className="project-calendar-section">
          <div className="calendar-container">
            <DatePicker
              selected={selectedDate}
              onChange={date => setSelectedDate(date)}
              inline
              highlightDates={tasks.map(t => t.dueDate ? new Date(t.dueDate) : null).filter(Boolean)}
            />
          </div>

          <div className="date-tasks">
            <h3>Tasks for {selectedDate.toLocaleDateString()}</h3>
            
            {tasksForSelectedDate.length === 0 ? (
              <p className="no-tasks-msg">No tasks scheduled for this day.</p>
            ) : (
              <div className="tasks-list">
                {tasksForSelectedDate.map(task => (
                  <TaskItem
                    key={task.taskId}
                    task={task}
                    onToggleStatus={handleToggleStatus}
                    onEdit={handleEditTask}
                    onDelete={handleDeleteTask}
                    onDeleteAttachment={handleDeleteAttachment}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: All Tasks & Add Task */}
        <div className="project-all-tasks-section">
          <div className="section-header">
            <h2>All Project Tasks</h2>
          </div>

          <div className="tasks-list">
            {tasks.map(task => (
              <TaskItem
                key={task.taskId}
                task={task}
                onToggleStatus={handleToggleStatus}
                onEdit={handleEditTask}
                onDelete={handleDeleteTask}
                onDeleteAttachment={handleDeleteAttachment}
              />
            ))}
          </div>

          {showAddForm ? (
            <div className="project-add-task-wrapper">
              <AddTaskForm
                onSubmit={handleCreateTask}
                onCancel={() => setShowAddForm(false)}
                initialDate={selectedDate}
              />
            </div>
          ) : (
            <button
              className="add-task-trigger"
              onClick={() => setShowAddForm(true)}
            >
              <span className="add-task-trigger-icon">+</span>
              <span>Add task to project</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;
