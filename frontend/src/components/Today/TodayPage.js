import React, { useState, useMemo } from 'react';
import TaskItem from '../shared/TaskItem';
import AddTaskForm from '../shared/AddTaskForm';
import './TodayPage.css';

const TodayPage = ({ tasks, onCreateTask, onToggleStatus, onEditTask, onDeleteTask, onDeleteAttachment }) => {
  const [showAddForm, setShowAddForm] = useState(false);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const todayTasks = useMemo(() => {
    return tasks.filter(task => {
      if (!task.dueDate) return false;
      const taskDate = new Date(task.dueDate);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate.getTime() === today.getTime();
    });
  }, [tasks, today]);

  const activeTasks = todayTasks.filter(t => t.status === 'progress');

  return (
    <div className="today-page">
      <div className="page-header">
        <h1 className="page-title">Today</h1>
        <div className="today-subtitle">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <span>{activeTasks.length} task{activeTasks.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      <div className="tasks-section">
        {todayTasks.length === 0 && !showAddForm ? (
          <div className="empty-state">
            <div className="empty-state-icon">☀️</div>
            <h3>No tasks for today</h3>
            <p>Enjoy your day, or add a task to get started!</p>
          </div>
        ) : (
          <div className="tasks-list">
            {todayTasks.map((task) => (
              <TaskItem
                key={task.taskId}
                task={task}
                onToggleStatus={onToggleStatus}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
                onDeleteAttachment={onDeleteAttachment}
              />
            ))}
          </div>
        )}

        {showAddForm ? (
          <AddTaskForm
            onSubmit={(data) => {
              onCreateTask({ ...data, dueDate: today.toISOString() });
              setShowAddForm(false);
            }}
            onCancel={() => setShowAddForm(false)}
            defaultDate={today}
          />
        ) : (
          <button
            className="add-task-trigger"
            onClick={() => setShowAddForm(true)}
          >
            <span className="add-task-trigger-icon">+</span>
            <span>Add task</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default TodayPage;
