import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, Mail, RefreshCw, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { verifyOTP, resendOTP } from '../lib/auth';

interface OTPVerificationPageProps {
  email: string;
  requestId: string;
  onVerified: (token: string) => void;
  onBack: () => void;
}

export function OTPVerificationPage({ email, requestId, onVerified, onBack }: OTPVerificationPageProps) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  function handleOtpChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return; // Only allow numbers
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  async function handleVerify() {
    const otpCode = otp.join('');
    
    if (otpCode.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const result = await verifyOTP(email, otpCode, requestId);
      
      if (!result.success) {
        setError(result.message);
        return;
      }

      if (result.token) {
        onVerified(result.token);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setError('');
    setResendLoading(true);

    try {
      const result = await resendOTP(email, requestId);
      
      if (result.success) {
        setCountdown(60);
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend OTP');
    } finally {
      setResendLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-[2rem] border border-white/10 bg-slate-950/50 p-6 shadow-[0_30px_120px_rgba(2,6,23,0.35)] backdrop-blur-xl"
      >
        <button
          onClick={onBack}
          className="mb-4 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <div className="mb-6 text-center">
          <div className="mb-4 inline-flex items-center justify-center rounded-full bg-cyan-400/10 p-3">
            <Mail size={24} className="text-cyan-300" />
          </div>
          <p className="text-sm uppercase tracking-[0.28em] text-slate-400">Verify your email</p>
          <h1 className="mt-2 text-2xl font-semibold text-white">Enter verification code</h1>
          <p className="mt-2 text-sm text-slate-400">
            We sent a 6-digit code to <span className="font-semibold text-white">{email}</span>
          </p>
        </div>

        <div className="mb-6">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
            Verification Code
          </label>
          <div className="flex justify-center gap-2">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="h-14 w-12 rounded-[0.8rem] border border-white/10 bg-white/10 text-center text-xl font-semibold text-white transition focus:border-cyan-400 focus:bg-white/20 focus:outline-none"
              />
            ))}
          </div>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 rounded-[0.8rem] border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-300"
          >
            {error}
          </motion.div>
        )}

        <button
          onClick={handleVerify}
          disabled={loading || otp.some((digit) => !digit)}
          className="mb-4 w-full rounded-[1rem] bg-gradient-to-r from-cyan-400 to-sky-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:opacity-90 disabled:opacity-50"
        >
          {loading ? 'Verifying...' : 'Verify Email'}
        </button>

        <div className="space-y-3 border-t border-white/10 pt-4">
          <div className="text-center text-sm text-slate-400">
            Didn't receive the code?
          </div>
          <button
            onClick={handleResend}
            disabled={resendLoading || countdown > 0}
            className="flex w-full items-center justify-center gap-2 rounded-[1rem] border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/10 disabled:opacity-50"
          >
            {countdown > 0 ? (
              <>
                <Clock size={14} />
                Resend in {countdown}s
              </>
            ) : (
              <>
                <RefreshCw size={14} />
                {resendLoading ? 'Sending...' : 'Resend Code'}
              </>
            )}
          </button>
        </div>

        <div className="mt-4 rounded-[0.8rem] border border-white/10 bg-white/5 p-3">
          <div className="flex gap-2 text-xs text-slate-400">
            <Lock size={14} className="mt-0.5 flex-shrink-0" />
            <p>Your verification code is secure and encrypted. Never share it with anyone.</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
