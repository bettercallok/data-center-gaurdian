import { useState } from 'react';

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
const DriveHealthTab = () => {
  const [telemetry, setTelemetry] = useState<TelemetryData>({
    smart_5_raw: 12,
    smart_187_raw: 2,
    smart_188_raw: 0,
    smart_197_raw: 8,
    smart_198_raw: 8
  });

  const [prediction, setPrediction] = useState<Prediction | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const simulateInference = async () => {
    setLoading(true);
    setError('');
    try {
      // Hit the real Hugging Face backend API
      const res = await fetch('https://bettercallok-data-center-guardian.hf.space/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(telemetry)
      });
      
      if (!res.ok) throw new Error('API Error');
      
      const data = await res.json();
      setPrediction({
        ttf_days: data.ttf_days,
        rul_days: data.rul_days,
        risk_level: data.risk_level,
        log_time: data.log_time
      });
    } catch (err) {
      console.error(err);
      setError('Failed to connect to inference server.');
    } finally {
      setLoading(false);
    }
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
          <button className="btn" onClick={simulateInference} disabled={loading}>
            {loading ? 'running...' : 'run prediction'}
          </button>
          {error && <p style={{ color: 'var(--risk-critical)', marginTop: '1rem' }}>{error}</p>}
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
                <span className={`badge badge-${prediction.risk_level.toLowerCase()}`}>{prediction.risk_level}</span>
              </div>
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>enter telemetry to simulate inference.</p>
          )}
        </div>
      </div>
      
      <div className="card" style={{ marginTop: '2rem' }}>
        <h3>understanding the metrics: ttf vs rul</h3>
        <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', marginTop: '1rem' }}>
          <strong>time-to-failure (ttf):</strong> the absolute total lifespan of the drive from the day it was manufactured until the day it completely dies.
          <br/><br/>
          <strong>remaining useful life (rul):</strong> the estimated number of days left before the drive fails, calculated by taking the ttf and subtracting the number of days the drive has already been in operation.
        </p>
      </div>
    </div>
  );
};

const DatasetTab = () => (
  <div className="card stagger-enter" style={{ animationDelay: '0.1s' }}>
    <h2 className="card-title">dataset & telemetry</h2>
    
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem', marginBottom: '2rem' }}>
      <div className="stat-card">
        <span className="stat-label">annualized failure rate</span>
        <span className="stat-value">1.12%</span>
      </div>
      <div className="stat-card">
        <span className="stat-label">total drives</span>
        <span className="stat-value">240,000</span>
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
      </div>
    </div>
  );
};

export default function DataCenterGuardian() {
  const [activeTab, setActiveTab] = useState('drive health');

  const tabs = ['drive health', 'dataset', 'model config'];

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
        {activeTab === 'drive health' && <DriveHealthTab />}
        {activeTab === 'dataset' && <DatasetTab />}
        {activeTab === 'model config' && <ModelConfigTab />}
      </main>
    </div>
  );
}
