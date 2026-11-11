import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { ArrowRight, AlertCircle, Eye, EyeOff, Loader2, User, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AdminLoginPage: React.FC = () => {
  const { isAdmin, login, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const from = (location.state as { from?: string } | null)?.from || '/admin';

  useEffect(() => {
    if (isAdmin) navigate(from, { replace: true });
  }, [from, isAdmin, navigate]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const email = username.trim().toLowerCase() === 'admin' ? 'admin@qadamshoes.com' : username.trim();
      const signedIn = await login(email, password);
      if (signedIn.role !== 'admin') {
        logout();
        setError('This account does not have admin access.');
        return;
      }
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Wrong username or password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputWrap =
    'flex items-center gap-3 rounded-xl bg-white px-4 ring-1 ring-[#E6D5C3] transition-all focus-within:ring-2 focus-within:ring-[#9A6440]';

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#FBF5EE] via-[#F6E7D8] to-[#EED9C4] px-4 py-12">
      {/* Soft background shapes */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-white/60 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-24 h-[28rem] w-[28rem] rounded-full bg-[#D9B48F]/30 blur-3xl" />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center text-center">
          <img src="/logo.png" alt="QADAM Men's Footwear" className="h-20 w-auto object-contain" />
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-[#2E1D12]">Welcome back</h1>
          <p className="mt-1 text-sm text-[#8A6A52]">Sign in to QADAM Admin</p>
        </div>

        {/* Card */}
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-3xl bg-white/80 p-6 shadow-[0_30px_60px_-30px_rgba(122,78,48,0.35)] ring-1 ring-white backdrop-blur-xl sm:p-8"
        >
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-[#6B4C36]">Username or email</span>
            <div className={inputWrap}>
              <User className="h-4 w-4 shrink-0 text-[#B09078]" />
              <input
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoComplete="username"
                autoFocus
                required
                placeholder="admin"
                className="h-12 w-full bg-transparent text-sm text-[#2E1D12] outline-none placeholder:text-[#C9B3A0]"
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-[#6B4C36]">Password</span>
            <div className={inputWrap}>
              <Lock className="h-4 w-4 shrink-0 text-[#B09078]" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                placeholder="••••••••"
                className="h-12 w-full bg-transparent text-sm text-[#2E1D12] outline-none placeholder:text-[#C9B3A0]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(s => !s)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="shrink-0 text-[#B09078] hover:text-[#6B4C36] cursor-pointer"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </label>

          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700 ring-1 ring-red-100">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#9A6440] to-[#6E4428] text-sm font-semibold text-white shadow-lg shadow-[#7A4E30]/25 transition-all hover:shadow-xl hover:brightness-110 disabled:opacity-60 cursor-pointer"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Sign In
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-[#9C7B62]">
          <Link to="/" className="hover:text-[#6B4C36] hover:underline">← Back to store</Link>
        </p>
      </div>
    </main>
  );
};
