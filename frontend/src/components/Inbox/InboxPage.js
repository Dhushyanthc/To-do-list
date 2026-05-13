import React, { useState, useMemo } from 'react';
import Select from 'react-select';
import TaskItem from '../shared/TaskItem';
import AddTaskForm from '../shared/AddTaskForm';
import './InboxPage.css';

const filterOptions = [
  { value: 'all', label: 'All Tasks' },
  { value: 'progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
];

const selectStyles = {
  control: (base, state) => ({
    ...base,
    minHeight: '38px',
    borderColor: state.isFocused ? '#427AB5' : '#ddd',
    boxShadow: state.isFocused ? '0 0 0 1px #427AB5' : 'none',
    borderRadius: '8px',
    fontSize: '13px',
    '&:hover': { borderColor: '#427AB5' },
  }),
  option: (base, state) => ({
    ...base,
    fontSize: '13px',
    backgroundColor: state.isSelected ? '#d1453b' : state.isFocused ? '#fafaf8' : 'white',
    color: state.isSelected ? 'white' : '#333',
    '&:active': { backgroundColor: '#fce8e6' },
  }),
  menu: (base) => ({
    ...base,
    borderRadius: '8px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
    zIndex: 20,
  }),
  menuList: (base) => ({
    ...base,
    padding: '4px',
  }),
  placeholder: (base) => ({
    ...base,
    color: '#aaa',
  }),
  singleValue: (base) => ({
    ...base,
    color: '#333',
  }),
  indicatorSeparator: () => ({ display: 'none' }),
};

const InboxPage = ({ tasks, onCreateTask, onToggleStatus, onEditTask, onDeleteTask, onDeleteAttachment }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredTasks = useMemo(() => {
    let result = tasks;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(task =>
        task.task.toLowerCase().includes(term) ||
        (task.description && task.description.toLowerCase().includes(term))
      );
    }

    if (filterStatus !== 'all') {
      result = result.filter(task => task.status === filterStatus);
    }

    return result;
  }, [tasks, searchTerm, filterStatus]);

  const hasActiveFilters = searchTerm.trim() || filterStatus !== 'all';

  return (
    <div className="inbox-page">
      <div className="page-header">
        <h1 className="page-title">Inbox</h1>
      </div>

      {/* Search & Filter Controls */}
      <div className="inbox-controls">
        <div className="search-wrapper">
          <span className="search-icon">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            type="text"
            className="search-input"
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="search-clear" onClick={() => setSearchTerm('')}>✕</button>
          )}
        </div>
        <div className="filter-wrapper">
          <Select
            options={filterOptions}
            defaultValue={filterOptions[0]}
            onChange={(selected) => setFilterStatus(selected.value)}
            styles={selectStyles}
            isSearchable={false}
            menuPlacement="auto"
            menuPosition="fixed"
          />
        </div>
      </div>

      <div className="tasks-section">
        {filteredTasks.length === 0 && !showAddForm ? (
          <div className="empty-state">
            {hasActiveFilters ? (
              <>
                <div className="empty-state-icon">🔍</div>
                <h3>No tasks match your filters</h3>
                <p>Try adjusting your search or filter criteria.</p>
              </>
            ) : (
              <>
                <div className="empty-state-icon">📥</div>
                <h3>Your inbox is empty</h3>
                <p>Tasks you add without a specific date will appear here.</p>
              </>
            )}
          </div>
        ) : (
          <div className="tasks-list">
            {filteredTasks.map((task) => (
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
              onCreateTask(data);
              setShowAddForm(false);
            }}
            onCancel={() => setShowAddForm(false)}
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

export default InboxPage;
