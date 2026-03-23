import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Check, ChevronLeft, Loader } from 'lucide-react';

const pageStyle = {
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  background: 'linear-gradient(135deg, rgba(59,32,112,0.1) 0%, rgba(180,124,255,0.05) 100%)',
  overflow: 'hidden',
};

const scrollContainerStyle = {
  flex: 1,
  overflowY: 'auto',
  paddingBottom: '40px',
};

const headerStyle = {
  padding: '20px 20px 12px',
  borderBottom: '1px solid var(--border)',
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
};

const headerButtonStyle = {
  background: 'none',
  border: 'none',
  color: 'var(--accent)',
  cursor: 'pointer',
  padding: '8px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'opacity 0.2s',
};

const contentStyle = {
  padding: '40px 20px',
  maxWidth: '600px',
  margin: '0 auto',
  display: 'flex',
  flexDirection: 'column',
  gap: '32px',
};

const titleStyle = {
  fontSize: '32px',
  fontFamily: "'Playfair Display', serif",
  fontWeight: '700',
  background: 'linear-gradient(135deg, #b47cff 0%, #ffbe55 100%)',
  backgroundClip: 'text',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  margin: '0 0 8px',
};

const instructionStyle = {
  fontSize: '15px',
  color: 'var(--text2)',
  lineHeight: '1.6',
  margin: '0',
};

const cardStyle = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-lg)',
  padding: '24px',
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
};

const codeContainerStyle = {
  background: 'linear-gradient(135deg, var(--accent-dim) 0%, rgba(180,124,255,0.1) 100%)',
  border: '2px dashed var(--accent)',
  borderRadius: 'var(--radius-lg)',
  padding: '32px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const codeStyle = {
  fontSize: '48px',
  fontWeight: '700',
  fontFamily: "'Courier New', monospace",
  color: 'var(--accent)',
  letterSpacing: '8px',
  textAlign: 'center',
};

const fileUploadContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
};

const fileUploadLabelStyle = {
  fontSize: '13px',
  fontWeight: '600',
  color: 'var(--text2)',
  paddingLeft: '2px',
};

const fileInputStyle = {
  padding: '0',
  appearance: 'none',
  background: 'none',
  border: 'none',
};

const fileInputWrapperStyle = {
  position: 'relative',
  width: '100%',
};

const fileInputButtonStyle = {
  width: '100%',
  padding: '16px',
  borderRadius: 'var(--radius-lg)',
  border: '2px dashed var(--border)',
  background: 'var(--bg-elevated)',
  color: 'var(--text2)',
  cursor: 'pointer',
  transition: 'all 0.2s',
  fontSize: '15px',
  fontWeight: '500',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
};

const previewContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
};

const previewLabelStyle = {
  fontSize: '13px',
  fontWeight: '600',
  color: 'var(--text2)',
  paddingLeft: '2px',
};

const previewImageStyle = {
  width: '100%',
  maxHeight: '300px',
  borderRadius: 'var(--radius-lg)',
  objectFit: 'contain',
  border: '1px solid var(--border)',
};

const buttonGroupStyle = {
  display: 'flex',
  gap: '12px',
  marginTop: '12px',
};

const buttonStyle = {
  flex: 1,
  padding: '14px 28px',
  borderRadius: 'var(--radius-lg)',
  fontSize: '15px',
  fontWeight: '600',
  border: 'none',
  cursor: 'pointer',
  transition: 'all 0.2s',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
};

const submitButtonStyle = {
  ...buttonStyle,
  background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
  color: '#fff',
};

const cancelButtonStyle = {
  ...buttonStyle,
  background: 'transparent',
  color: 'var(--text2)',
  border: '1.5px solid rgba(180,124,255,0.3)',
};

const successContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '16px',
  textAlign: 'center',
  padding: '40px 20px',
};

const successIconStyle = {
  width: '80px',
  height: '80px',
  borderRadius: '50%',
  background: 'rgba(126, 196, 146, 0.15)',
  border: '2px solid var(--success)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const successTitleStyle = {
  fontSize: '24px',
  fontFamily: "'Playfair Display', serif",
  fontWeight: '700',
  color: 'var(--text)',
  margin: '0',
};

