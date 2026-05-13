import React from 'react';
import './LoadingScreen.css';

const LoadingScreen = () => {
  return (
    <div className="loading-screen">
      <div className="loading-content">
        <div className="spinner"></div>
        <h1>Todo List</h1>
        <p>Organizing your tasks...</p>
      </div>
    </div>
  );
};

export default LoadingScreen;
