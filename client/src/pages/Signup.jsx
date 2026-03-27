import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import MoonLogo from '../components/MoonLogo';

const pageStyle = {
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '20px',
  background: 'var(--bg)',
  overflowY: 'auto',
};

const cardStyle = {
  width: '100%',
  maxWidth: '400px',
  display: 'flex',
  flexDirection: 'column',
  gap: '24px',
  margin: 'auto',
};

const headerStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '12px',
  textAlign: 'center',
};

const logoStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const titleStyle = {
  fontSize: '32px',
  fontFamily: "'Outfit', sans-serif",
  fontWeight: '800',
  color: 'var(--ink)',
  letterSpacing: '-0.5px',
  margin: '0',
};

const subtitleStyle = {
  fontSize: '14px',
  color: 'var(--text2)',
  margin: '0',
};

const formStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
};

const relStylesContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
};

const relStylesGridStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '8px',
};

const pillStyle = (isSelected) => ({
  padding: '10px 12px',
  borderRadius: 'var(--radius-full)',
  border: '1.5px solid',
  borderColor: isSelected ? 'var(--accent)' : 'var(--border)',
  background: isSelected ? 'var(--accent-dim)' : 'transparent',
  color: isSelected ? 'var(--accent)' : 'var(--text2)',
  fontSize: '12px',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'all 0.2s',
  textAlign: 'center',
  whiteSpace: 'nowrap',
  '&:hover': {
    borderColor: 'var(--accent)',
  },
});

const linkStyle = {
  color: 'var(--accent)',
  textDecoration: 'none',
  transition: 'opacity 0.2s',
};

const confirmationStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '20px',
  textAlign: 'center',
};

const checkIconStyle = {
  width: '64px',
  height: '64px',
  borderRadius: '50%',
  background: 'var(--accent-dim)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '32px',
  color: 'var(--accent)',
};

const confirmationTextStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
};

const confirmationTitleStyle = {
  fontSize: '22px',
  fontFamily: "'Outfit', sans-serif",
  fontWeight: '700',
  color: 'var(--ink)',
  margin: '0',
};

const confirmationDescStyle = {
  fontSize: '14px',
  color: 'var(--text2)',
  lineHeight: '1.5',
  margin: '0',
};

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
  const [showConfirmation, setShowConfirmation] = useState(false);
  const { signUp } = useAuth();

  const passwordValid = password.length >= 6;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!passwordValid) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (!relationshipStyle) {
      setError('Please select your relationship style');
      return;
    }

    setLoading(true);

    try {
      await signUp(email, password, {
        display_name: displayName,
        relationship_style: relationshipStyle,
      });
      setShowConfirmation(true);
    } catch (err) {
      setError(err.message || 'Error creating account');
    } finally {
      setLoading(false);
    }
  };

  if (showConfirmation) {
    return (
      <div style={pageStyle}>
        <div style={cardStyle} className="anim-in">
          <div style={confirmationStyle}>
            <div style={checkIconStyle}>✓</div>
            <div style={confirmationTextStyle}>
              <h2 style={confirmationTitleStyle}>Check your email</h2>
              <p style={confirmationDescStyle}>
                We've sent a confirmation link to <strong>{email}</strong>. Click it to verify your account.
              </p>
            </div>
            <Link
              to="/login"
              className="btn btn-primary btn-lg btn-full"
              style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              Back to login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <div style={cardStyle} className="anim-in">
        <div style={headerStyle}>
          <div style={logoStyle}>
            <MoonLogo size={56} />
          </div>
          <h1 style={titleStyle}>Lunara</h1>
          <p style={subtitleStyle}>Grow into your relationships</p>
        </div>

        <form onSubmit={handleSubmit} style={formStyle}>
          <div className="form-group">
            <label className="form-label">Display Name</label>
            <input
              type="text"
              placeholder="Your name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
            {password && !passwordValid && (
              <span className="msg-error">Minimum 6 characters</span>
            )}
          </div>

          <div style={relStylesContainerStyle}>
            <label className="form-label">Relationship Style</label>
            <div style={relStylesGridStyle}>
              {RELATIONSHIP_STYLES.map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => setRelationshipStyle(style)}
                  disabled={loading}
                  style={{
                    ...pillStyle(relationshipStyle === style),
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.5 : 1,
                  }}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          {error && <div className="msg-error">{error}</div>}

          <button
            type="submit"
            className="btn btn-primary btn-lg btn-full"
            disabled={loading || !passwordValid || !relationshipStyle}
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <div style={{ textAlign: 'center', fontSize: '14px' }}>
          Already have an account?{' '}
          <Link to="/login" style={linkStyle}>
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
