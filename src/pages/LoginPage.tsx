import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Eye, EyeOff, Lock, Mail, User, Sparkles, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { loginUser, loginWithGoogle, registerUser, loginWithOTP, registerWithOTP } from '../lib/auth';
import { OTPVerificationPage } from './OTPVerificationPage';

export function LoginPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [authMode, setAuthMode] = useState<'password' | 'otp'>('password'); // New: toggle between password and OTP
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [otpRequestId, setOtpRequestId] = useState('');
  const [showOtpVerification, setShowOtpVerification] = useState(false);

  function getPasswordStrength(value: string) {
    if (!value) return { label: 'Enter a password', color: 'text-slate-400' };
    if (value.length < 8) return { label: 'Too short', color: 'text-amber-400' };
    if (value.length >= 12 && /[A-Z]/.test(value) && /[0-9]/.test(value)) return { label: 'Strong', color: 'text-emerald-400' };
    return { label: 'Good', color: 'text-cyan-400' };
  }

  // ============ PASSWORD-BASED AUTH ============
  async function handlePasswordSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await loginUser(email, password);
      } else {
        if (password.length < 8) {
          throw new Error('Use at least 8 characters for your password.');
        }
        await registerUser(name, email, password);
      }
      window.location.href = '/';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  }

  // ============ OTP-BASED AUTH ============
  async function handleOTPRequest(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      let result;
      
      if (mode === 'login') {
        result = await loginWithOTP(email);
      } else {
        if (!name.trim()) {
          throw new Error('Please enter your name.');
        }
        result = await registerWithOTP(name, email);
      }

      if (!result.success) {
        throw new Error(result.message);
      }

      if (result.requestId) {
        setOtpRequestId(result.requestId);
        setShowOtpVerification(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  }

  function handleOTPVerified(token: string) {
    localStorage.setItem('aurora-token', token);
    window.location.href = '/';
  }

  async function handleGoogleSignIn() {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
      window.location.href = '/';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed.');
    } finally {
      setLoading(false);
    }
  }

  // Show OTP verification page
  if (showOtpVerification) {
    return (
      <OTPVerificationPage
        email={email}
        requestId={otpRequestId}
        onVerified={handleOTPVerified}
        onBack={() => {
          setShowOtpVerification(false);
          setOtpRequestId('');
          setError('');
        }}
      />
    );
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-[2rem] border border-white/10 bg-slate-950/50 p-6 shadow-[0_30px_120px_rgba(2,6,23,0.35)] backdrop-blur-xl"
      >
        <Link to="/" className="mb-4 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white">
          <ArrowLeft size={16} />
          Back to weather
        </Link>
        <div className="mb-6 text-center">
          <p className="text-sm uppercase tracking-[0.28em] text-slate-400">Secure access</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Skypulse weather</h1>
          <p className="mt-2 text-sm text-slate-400">Sign in to save your searches, history, and weather preferences.</p>
        </div>

        {/* Auth Mode Tabs - Login/Register */}
        <div className="mb-4 flex rounded-full border border-white/10 bg-white/10 p-1">
          <button
            onClick={() => setMode('login')}
            className={`flex-1 rounded-full px-3 py-2 text-sm transition ${mode === 'login' ? 'bg-cyan-400/20 text-cyan-200' : 'text-slate-300'}`}
          >
            Login
          </button>
          <button
            onClick={() => setMode('register')}
            className={`flex-1 rounded-full px-3 py-2 text-sm transition ${mode === 'register' ? 'bg-cyan-400/20 text-cyan-200' : 'text-slate-300'}`}
          >
            Register
          </button>
        </div>

        {/* Authentication Method Tabs - Password/OTP */}
        <div className="mb-4 flex gap-2 rounded-lg border border-white/10 bg-white/5 p-1">
          <button
            onClick={() => setAuthMode('password')}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition ${
              authMode === 'password' ? 'bg-cyan-400/20 text-cyan-200' : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            <Lock size={12} />
            Password
          </button>
          <button
            onClick={() => setAuthMode('otp')}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition ${
              authMode === 'otp' ? 'bg-emerald-400/20 text-emerald-200' : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            <ShieldCheck size={12} />
            OTP
          </button>
        </div>

        {/* PASSWORD-BASED AUTH FORM */}
        {authMode === 'password' && (
          <form onSubmit={handlePasswordSubmit} className="space-y-3">
            {mode === 'register' ? (
              <label className="flex items-center gap-3 rounded-[1rem] border border-white/10 bg-white/10 px-3 py-3 text-sm text-slate-300">
                <User size={16} className="text-cyan-300" />
                <input
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Your name"
                  className="w-full bg-transparent outline-none"
                />
              </label>
            ) : null}

            <label className="flex items-center gap-3 rounded-[1rem] border border-white/10 bg-white/10 px-3 py-3 text-sm text-slate-300">
              <Mail size={16} className="text-cyan-300" />
              <input
                required
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Email address"
                className="w-full bg-transparent outline-none"
              />
            </label>

            <label className="flex items-center gap-3 rounded-[1rem] border border-white/10 bg-white/10 px-3 py-3 text-sm text-slate-300">
              <Lock size={16} className="text-cyan-300" />
              <input
                required
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Password"
                className="w-full bg-transparent outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="text-slate-400 transition hover:text-white"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </label>

            {mode === 'register' ? (
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className={`font-medium ${getPasswordStrength(password).color}`}>
                  {getPasswordStrength(password).label}
                </span>
                <span>Use 8+ characters with a mix of numbers and symbols.</span>
              </div>
            ) : null}

            {error ? <p className="text-sm text-rose-300">{error}</p> : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-[1rem] bg-gradient-to-r from-cyan-400 to-sky-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:opacity-90 disabled:opacity-50"
            >
              {loading ? 'Working...' : mode === 'login' ? 'Login' : 'Create account'}
            </button>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-[1rem] border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/20 disabled:opacity-50"
            >
              <Sparkles size={16} className="text-cyan-300" />
              Continue with Google
            </button>
          </form>
        )}

        {/* OTP-BASED AUTH FORM */}
        {authMode === 'otp' && (
          <form onSubmit={handleOTPRequest} className="space-y-3">
            {mode === 'register' ? (
              <label className="flex items-center gap-3 rounded-[1rem] border border-white/10 bg-white/10 px-3 py-3 text-sm text-slate-300">
                <User size={16} className="text-cyan-300" />
                <input
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Your name"
                  className="w-full bg-transparent outline-none"
                />
              </label>
            ) : null}

            <label className="flex items-center gap-3 rounded-[1rem] border border-white/10 bg-white/10 px-3 py-3 text-sm text-slate-300">
              <Mail size={16} className="text-cyan-300" />
              <input
                required
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Email address"
                className="w-full bg-transparent outline-none"
              />
            </label>

            <div className="rounded-[0.8rem] border border-emerald-400/20 bg-emerald-400/10 p-3">
              <div className="flex gap-2 text-xs text-emerald-300">
                <ShieldCheck size={14} className="mt-0.5 flex-shrink-0" />
                <p>We'll send a verification code to your email. No password needed.</p>
              </div>
            </div>

            {error ? <p className="text-sm text-rose-300">{error}</p> : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-[1rem] bg-gradient-to-r from-emerald-400 to-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:opacity-90 disabled:opacity-50"
            >
              {loading ? 'Sending OTP...' : 'Send verification code'}
            </button>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-[1rem] border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/20 disabled:opacity-50"
            >
              <Sparkles size={16} className="text-cyan-300" />
              Continue with Google
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}

