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

const DriveHealthTab = () => {
  const [telemetry, setTelemetry] = useState<TelemetryData>({
    smart_5_raw: 0,
    smart_187_raw: 0,
    smart_188_raw: 0,
    smart_197_raw: 0,
    smart_198_raw: 0
  });

  const [prediction, setPrediction] = useState<Prediction | null>(null);

  const simulateInference = () => {
    // simulate fastapi inference
    const penalty = (telemetry.smart_5_raw * 0.1) +
                    (telemetry.smart_187_raw * 0.5) +
                    (telemetry.smart_188_raw * 0.2) +
                    (telemetry.smart_197_raw * 0.3) +
                    (telemetry.smart_198_raw * 0.3);
    const base_log_time = 7.5;
    const log_time = Math.max(0.0, base_log_time - penalty);
    const ttf_days = Math.exp(log_time);
    
    let risk = "low";
    if (ttf_days < 90) risk = "critical";
    else if (ttf_days < 365) risk = "high";
    else if (ttf_days < 1000) risk = "medium";

    setPrediction({
      ttf_days: Number(ttf_days.toFixed(1)),
      rul_days: Number(Math.max(0, ttf_days - 30).toFixed(1)),
      risk_level: risk,
      log_time: Number(log_time.toFixed(4))
    });
  };

  return (
    <div className="card stagger-enter" style={{ animationDelay: '0.1s' }}>
      <h2 className="card-title">drive health & inference simulation</h2>
      
      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 300px' }}>
          <h3>smart telemetry inputs</h3>
          {Object.keys(telemetry).map(key => (
            <div className="input-group" key={key}>
              <label>{key.replace(/_/g, ' ')}</label>
              <input 
                type="number" 
                value={telemetry[key as keyof TelemetryData]} 
                onChange={(e) => setTelemetry({...telemetry, [key]: Number(e.target.value)})}
              />
            </div>
          ))}
          <button className="btn" onClick={simulateInference}>run prediction</button>
        </div>

        <div style={{ flex: '1 1 300px' }}>
          <h3>prediction results</h3>
          {prediction ? (
            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="metric">
                <span className="metric-label">remaining useful life</span>
                <span className="metric-value">{prediction.rul_days} days</span>
              </div>
              <div className="metric">
                <span className="metric-label">time to failure (ttf)</span>
                <span className="metric-value">{prediction.ttf_days} days</span>
              </div>
              <div>
                <span className="metric-label">risk level</span>
                <br/>
                <span className={`badge badge-${prediction.risk_level}`}>{prediction.risk_level}</span>
              </div>
              <div className="json-preview">
                {JSON.stringify(prediction, null, 2)}
              </div>
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>enter telemetry to simulate inference.</p>
          )}
        </div>
      </div>
    </div>
  );
};

const DatasetTab = () => (
  <div className="card stagger-enter" style={{ animationDelay: '0.1s' }}>
    <h2 className="card-title">dataset & telemetry</h2>
    
    <div className="metric-grid" style={{ marginBottom: '2rem' }}>
      <div className="card">
        <span className="metric-label">annualized failure rate (afr)</span>
        <span className="metric-value">1.12%</span>
      </div>
      <div className="card">
        <span className="metric-label">total drives</span>
        <span className="metric-value">240,000</span>
      </div>
      <div className="card">
        <span className="metric-label">drive days</span>
        <span className="metric-value">85,000,000</span>
      </div>
      <div className="card">
        <span className="metric-label">schema evolution</span>
        <span className="metric-value">v1.4</span>
      </div>
    </div>

    <h3>the "failure five" indicators</h3>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
      <div style={{ padding: '1rem', backgroundColor: 'var(--bg-page)', border: '1px solid var(--border)', borderRadius: '4px' }}>
        <strong>smart 5 (reallocated sectors)</strong>
        <p style={{ color: 'var(--text-muted)' }}>indicates platter degradation. sector reallocated to spare area.</p>
      </div>
      <div style={{ padding: '1rem', backgroundColor: 'var(--bg-page)', border: '1px solid var(--border)', borderRadius: '4px' }}>
        <strong>smart 187 (uncorrectable errors)</strong>
        <p style={{ color: 'var(--text-muted)' }}>hardware ecc failure during reads.</p>
      </div>
      <div style={{ padding: '1rem', backgroundColor: 'var(--bg-page)', border: '1px solid var(--border)', borderRadius: '4px' }}>
        <strong>smart 188 (command timeout)</strong>
        <p style={{ color: 'var(--text-muted)' }}>operations aborted due to timeout behavior.</p>
      </div>
      <div style={{ padding: '1rem', backgroundColor: 'var(--bg-page)', border: '1px solid var(--border)', borderRadius: '4px' }}>
        <strong>smart 197 & 198 (pending/uncorrectable)</strong>
        <p style={{ color: 'var(--text-muted)' }}>unreadable sectors pending reallocation.</p>
      </div>
    </div>
  </div>
);

