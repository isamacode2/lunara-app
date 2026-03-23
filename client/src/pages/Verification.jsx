import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Check, ChevronLeft, Loader, Camera, Shield, ArrowRight, ArrowLeft } from 'lucide-react';

const PURPLE_BG = '#1A0A3C';
const GOLD = '#C4A44A';
const GOLD_DIM = 'rgba(196, 164, 74, 0.15)';
const GOLD_BORDER = 'rgba(196, 164, 74, 0.3)';

const STEPS = ['intro', 'code', 'selfie', 'submitted'];

export default function Verification() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [verificationCode, setVerificationCode] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [existingStatus, setExistingStatus] = useState(null); // 'pending' | 'approved' | 'rejected' | null
  const [error, setError] = useState(null);
  const [consent, setConsent] = useState(false);

  // Check for existing verification request on load
  useEffect(() => {
    async function checkExisting() {
      if (!user?.id) { setCheckingStatus(false); return; }
      // If already verified via profile, skip
      if (profile?.is_verified) { setExistingStatus('approved'); setCheckingStatus(false); return; }
      try {
        const { data } = await supabase
          .from('verification_requests')
          .select('status')
          .eq('user_id', user.id)
          .single();
        if (data?.status) setExistingStatus(data.status);
      } catch {}
      setCheckingStatus(false);
    }
    checkExisting();
  }, [user?.id, profile?.is_verified]);

  useEffect(() => {
    const code = String(Math.floor(1000 + Math.random() * 9000));
    setVerificationCode(code);
  }, []);

  function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Only JPEG, PNG, and WebP images are allowed');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File too large. Maximum size is 5MB');
      return;
    }
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (event) => setPreviewUrl(event.target?.result);
    reader.readAsDataURL(file);
  }

  async function handleSubmit() {
    if (!selectedFile || !consent) return;
    if (!user?.id) { setError('Not authenticated'); return; }

    try {
      setLoading(true);
      setError(null);

      const fileName = `selfie_${Date.now()}.jpg`;
      const path = `verifications/${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, selectedFile, { upsert: true, contentType: selectedFile.type });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);

      const { error: insertError } = await supabase.from('verification_requests').upsert({
        user_id: user.id,
        selfie_url: publicUrl,
        code: verificationCode,
        status: 'pending',
      }, { onConflict: 'user_id' });
      if (insertError) throw insertError;

      setStep(3); // submitted
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to submit verification');
    } finally {
      setLoading(false);
    }
  }

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: PURPLE_BG,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}>
        <button
          style={{ background: 'none', border: 'none', color: GOLD, cursor: 'pointer', padding: '8px', display: 'flex' }}
          onClick={() => step > 0 && step < 3 ? setStep(step - 1) : navigate('/profile')}
        >
          <ChevronLeft size={24} />
        </button>
        <h1 style={{ fontSize: '20px', margin: 0, fontWeight: '700', color: '#fff' }}>Verification</h1>
      </div>

      {/* Progress Bar */}
      <div style={{ padding: '0 20px 16px' }}>
        <div style={{
          height: '4px',
          borderRadius: '2px',
          background: 'rgba(255,255,255,0.1)',
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${progress}%`,
            background: `linear-gradient(90deg, ${GOLD}, #E8C060)`,
            borderRadius: '2px',
            transition: 'width 0.4s ease',
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{
              fontSize: '11px',
              color: i <= step ? GOLD : 'rgba(255,255,255,0.3)',
              fontWeight: i === step ? '700' : '400',
              textTransform: 'capitalize',
            }}>
              {s === 'selfie' ? 'Photo' : s}
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '40px' }}>
        <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>

          {/* Loading check */}
          {checkingStatus && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '60px 0' }}>
              <Loader size={32} style={{ animation: 'spin 1s linear infinite', color: GOLD }} />
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>Checking verification status...</p>
            </div>
          )}

          {/* Already verified */}
          {!checkingStatus && existingStatus === 'approved' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', textAlign: 'center', padding: '40px 0' }}>
              <div style={{ width: '96px', height: '96px', borderRadius: '50%', background: GOLD_DIM, border: `2px solid ${GOLD}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Check size={44} color={GOLD} strokeWidth={3} />
              </div>
              <h2 style={{ fontSize: '28px', fontWeight: '700', color: '#fff', fontFamily: "'Playfair Display', serif", margin: 0 }}>You're Verified!</h2>
              <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.6', margin: 0, maxWidth: '300px' }}>
                Your identity has been confirmed. You have a gold verification badge on your profile.
              </p>
              <button onClick={() => navigate('/profile')} style={{ padding: '16px 32px', background: `linear-gradient(135deg, ${GOLD}, #E8C060)`, color: '#000', border: 'none', borderRadius: '14px', fontSize: '16px', fontWeight: '700', cursor: 'pointer', width: '100%', maxWidth: '300px' }}>
                Back to Profile
              </button>
            </div>
          )}

          {/* Pending review */}
          {!checkingStatus && existingStatus === 'pending' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', textAlign: 'center', padding: '40px 0' }}>
              <div style={{ width: '96px', height: '96px', borderRadius: '50%', background: 'rgba(255,200,60,0.1)', border: '2px solid rgba(255,200,60,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Loader size={40} color={GOLD} style={{ animation: 'spin 3s linear infinite' }} />
              </div>
              <h2 style={{ fontSize: '28px', fontWeight: '700', color: '#fff', fontFamily: "'Playfair Display', serif", margin: 0 }}>Under Review</h2>
              <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.6', margin: 0, maxWidth: '320px' }}>
                Your verification is being reviewed. We'll notify you when it's approved — usually within 24 hours.
              </p>
              <div style={{ background: GOLD_DIM, border: `1px solid ${GOLD_BORDER}`, borderRadius: '12px', padding: '16px', width: '100%', maxWidth: '300px' }}>
                <p style={{ fontSize: '13px', color: GOLD, margin: 0 }}>
                  Verified profiles receive a gold badge and are shown more often in Discover.
                </p>
              </div>
              <button onClick={() => navigate('/profile')} style={{ padding: '16px 32px', background: `linear-gradient(135deg, ${GOLD}, #E8C060)`, color: '#000', border: 'none', borderRadius: '14px', fontSize: '16px', fontWeight: '700', cursor: 'pointer', width: '100%', maxWidth: '300px' }}>
                Back to Profile
              </button>
            </div>
          )}

          {/* Step 0: Intro */}
          {!checkingStatus && (existingStatus === null || existingStatus === 'rejected') && step === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{
                width: '80px', height: '80px', borderRadius: '50%',
                background: GOLD_DIM, border: `2px solid ${GOLD}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '20px auto 0',
              }}>
                <Shield size={36} color={GOLD} />
              </div>

              <div style={{ textAlign: 'center' }}>
                <h2 style={{
                  fontSize: '28px', fontWeight: '700', color: '#fff',
                  fontFamily: "'Playfair Display', serif", margin: '0 0 12px',
                }}>
                  Verify Your Identity
                </h2>
                <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.6', margin: 0 }}>
                  Verification helps keep our community safe and builds trust with potential connections.
                </p>
              </div>

              <div style={{
                background: 'rgba(255,255,255,0.05)',
                border: `1px solid ${GOLD_BORDER}`,
                borderRadius: '16px',
                padding: '24px',
                display: 'flex', flexDirection: 'column', gap: '20px',
              }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: GOLD, margin: 0 }}>
                  What you'll need:
                </h3>
                {[
                  'A well-lit space for a selfie',
                  'A piece of paper to write a code on',
                  'About 2 minutes of your time',
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '50%',
                      background: GOLD_DIM, border: `1px solid ${GOLD_BORDER}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: GOLD }}>{i + 1}</span>
                    </div>
                    <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>{item}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setStep(1)}
                style={{
                  padding: '16px',
                  background: `linear-gradient(135deg, ${GOLD}, #E8C060)`,
                  color: '#000',
                  border: 'none',
                  borderRadius: '14px',
                  fontSize: '16px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                }}
              >
                Begin Verification <ArrowRight size={18} />
              </button>
            </div>
          )}

          {/* Step 1: Code */}
          {!checkingStatus && (existingStatus === null || existingStatus === 'rejected') && step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ textAlign: 'center' }}>
                <h2 style={{
                  fontSize: '24px', fontWeight: '700', color: '#fff',
                  fontFamily: "'Playfair Display', serif", margin: '0 0 12px',
                }}>
                  Write This Code
                </h2>
                <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.6', margin: 0 }}>
                  Write this code clearly on a piece of paper. You'll hold it in your selfie.
                </p>
              </div>

              <div style={{
                background: GOLD_DIM,
                border: `2px dashed ${GOLD}`,
                borderRadius: '16px',
                padding: '40px 20px',
                textAlign: 'center',
              }}>
                <div style={{
                  fontSize: '56px', fontWeight: '700',
                  fontFamily: "'Courier New', monospace",
                  color: GOLD,
                  letterSpacing: '12px',
                }}>
                  {verificationCode}
                </div>
              </div>

              <div style={{
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '12px',
                padding: '16px',
              }}>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', margin: 0, lineHeight: '1.6' }}>
                  Make sure the code is clearly readable in your photo. This helps us confirm you are a real person.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => setStep(0)}
                  style={{
                    flex: 1, padding: '14px',
                    background: 'transparent',
                    color: 'rgba(255,255,255,0.6)',
                    border: `1.5px solid ${GOLD_BORDER}`,
                    borderRadius: '14px',
                    fontSize: '15px', fontWeight: '600', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  }}
                >
                  <ArrowLeft size={16} /> Back
                </button>
                <button
                  onClick={() => setStep(2)}
                  style={{
                    flex: 2, padding: '14px',
                    background: `linear-gradient(135deg, ${GOLD}, #E8C060)`,
                    color: '#000',
                    border: 'none',
                    borderRadius: '14px',
                    fontSize: '15px', fontWeight: '700', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  }}
                >
                  I've Written It <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Selfie / Review */}
          {!checkingStatus && (existingStatus === null || existingStatus === 'rejected') && step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ textAlign: 'center' }}>
                <h2 style={{
                  fontSize: '24px', fontWeight: '700', color: '#fff',
                  fontFamily: "'Playfair Display', serif", margin: '0 0 12px',
                }}>
                  Take Your Selfie
                </h2>
                <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.6', margin: 0 }}>
                  Hold the paper with code <strong style={{ color: GOLD }}>{verificationCode}</strong> clearly visible next to your face.
                </p>
              </div>

              {error && (
                <div style={{
                  padding: '12px 16px',
                  background: 'rgba(240,120,96,0.15)',
                  borderRadius: '10px',
                  color: '#f07860',
                  fontSize: '14px',
                  border: '1px solid rgba(240,120,96,0.3)',
                }}>
                  {error}
                </div>
              )}

              {!previewUrl ? (
                <label style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px',
                  padding: '48px 20px',
                  border: `2px dashed ${GOLD_BORDER}`,
                  borderRadius: '16px',
                  background: 'rgba(255,255,255,0.03)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}>
                  <div style={{
                    width: '64px', height: '64px', borderRadius: '50%',
                    background: GOLD_DIM,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Camera size={28} color={GOLD} />
                  </div>
                  <span style={{ fontSize: '15px', fontWeight: '600', color: GOLD }}>
                    Tap to take or choose a photo
                  </span>
                  <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
                    JPG, PNG up to 10MB
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="user"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                  />
                </label>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{
                    borderRadius: '16px', overflow: 'hidden',
                    border: `2px solid ${GOLD_BORDER}`,
                  }}>
                    <img src={previewUrl} alt="Selfie preview" style={{
                      width: '100%', maxHeight: '300px',
                      objectFit: 'contain', display: 'block',
                      background: 'rgba(0,0,0,0.3)',
                    }} />
                  </div>
                  <label style={{
                    textAlign: 'center', fontSize: '14px', color: GOLD,
                    cursor: 'pointer', fontWeight: '600',
                  }}>
                    Retake photo
                    <input
                      type="file"
                      accept="image/*"
                      capture="user"
                      onChange={handleFileSelect}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
              )}

              {/* Checklist */}
              <div style={{
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '12px', padding: '16px',
                display: 'flex', flexDirection: 'column', gap: '12px',
              }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>
                  Before submitting, check:
                </span>
                {[
                  'Your face is clearly visible',
                  'The verification code is readable',
                  'The photo is well-lit',
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '20px', height: '20px', borderRadius: '50%',
                      background: GOLD_DIM, border: `1px solid ${GOLD_BORDER}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Check size={12} color={GOLD} />
                    </div>
                    <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>{item}</span>
                  </div>
                ))}
              </div>

              {/* Consent Toggle */}
              <div
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: '12px',
                  padding: '16px',
                  background: consent ? GOLD_DIM : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${consent ? GOLD_BORDER : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onClick={() => setConsent(!consent)}
              >
                <div style={{
                  width: '44px', height: '24px', borderRadius: '12px',
                  background: consent ? GOLD : 'rgba(255,255,255,0.15)',
                  position: 'relative', flexShrink: 0,
                  transition: 'background 0.2s',
                }}>
                  <div style={{
                    width: '20px', height: '20px', borderRadius: '50%',
                    background: '#fff',
                    position: 'absolute', top: '2px',
                    left: consent ? '22px' : '2px',
                    transition: 'left 0.2s',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                  }} />
                </div>
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.5' }}>
                  I consent to Lunara securely storing my verification photo for identity confirmation purposes.
                </span>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => setStep(1)}
                  style={{
                    flex: 1, padding: '14px',
                    background: 'transparent',
                    color: 'rgba(255,255,255,0.6)',
                    border: `1.5px solid ${GOLD_BORDER}`,
                    borderRadius: '14px',
                    fontSize: '15px', fontWeight: '600', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  }}
                >
                  <ArrowLeft size={16} /> Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading || !selectedFile || !consent}
                  style={{
                    flex: 2, padding: '14px',
                    background: (!selectedFile || !consent) ? 'rgba(196,164,74,0.3)' : `linear-gradient(135deg, ${GOLD}, #E8C060)`,
                    color: (!selectedFile || !consent) ? 'rgba(255,255,255,0.4)' : '#000',
                    border: 'none',
                    borderRadius: '14px',
                    fontSize: '15px', fontWeight: '700',
                    cursor: (!selectedFile || !consent) ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    opacity: loading ? 0.7 : 1,
                  }}
                >
                  {loading ? (
                    <>
                      <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Shield size={16} /> Submit Verification
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Submitted */}
          {step === 3 && (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: '20px', textAlign: 'center', padding: '40px 0',
            }}>
              <div style={{
                width: '96px', height: '96px', borderRadius: '50%',
                background: 'rgba(126, 196, 146, 0.15)',
                border: '2px solid #7ec492',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Check size={44} color="#7ec492" strokeWidth={3} />
              </div>

              <h2 style={{
                fontSize: '28px', fontWeight: '700', color: '#fff',
                fontFamily: "'Playfair Display', serif", margin: 0,
              }}>
                Verification Submitted!
              </h2>

              <p style={{
                fontSize: '15px', color: 'rgba(255,255,255,0.6)',
                lineHeight: '1.6', margin: 0, maxWidth: '300px',
              }}>
                We'll review your identity within 24 hours. You'll receive a notification once verified.
              </p>

              <div style={{
                background: GOLD_DIM,
                border: `1px solid ${GOLD_BORDER}`,
                borderRadius: '12px',
                padding: '16px', width: '100%', maxWidth: '300px',
              }}>
                <p style={{ fontSize: '13px', color: GOLD, margin: 0 }}>
                  Verified profiles receive a gold badge and are shown more often in Discover.
                </p>
              </div>

              <button
                onClick={() => navigate('/profile')}
                style={{
                  padding: '16px 32px',
                  background: `linear-gradient(135deg, ${GOLD}, #E8C060)`,
                  color: '#000',
                  border: 'none',
                  borderRadius: '14px',
                  fontSize: '16px', fontWeight: '700',
                  cursor: 'pointer',
                  marginTop: '12px',
                  width: '100%', maxWidth: '300px',
                }}
              >
                Back to Profile
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
