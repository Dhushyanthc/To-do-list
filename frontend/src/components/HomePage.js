import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './HomePage.css';
import Select from "react-select";

const options = [
  { value: "all", label: "All Tasks" },
  { value: "progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
];

const API_URL = process.env.REACT_APP_API_URL;

const HomePage = () => {
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch all tasks
  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/tasks`);
      if (response.data.success) {
        setTasks(response.data.data);
        setFilteredTasks(response.data.data);
      }
    } catch (err) {
      setError('Failed to fetch tasks');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Filter tasks based on search and status
  useEffect(() => {
    let result = tasks;

    if (searchTerm) {
      result = result.filter(task =>
        task.task.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== 'all') {
      result = result.filter(task => task.status === filterStatus);
    }

    setFilteredTasks(result);
  }, [searchTerm, filterStatus, tasks]);

  // Create new task
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;

    try {
      const response = await axios.post(`${API_URL}/api/tasks`, { task: newTask });
      if (response.data.success) {
        setTasks([response.data.data, ...tasks]);
        setNewTask('');
        setError('');
      }
    } catch (err) {
      setError('Failed to create task');
      console.error(err);
    }
  };

  // Delete task
  const handleDeleteTask = async (taskId) => {
    try {
      const response = await axios.delete(`${API_URL}/api/tasks/${taskId}`);
      if (response.data.success) {
        setTasks(tasks.filter(task => task.taskId !== taskId));
        setError('');
      }
    } catch (err) {
      setError('Failed to delete task');
      console.error(err);
    }
  };

  // Toggle task status
  const handleToggleStatus = async (taskId, currentStatus) => {
    const newStatus = currentStatus === 'completed' ? 'progress' : 'completed';
    try {
      const response = await axios.put(`${API_URL}/api/tasks/${taskId}`, { status: newStatus });
      if (response.data.success) {
        setTasks(tasks.map(task =>
          task.taskId === taskId ? { ...task, status: newStatus } : task
        ));
        setError('');
      }
    } catch (err) {
      setError('Failed to update task');
      console.error(err);
    }
  };

  // Start editing
  const handleStartEdit = (task) => {
    setEditingId(task.taskId);
    setEditText(task.task);
  };

  // Save edit
  const handleSaveEdit = async (taskId) => {
    if (!editText.trim()) return;

    try {
      const response = await axios.put(`${API_URL}/api/tasks/${taskId}`, { task: editText });
      if (response.data.success) {
        setTasks(tasks.map(task =>
          task.taskId === taskId ? { ...task, task: editText } : task
        ));
        setEditingId(null);
        setEditText('');
        setError('');
      }
    } catch (err) {
      setError('Failed to update task');
      console.error(err);
    }
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  return (
    <div className="home-page">
      <div className="container">
        <header className="header">
          <h1>📝 My Todo List</h1>
          <p>Stay organized and productive</p>
        </header>

        {/* Add Task Form */}
        <form className="add-task-form" onSubmit={handleCreateTask}>
          <input
            type="text"
            placeholder="Add a new task..."
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            className="task-input"
          />
          <button type="submit" className="add-btn">Add Task</button>
        </form>

        {/* Search and Filter */}
        <div className="controls">
          <input
            type="text"
            placeholder="🔍 Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <div style={{ width: "100%", maxWidth: "300px" }}>
            <Select
              options={options}
              defaultValue={options[0]}
              onChange={(selected) => setFilterStatus(selected.value)}
              menuPlacement="auto"
              menuPosition="fixed"
              styles={{
                menu: (provided) => ({
                  ...provided,
                  zIndex: 9999,
                }),
              }}
            />
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="tasks-container">
          {loading ? (
            <div className="loading-text">Loading tasks...</div>
          ) : filteredTasks.length === 0 ? (
            <div className="no-tasks">
              {searchTerm || filterStatus !== 'all'
                ? 'No tasks match your filters'
                : 'No tasks yet. Add one to get started!'}
            </div>
          ) : (
            <div className="tasks-list">
              {filteredTasks.map((task) => (
                <div
                  key={task.taskId}
                  className={`task-item ${task.status === 'completed' ? 'completed' : ''}`}
                >
                  {editingId === task.taskId ? (
                    <div className="edit-mode">
                      <input
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="edit-input"
                        autoFocus
                      />
                      <div className="edit-actions">
                        <button onClick={() => handleSaveEdit(task.taskId)} className="save-btn">
                          ✓
                        </button>
                        <button onClick={handleCancelEdit} className="cancel-btn">
                          ✕
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="task-left">
                        <input
                          type="checkbox"
                          checked={task.status === 'completed'}
                          onChange={() => handleToggleStatus(task.taskId, task.status)}
                          className="task-checkbox"
                        />
                        <span className="task-text">{task.task}</span>
                      </div>
                      <div className="task-actions">
                        <button
                          onClick={() => handleStartEdit(task)}
                          className="edit-btn"
                          disabled={task.status === 'completed'}
                        >
                          ✎
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task.taskId)}
                          className="delete-btn"
                        >
                          🗑
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="stats">
          <div className="stat-item">
            <span className="stat-number">{tasks.length}</span>
            <span className="stat-label">Total</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">
              {tasks.filter(t => t.status === 'progress').length}
            </span>
            <span className="stat-label">In Progress</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">
              {tasks.filter(t => t.status === 'completed').length}
            </span>
            <span className="stat-label">Completed</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;