const ArchitectureTab = () => (
  <div className="card stagger-enter" style={{ animationDelay: '0.1s' }}>
    <h2 className="card-title">mlops architecture</h2>
    <div className="diagram-container">
      <svg width="600" height="400" viewBox="0 0 600 400" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--text-primary)" />
          </marker>
        </defs>

        <rect x="50" y="50" width="150" height="60" rx="8" fill="var(--bg-card)" stroke="var(--border)" strokeWidth="2" />
        <text x="125" y="85" textAnchor="middle" fill="var(--text-primary)" fontSize="14">backblaze servers</text>

        <line x1="125" y1="110" x2="125" y2="150" stroke="var(--text-primary)" strokeWidth="2" markerEnd="url(#arrow)" />

        <rect x="50" y="150" width="150" height="60" rx="8" fill="var(--bg-card)" stroke="var(--border)" strokeWidth="2" />
        <text x="125" y="185" textAnchor="middle" fill="var(--text-primary)" fontSize="14">python ingestion</text>

        <line x1="200" y1="180" x2="250" y2="180" stroke="var(--text-primary)" strokeWidth="2" markerEnd="url(#arrow)" />

        <rect x="250" y="150" width="150" height="60" rx="8" fill="var(--bg-card)" stroke="var(--border)" strokeWidth="2" />
        <text x="325" y="185" textAnchor="middle" fill="var(--text-primary)" fontSize="14">google colab</text>

        <line x1="325" y1="210" x2="325" y2="250" stroke="var(--text-primary)" strokeWidth="2" markerEnd="url(#arrow)" />

        <rect x="250" y="250" width="150" height="60" rx="8" fill="var(--bg-card)" stroke="var(--border)" strokeWidth="2" />
        <text x="325" y="285" textAnchor="middle" fill="var(--text-primary)" fontSize="14">google drive</text>

        <line x1="400" y1="280" x2="450" y2="280" stroke="var(--text-primary)" strokeWidth="2" markerEnd="url(#arrow)" />

        <rect x="450" y="250" width="150" height="60" rx="8" fill="var(--bg-card)" stroke="var(--border)" strokeWidth="2" />
        <text x="525" y="285" textAnchor="middle" fill="var(--text-primary)" fontSize="14">fastapi + onnx</text>

      </svg>
    </div>
  </div>
);

const ModelConfigTab = () => {
  const [config, setConfig] = useState({
    learning_rate: 0.05,
    max_depth: 6,
    n_estimators: 100,
    aft_loss_distribution_scale: 1.2,
    aft_loss_distribution: 'normal',
    tree_method: 'hist',
    subsample: 0.8
  });

  return (
    <div className="card stagger-enter" style={{ animationDelay: '0.1s' }}>
      <h2 className="card-title">model configuration</h2>
      
      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 300px' }}>
          <h3>xgboost aft hyperparameters</h3>
          
          <div className="input-group">
            <label>learning rate</label>
            <input type="number" step="0.01" value={config.learning_rate} onChange={e => setConfig({...config, learning_rate: Number(e.target.value)})} />
          </div>
          <div className="input-group">
            <label>max depth</label>
            <input type="number" value={config.max_depth} onChange={e => setConfig({...config, max_depth: Number(e.target.value)})} />
          </div>
          <div className="input-group">
            <label>n estimators</label>
            <input type="number" value={config.n_estimators} onChange={e => setConfig({...config, n_estimators: Number(e.target.value)})} />
          </div>
          <div className="input-group">
            <label>aft loss scale</label>
            <input type="number" step="0.1" value={config.aft_loss_distribution_scale} onChange={e => setConfig({...config, aft_loss_distribution_scale: Number(e.target.value)})} />
          </div>
          <div className="input-group">
            <label>aft distribution</label>
            <select 
              value={config.aft_loss_distribution} 
              onChange={e => setConfig({...config, aft_loss_distribution: e.target.value})}
              style={{ padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--bg-page)', textTransform: 'lowercase' }}
            >
              <option value="normal">normal</option>
              <option value="logistic">logistic</option>
              <option value="extreme">extreme</option>
            </select>
          </div>
        </div>

        <div style={{ flex: '1 1 300px' }}>
          <h3>xgb.train() preview</h3>
          <div className="json-preview">
            {`import xgboost as xgb

params = {
    'objective': 'survival:aft',
    'eval_metric': 'aft-nloglik',
    'aft_loss_distribution': '${config.aft_loss_distribution}',
    'aft_loss_distribution_scale': ${config.aft_loss_distribution_scale},
    'tree_method': '${config.tree_method}',
    'learning_rate': ${config.learning_rate},
    'max_depth': ${config.max_depth},
    'subsample': ${config.subsample}
}

bst = xgb.train(
    params, 
    dtrain, 
    num_boost_round=${config.n_estimators}
)`}
          </div>
          
          <h3 style={{ marginTop: '2rem' }}>json export</h3>
          <div className="json-preview">
            {JSON.stringify(config, null, 2)}
          </div>
        </div>
      </div>
    </div>
  );
};

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
        {activeTab === 'drive health' && <DriveHealthTab />}
        {activeTab === 'dataset' && <DatasetTab />}
        {activeTab === 'architecture' && <ArchitectureTab />}
        {activeTab === 'model config' && <ModelConfigTab />}
      </main>
    </div>
  );
}
