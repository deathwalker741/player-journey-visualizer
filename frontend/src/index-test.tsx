import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

function TestApp() {
  return (
    <div>
      <h1>Player Journey Visualization Tool</h1>
      <p>Frontend is working! Backend is at http://localhost:8000</p>
      <p>Current time: {new Date().toLocaleString()}</p>
    </div>
  );
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <TestApp />
  </React.StrictMode>
);
