import React, { useState, useEffect } from 'react';
import LoadingScreen from './components/LoadingScreen';
import HomePage from './components/HomePage';
import './App.css';

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Show loading screen for 2 seconds
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="App">
      {loading ? <LoadingScreen /> : <HomePage />}
    </div>
  );
}

export default App;
