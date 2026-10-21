import { useState } from 'react';
import { login, register, updatePreferences } from '../../api';
import './AuthModal.css';

export default function AuthModal({ isOpen, onClose, user, onAuthSuccess, onLogout }) {
  const [isRegister, setIsRegister] = useState(false);
  const [isPreferences, setIsPreferences] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [riskTolerance, setRiskTolerance] = useState(user?.preferences?.riskTolerance || 'moderate');
  const [maxWeight, setMaxWeight] = useState(user?.preferences?.maxAssetWeight || 0.35);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSignOut = () => {
    if (onLogout) onLogout();
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isPreferences) {
        const res = await updatePreferences({
          riskTolerance,
          maxAssetWeight: Number(maxWeight),
        });
        onAuthSuccess({ ...user, preferences: res.preferences });
        setIsPreferences(false);
        onClose();
      } else if (isRegister) {
        const res = await register(name, email, password, {
          riskTolerance,
          maxAssetWeight: Number(maxWeight),
        });
        onAuthSuccess(res.user);
        onClose();
      } else {
        const res = await login(email, password);
        onAuthSuccess(res.user);
        onClose();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 1. Signed-in Account View: when user is already authenticated
  if (user && !isPreferences) {
    return (
      <div className="auth-modal-backdrop" onClick={onClose}>
        <div className="auth-modal-content" onClick={(e) => e.stopPropagation()}>
          <button className="auth-modal-close" onClick={onClose}>
            ✕
          </button>

          <div className="auth-modal-header">
            <div
              className="auth-modal-badge"
              style={{
                background: 'rgba(46, 229, 157, 0.15)',
                borderColor: 'rgba(46, 229, 157, 0.4)',
                color: '#2ee59d',
              }}
            >
              ● Active Terminal Session
            </div>
            <h2>Account Profile</h2>
            <p>You are signed in. Your portfolios and trades sync to MongoDB Atlas.</p>
          </div>

          <div
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #d4af37, #2ee59d)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  fontWeight: 700,
                  color: '#0d1b2a',
                }}
              >
                {user.name ? user.name[0].toUpperCase() : 'U'}
              </div>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 600, color: '#eae0ce' }}>{user.name}</div>
                <div style={{ fontSize: '13px', color: '#8da4be' }}>{user.email}</div>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px',
                paddingTop: '12px',
                borderTop: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              <div>
                <div style={{ fontSize: '11px', color: '#8da4be', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Tier
                </div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#2ee59d' }}>
                  {user.tier ? user.tier.toUpperCase() : 'PRO'} TRADER
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#8da4be', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Database
                </div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#d4af37' }}>MongoDB Atlas</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              type="button"
              onClick={handleSignOut}
              id="modal-signout-btn"
              style={{
                width: '100%',
                background: 'rgba(255, 92, 92, 0.16)',
                border: '1px solid rgba(255, 92, 92, 0.45)',
                color: '#ff6b6b',
                fontWeight: 700,
                fontSize: '14px',
                padding: '12px',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
            >
              Sign Out
            </button>
            <button
              type="button"
              onClick={() => setIsPreferences(true)}
              style={{
                width: '100%',
                background: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#8da4be',
                fontSize: '13px',
                padding: '10px',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              ⚙️ Risk Preferences &amp; Limits
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Preferences Form or Guest Sign In / Register View
  return (
    <div className="auth-modal-backdrop" onClick={onClose}>
      <div className="auth-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="auth-modal-close" onClick={onClose}>
          ✕
        </button>

        <div className="auth-modal-header">
          <div className="auth-modal-badge">RiskFrame v2 Accounts</div>
          <h2>
            {isPreferences
              ? 'Personal Risk Preferences'
              : isRegister
              ? 'Create Personal Account'
              : 'Sign In to Terminal'}
          </h2>
          <p>
            {isPreferences
              ? 'Configure your optimization constraints saved in MongoDB.'
              : isRegister
              ? 'Save personal portfolios, access Redis caching, and consult your Agent.'
              : 'Access your saved portfolios and customized risk thresholds.'}
          </p>
        </div>

        {error && <div className="auth-modal-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-modal-form">
          {isPreferences ? (
            <>
              <div className="form-group">
                <label>Risk Tolerance Profile</label>
                <select value={riskTolerance} onChange={(e) => setRiskTolerance(e.target.value)}>
                  <option value="conservative">Conservative (Low Volatility, Defensive)</option>
                  <option value="moderate">Moderate (Balanced Sharpe Maximization)</option>
                  <option value="aggressive">Aggressive (High Alpha Conviction)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Max Single-Asset Exposure Limit: {(maxWeight * 100).toFixed(0)}%</label>
                <input
                  type="range"
                  min="0.10"
                  max="0.50"
                  step="0.05"
                  value={maxWeight}
                  onChange={(e) => setMaxWeight(parseFloat(e.target.value))}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <button type="submit" className="auth-submit-btn" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Preferences'}
                </button>
                {user && (
                  <button
                    type="button"
                    onClick={() => setIsPreferences(false)}
                    style={{
                      background: 'transparent',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#8da4be',
                      borderRadius: '8px',
                      padding: '0 16px',
                      cursor: 'pointer',
                    }}
                  >
                    Back
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              {isRegister && (
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex Vance"
                  />
                </div>
              )}

              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                />
              </div>

              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              <button type="submit" className="auth-submit-btn" disabled={loading}>
                {loading
                  ? 'Processing...'
                  : isRegister
                  ? 'Create Account'
                  : 'Sign In'}
              </button>
            </>
          )}
        </form>

        {!isPreferences && (
          <div className="auth-modal-footer">
            {isRegister ? (
              <p>
                Already have an account?{' '}
                <button type="button" onClick={() => setIsRegister(false)}>
                  Sign In
                </button>
              </p>
            ) : (
              <p>
                Don't have an account?{' '}
                <button type="button" onClick={() => setIsRegister(true)}>
                  Create one now
                </button>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
