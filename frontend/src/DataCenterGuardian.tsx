import React, { useState, useEffect } from 'react';

// --- mock data & types ---
interface TelemetryData {
  smart_5_raw: number;
  smart_187_raw: number;
  smart_188_raw: number;
  smart_197_raw: number;
  smart_198_raw: number;
}

interface Prediction {
  ttf_days: number;
  rul_days: number;
  risk_level: string;
  log_time: number;
}

// --- components ---
const PipelineTab = () => (
  <div className="card stagger-enter" style={{ animationDelay: '0.1s' }}>
    <h2 className="card-title">mlops pipeline roadmap</h2>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ padding: '1rem', borderLeft: '4px solid var(--accent)', backgroundColor: 'var(--bg-page)' }}>
        <h3>phase 1: infrastructure & extraction</h3>
        <p style={{ color: 'var(--text-muted)' }}>automated large-scale data engineering from backblaze zip archives.</p>
      </div>
      <div style={{ padding: '1rem', borderLeft: '4px solid var(--accent)', backgroundColor: 'var(--bg-page)' }}>
        <h3>phase 2: polars etl</h3>
        <p style={{ color: 'var(--text-muted)' }}>out-of-core streaming analytics and rolling window feature engineering.</p>
      </div>
      <div style={{ padding: '1rem', borderLeft: '4px solid var(--accent)', backgroundColor: 'var(--bg-page)' }}>
        <h3>phase 3: model training</h3>
        <p style={{ color: 'var(--text-muted)' }}>xgboost aft survival analysis with right censoring on gpu.</p>
      </div>
      <div style={{ padding: '1rem', borderLeft: '4px solid var(--accent)', backgroundColor: 'var(--bg-page)' }}>
        <h3>phase 4: production serving</h3>
        <p style={{ color: 'var(--text-muted)' }}>fastapi + onnx runtime containerized edge deployment.</p>
      </div>
    </div>
  </div>
);

export default function DataCenterGuardian() {
  const [activeTab, setActiveTab] = useState('pipeline');

  const tabs = ['pipeline', 'drive health', 'dataset', 'architecture', 'model config'];

  return (
    <div className="dashboard-container">
      <header className="header">
        <div>
          <h1 className="title">data center guardian</h1>
          <p style={{ color: 'var(--text-muted)' }}>predictive maintenance platform</p>
        </div>
        <nav className="tabs">
          {tabs.map((tab) => (
            <button
              key={tab}
              className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </nav>
      </header>
      
      <main>
        {activeTab === 'pipeline' && <PipelineTab />}
      </main>
    </div>
  );
}
