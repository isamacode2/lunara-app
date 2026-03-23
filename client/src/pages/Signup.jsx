import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import MoonLogo from '../components/MoonLogo';
import './Auth.css';

const RELATIONSHIP_STYLES = [
  'Polyamorous',
  'Open Relationship',
  'Relationship Anarchy',
  'Swinging',
  'Mono-Poly',
  'Exploring ENM',
  'Other',
];

export default function Signup() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [relationshipStyle, setRelationshipStyle] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await signUp(email, password, {
        display_name: displayName,
        relationship_style: relationshipStyle,
      });
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-container animate-in">
          <div className="auth-logo">
            <MoonLogo size={56} />
          </div>
          <h1 className="auth-title">Check your email</h1>
          <p className="auth-subtitle">
            We sent a confirmation link to <strong>{email}</strong>.
            Click it to activate your account, then come back and sign in.
          </p>
          <Link to="/login" className="btn btn-primary btn-lg auth-btn" style={{ marginTop: 24 }}>
            Back to Sign In
          </Link>
        </div>
        <div className="auth-bg-glow" />
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-container animate-in">
        <div className="auth-logo">
          <MoonLogo size={56} />
        </div>
        <h1 className="auth-title">Join Lunara</h1>
        <p className="auth-subtitle">Find your constellation</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="displayName">Display Name</label>
            <input
              id="displayName"
              type="text"
              placeholder="What should we call you?"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              required
              autoComplete="name"
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="At least 6 characters"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>
          <div className="form-group">
            <label htmlFor="style">Relationship Style</label>
            <select
              id="style"
              value={relationshipStyle}
              onChange={e => setRelationshipStyle(e.target.value)}
              required
            >
              <option value="" disabled>Choose your style</option>
              {RELATIONSHIP_STYLES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {error && <p className="error-msg">{error}</p>}

          <button type="submit" className="btn btn-primary btn-lg auth-btn" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>

      <div className="auth-bg-glow" />
    </div>
  );
}
