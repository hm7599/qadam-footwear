import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { MyAlerts } from '../components/shop/MyAlerts';
import { Link, useNavigate } from 'react-router-dom';
import { User, Package, Heart, Shield, LogOut, CheckCircle2, Lock, Mail, Phone, MapPin, ArrowRight } from 'lucide-react';

export const AccountPage: React.FC = () => {
  const { user, login, register, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [isLoginTab, setIsLoginTab] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmitAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLoginTab) {
        await login(email, password);
      } else {
        await register({ name, email, password, phone });
      }
    } catch (err: any) {
      setError(err.message || 'Authentication error.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAdminLogin = async () => {
    navigate('/admin/login');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-white pt-36 pb-24 flex items-center justify-center px-4">
        <div className="w-full max-w-md border border-neutral-200 bg-white p-8 sm:p-10">
          <div className="text-center mb-8 border-b border-neutral-200 pb-6">
            <img src="/logo.png" alt="QADAM Men's Footwear" className="mx-auto h-16 w-auto object-contain" />
            <span className="font-tech text-[8.5px] uppercase tracking-[0.4em] text-neutral-400 mt-1 block">
              CLIENT CONCIERGE
            </span>
            <h1 className="mt-4 font-serif text-2xl font-normal tracking-tight text-neutral-950">
              {isLoginTab ? 'Sign In' : 'Create Account'}
            </h1>
            <p className="font-editorial text-sm italic text-neutral-500 mt-1">
              Sign in to see your orders, wishlist and special offers.
            </p>
          </div>

          {/* Tab Selector */}
          <div className="grid grid-cols-2 border border-neutral-200 p-1 mb-6 bg-neutral-50">
            <button
              onClick={() => setIsLoginTab(true)}
              className={`py-2.5 font-tech text-xs uppercase tracking-wider transition-all ${
                isLoginTab ? 'bg-black text-white font-bold shadow-xs' : 'text-neutral-600 hover:text-black'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsLoginTab(false)}
              className={`py-2.5 font-tech text-xs uppercase tracking-wider transition-all ${
                !isLoginTab ? 'bg-black text-white font-bold shadow-xs' : 'text-neutral-600 hover:text-black'
              }`}
            >
              Register
            </button>
          </div>

          {error && (
            <div className="mb-6 border border-red-300 bg-red-50/70 p-3 font-tech text-xs text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmitAuth} className="space-y-4">
            {!isLoginTab && (
              <div>
                <label className="block font-tech text-[10px] uppercase tracking-widest text-neutral-500 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="ALEX STERLING"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full border border-neutral-200 bg-neutral-50/40 px-4 py-3 font-tech text-xs text-black placeholder:text-neutral-400 focus:outline-none focus:border-black focus:bg-white"
                />
              </div>
            )}

            <div>
              <label className="block font-tech text-[10px] uppercase tracking-widest text-neutral-500 mb-1">
                Client Email
              </label>
              <input
                type="email"
                required
                placeholder="yourname@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full border border-neutral-200 bg-neutral-50/40 px-4 py-3 font-tech text-xs text-black placeholder:text-neutral-400 focus:outline-none focus:border-black focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-tech text-[10px] uppercase tracking-widest text-neutral-500 mb-1">
                Passphrase
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full border border-neutral-200 bg-neutral-50/40 px-4 py-3 font-tech text-xs text-black placeholder:text-neutral-400 focus:outline-none focus:border-black focus:bg-white"
              />
            </div>

            {!isLoginTab && (
              <div>
                <label className="block font-tech text-[10px] uppercase tracking-widest text-neutral-500 mb-1">
                  Direct Mobile (Optional)
                </label>
                <input
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full border border-neutral-200 bg-neutral-50/40 px-4 py-3 font-tech text-xs text-black placeholder:text-neutral-400 focus:outline-none focus:border-black focus:bg-white"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black py-4 font-tech text-xs font-bold uppercase tracking-widest text-white hover:bg-neutral-800 disabled:opacity-50 transition-all"
            >
              {loading ? 'Please wait…' : isLoginTab ? 'Sign In' : 'Register New Account'}
            </button>
          </form>

          {/* Quick Demo Logins Helper */}
          <div className="mt-8 pt-6 border-t border-neutral-200 text-center space-y-3">
            <p className="font-tech text-[10px] font-bold uppercase tracking-widest text-neutral-400">
              DEMO ACCOUNTS
            </p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  setEmail('alex@example.com');
                  setPassword('customer123');
                }}
                className="w-full border border-neutral-200 py-2 font-tech text-[10px] uppercase tracking-wider text-neutral-700 hover:border-black hover:bg-neutral-50 transition-colors"
              >
                CLIENT PRESET
              </button>
            </div>
            <button
              onClick={handleQuickAdminLogin}
              className="inline-flex items-center gap-2 font-tech text-[11px] font-bold uppercase tracking-wider text-black hover:underline pt-2"
            >
              <Shield className="h-3.5 w-3.5" />
              <span>Open Admin Portal →</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pt-32 pb-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Profile Header */}
        <div className="border-b border-neutral-200 pb-8 mb-10 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="font-tech text-[10px] uppercase tracking-widest text-neutral-400">MY ACCOUNT</span>
              {isAdmin && (
                <span className="border border-black bg-black px-2 py-0.5 font-tech text-[9px] font-bold text-white uppercase tracking-widest">
                  ADMIN CONSOLE PERMISSIONS
                </span>
              )}
            </div>
            <h1 className="font-display text-4xl sm:text-5xl font-black uppercase tracking-tight text-black">{user.name}</h1>
            <p className="font-tech text-xs text-neutral-500 mt-1">{user.email}</p>
          </div>

          <div className="flex items-center gap-3">
            {isAdmin && (
              <Link
                to="/admin"
                className="flex items-center gap-2 bg-black px-5 py-3 font-tech text-xs font-bold uppercase tracking-widest text-white hover:bg-neutral-800 transition-colors"
              >
                <Shield className="h-4 w-4" />
                <span>Admin Dashboard</span>
              </Link>
            )}
            <button
              onClick={logout}
              className="flex items-center gap-2 border border-neutral-200 bg-white px-5 py-3 font-tech text-xs font-bold uppercase tracking-widest text-neutral-700 hover:border-black hover:text-black transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Link
            to="/orders"
            className="border border-neutral-200 bg-white p-8 hover:border-black transition-all flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between mb-8">
              <span className="font-tech text-[10px] uppercase tracking-widest text-neutral-400">ORDERS</span>
              <Package className="h-5 w-5 text-neutral-400 group-hover:text-black transition-colors" />
            </div>
            <div>
              <h3 className="font-display text-xl font-bold uppercase tracking-tight text-black">My Orders</h3>
              <p className="font-editorial text-sm italic text-neutral-500 mt-1">See your past and current orders.</p>
              <span className="inline-flex items-center gap-2 font-tech text-xs font-bold uppercase tracking-wider text-black mt-4 group-hover:translate-x-1 transition-transform">
                <span>View Orders</span>
                <ArrowRight className="h-3 w-3" />
              </span>
            </div>
          </Link>

          <Link
            to="/wishlist"
            className="border border-neutral-200 bg-white p-8 hover:border-black transition-all flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between mb-8">
              <span className="font-tech text-[10px] uppercase tracking-widest text-neutral-400">WISHLIST</span>
              <Heart className="h-5 w-5 text-neutral-400 group-hover:text-black transition-colors" />
            </div>
            <div>
              <h3 className="font-display text-xl font-bold uppercase tracking-tight text-black">Saved Shoes</h3>
              <p className="font-editorial text-sm italic text-neutral-500 mt-1">Bookmarked footwear models and upcoming drops.</p>
              <span className="inline-flex items-center gap-2 font-tech text-xs font-bold uppercase tracking-wider text-black mt-4 group-hover:translate-x-1 transition-transform">
                <span>Open Wishlist</span>
                <ArrowRight className="h-3 w-3" />
              </span>
            </div>
          </Link>

          <Link
            to="/track-order"
            className="border border-neutral-200 bg-white p-8 hover:border-black transition-all flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between mb-8">
              <span className="font-tech text-[10px] uppercase tracking-widest text-neutral-400">TRACKING</span>
              <MapPin className="h-5 w-5 text-neutral-400 group-hover:text-black transition-colors" />
            </div>
            <div>
              <h3 className="font-display text-xl font-bold uppercase tracking-tight text-black">Track My Order</h3>
              <p className="font-editorial text-sm italic text-neutral-500 mt-1">See where your order is right now.</p>
              <span className="inline-flex items-center gap-2 font-tech text-xs font-bold uppercase tracking-wider text-black mt-4 group-hover:translate-x-1 transition-transform">
                <span>Track Order</span>
                <ArrowRight className="h-3 w-3" />
              </span>
            </div>
          </Link>
        </div>

        <MyAlerts />

        {/* Saved Shipping Details Card */}
        <div className="border border-neutral-200 bg-neutral-50/50 p-8 space-y-4 max-w-2xl">
          <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
            <h3 className="font-display text-lg font-bold uppercase tracking-tight text-black">
              Primary Dispatch Address
            </h3>
            <span className="font-tech text-[10px] uppercase tracking-widest text-neutral-400">SAVED DETAILS</span>
          </div>
          {user.shippingAddress?.address ? (
            <div className="font-tech text-xs text-neutral-600 space-y-1.5 leading-relaxed">
              <p className="font-bold text-black uppercase">{user.name}</p>
              <p>{user.shippingAddress.address} {user.shippingAddress.apartment}</p>
              <p>{user.shippingAddress.city}, {user.shippingAddress.state} {user.shippingAddress.postalCode}</p>
              <p>{user.shippingAddress.country}</p>
            </div>
          ) : (
            <p className="font-tech text-xs text-neutral-500 uppercase leading-relaxed">
              No saved address yet. Your address will be saved when you place your next order.
            </p>
          )}
        </div>

      </div>
    </div>
  );
};
