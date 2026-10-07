import { useState } from 'react';
import { login, register, updatePreferences } from '../../api';
import './AuthModal.css';

export default function AuthModal({ isOpen, onClose, user, onAuthSuccess }) {
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
            </>
          )}

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading
              ? 'Processing...'
              : isPreferences
              ? 'Save Preferences'
              : isRegister
              ? 'Create Account'
              : 'Sign In'}
          </button>
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