const successMessageStyle = {
  fontSize: '15px',
  color: 'var(--text2)',
  margin: '0',
  lineHeight: '1.6',
};

const errorStyle = {
  padding: '12px 16px',
  background: 'var(--danger-dim)',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--danger)',
  fontSize: '14px',
  border: '1px solid var(--danger)',
};

export default function Verification() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [verificationCode, setVerificationCode] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Generate random 4-digit code
    const code = String(Math.floor(1000 + Math.random() * 9000));
    setVerificationCode(code);
  }, []);

  function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setSelectedFile(file);

    // Generate preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreviewUrl(event.target?.result);
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit() {
    if (!selectedFile) {
      setError('Please select a photo');
      return;
    }

    if (!user?.id) {
      setError('Not authenticated');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Upload selfie to storage
      const fileName = `selfie_${Date.now()}.jpg`;
      const path = `verification/${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, selectedFile, { upsert: true, contentType: selectedFile.type });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);

      // Insert verification request
      const { error: insertError } = await supabase.from('verification_requests').insert({
        user_id: user.id,
        selfie_url: publicUrl,
        code: verificationCode,
        status: 'pending',
      });

      if (insertError) throw insertError;

      setSubmitted(true);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to submit verification');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <button style={headerButtonStyle} onClick={() => navigate('/profile')}>
          <ChevronLeft size={24} />
        </button>
        <h1 style={{ fontSize: '20px', margin: 0, fontFamily: "'Playfair Display', serif", fontWeight: '700' }}>Verification</h1>
      </div>

      <div style={scrollContainerStyle}>
        {submitted ? (
          <div style={successContainerStyle}>
            <div style={successIconStyle}>
              <Check size={40} color="var(--success)" strokeWidth={3} />
            </div>
            <h2 style={successTitleStyle}>Verification Submitted!</h2>
            <p style={successMessageStyle}>
              We'll review your identity within 24 hours. You'll receive a notification once verified.
            </p>
            <button
              style={{
                ...submitButtonStyle,
                marginTop: '24px',
                width: '100%',
              }}
              onClick={() => navigate('/profile')}
            >
              Back to Profile
            </button>
          </div>
        ) : (
          <div style={contentStyle}>
            <div>
              <h1 style={titleStyle}>Identity Verification</h1>
              <p style={instructionStyle}>
                Take a selfie holding a piece of paper with this code. Make sure your face is clearly visible.
              </p>
            </div>

            <div style={cardStyle}>
              <div>
                <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text2)', margin: '0 0 12px' }}>YOUR VERIFICATION CODE</p>
                <div style={codeContainerStyle}>
                  <div style={codeStyle}>{verificationCode}</div>
                </div>
              </div>

              {error && <div style={errorStyle}>{error}</div>}

              <div style={fileUploadContainerStyle}>
                <label style={fileUploadLabelStyle}>Take a Selfie</label>
                <label style={fileInputWrapperStyle}>
                  <div style={fileInputButtonStyle}>
                    📸 Choose Photo
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>

              {previewUrl && (
                <div style={previewContainerStyle}>
                  <label style={previewLabelStyle}>Preview</label>
                  <img src={previewUrl} alt="Selfie preview" style={previewImageStyle} />
                </div>
              )}

              <div style={buttonGroupStyle}>
                <button
                  style={submitButtonStyle}
                  onClick={handleSubmit}
                  disabled={loading || !selectedFile}
                >
                  {loading ? (
                    <>
                      <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Check size={16} /> Submit Verification
                    </>
                  )}
                </button>
              </div>

              <button
                style={{
                  ...cancelButtonStyle,
                  width: '100%',
                }}
                onClick={() => navigate('/profile')}
                disabled={loading}
              >
                Cancel
              </button>
            </div>

            <div style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent)', borderRadius: 'var(--radius-lg)', padding: '16px' }}>
              <p style={{ fontSize: '13px', color: 'var(--accent)', margin: '0', lineHeight: '1.6' }}>
                💡 <strong>Tip:</strong> Hold your ID or a piece of paper with the code clearly visible. Good lighting helps us verify your identity faster.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
