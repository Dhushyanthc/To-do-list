import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ReportPage.css';

const API_URL = process.env.REACT_APP_API_URL;

const ReportPage = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  
  const [reportData, setReportData] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/projects`);
      if (response.data.success) {
        setProjects(response.data.data);
        if (response.data.data.length > 0) {
          setSelectedProjectId(response.data.data[0].projectId);
        }
      }
    } catch (err) {
      setError('Failed to fetch projects');
    } finally {
      setIsLoadingProjects(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!selectedProjectId) return;
    
    setIsGenerating(true);
    setError('');
    setReportData(null);
    
    try {
      const response = await axios.post(`${API_URL}/api/report/generate`, {
        projectId: selectedProjectId
      });
      
      if (response.data.success) {
        setReportData(response.data.data);
      } else {
        setError(response.data.message || 'Failed to generate report');
      }
    } catch (err) {
      setError('Error communicating with AI service. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Helper to safely render the markdown-like text from Gemini
  const renderReportText = (text) => {
    if (!text) return null;
    return text.split('\n').map((line, i) => {
      // Bold syntax
      let formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        return <li key={i} dangerouslySetInnerHTML={{ __html: formattedLine.substring(2) }} />;
      }
      if (line.trim().length === 0) {
        return <br key={i} />;
      }
      return <p key={i} dangerouslySetInnerHTML={{ __html: formattedLine }} />;
    });
  };

  return (
    <div className="report-page">
      <div className="report-header">
        <h1>Project Report</h1>
        <p>Generate an AI summary of completed and pending tasks for a specific project.</p>
      </div>

      <div className="report-controls">
        <div className="form-group">
          <label>Select Project</label>
          <select 
            value={selectedProjectId} 
            onChange={e => setSelectedProjectId(e.target.value)}
            disabled={isLoadingProjects || isGenerating || projects.length === 0}
            className="project-select"
          >
            {projects.length === 0 ? (
              <option value="">No projects available</option>
            ) : (
              projects.map(p => (
                <option key={p.projectId} value={p.projectId}>
                  {p.name}
                </option>
              ))
            )}
          </select>
        </div>
        
        <button 
          className="generate-btn" 
          onClick={handleGenerateReport}
          disabled={isGenerating || !selectedProjectId}
        >
          {isGenerating ? (
            <>
              <span className="spinner"></span> Generating...
            </>
          ) : (
            'Generate AI Report'
          )}
        </button>
      </div>

      {error && <div className="report-error">{error}</div>}

      {reportData && (
        <div className="report-result-card">
          <div className="report-result-header">
            <h2>{reportData.projectName} Summary</h2>
            <div className="report-stats-badges">
              <span className="badge badge-success">{reportData.completedCount} Completed</span>
              <span className="badge badge-warning">{reportData.pendingCount} Pending</span>
            </div>
          </div>
          <div className="report-content">
            {renderReportText(reportData.report)}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportPage;
