import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { OrderPushPanel } from '../../components/admin/OrderPushPanel';
import { useNotification } from '../../context/NotificationContext';
import { api } from '../../utils/api';
import { NotificationLog } from '../../types';
import {
  Bell,
  Send,
  Smartphone,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Users,
  Clock,
  Radio,
  Loader2
} from 'lucide-react';

type FeedbackState = { tone: 'success' | 'warning' | 'error'; text: string; detail?: string } | null;

export const AdminNotificationsPage: React.FC = () => {
  const { isSubscribed, isBusy: subBusy, subscribeToPush, errorMessage: subError, support: pushSupport } = useNotification();
  const [title, setTitle] = useState('⚡ Limited Drop: QADAM Phantom 01');
  const [body, setBody] = useState('Handcrafted Italian leather Oxford brogues now available with nationwide Cash on Delivery.');
  const [targetUrl, setTargetUrl] = useState('/product/qadam-phantom-01');
  const [targetAudience, setTargetAudience] = useState<'all' | 'men' | 'women' | 'vip'>('all');

  const [history, setHistory] = useState<NotificationLog[]>([]);
  const [subscriberCount, setSubscriberCount] = useState<number>(0);
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>(null);

  const loadData = async () => {
    try {
      const logs = await api.getNotificationHistory();
      setHistory(logs);
      const subs = await api.getSubscribers();
      setSubscriberCount(subs.length);
    } catch (e) {
      console.warn('Notification load error:', e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setSending(true);
    setFeedback(null);
    try {
      const res = await api.sendNotification({
        title,
        body,
        url: targetUrl,
        targetAudience
      });
      const stats = res?.stats;
      if (!stats || stats.totalTargeted === 0) {
        setFeedback({ tone: 'warning', text: res?.message || 'No subscribed customer devices found.' });
      } else if (stats.delivered > 0 && !stats.failed) {
        setFeedback({ tone: 'success', text: res.message });
      } else if (stats.delivered > 0) {
        setFeedback({ tone: 'warning', text: res.message, detail: stats.errors?.[0] });
      } else {
        setFeedback({ tone: 'error', text: res?.message || 'Broadcast failed for all devices.', detail: stats.errors?.[0] });
      }
      await loadData();
    } catch (err: any) {
      setFeedback({ tone: 'error', text: err.message || 'Failed to dispatch push notification.' });
    } finally {
      setSending(false);
    }
  };

  const handleTemplateSelect = (type: 'drop' | 'discount' | 'restock' | 'vip') => {
    switch (type) {
      case 'drop':
        setTitle('⚡ Global Drop Live: QADAM Phantom 01');
        setBody('Pure Platinum edition available now in limited quantities. Complimentary express courier.');
        setTargetUrl('/product/qadam-phantom-01');
        break;
      case 'discount':
        setTitle('Exclusive Client Privilege: 15% VIP Reduction');
        setBody('Use private code PRIVILEGE15 at checkout on all QADAM handcrafted footwear.');
        setTargetUrl('/shop');
        break;
      case 'restock':
        setTitle('Restock Alert: QADAM Tuscan Chelsea In Stock');
        setBody('Popular sizes 40 through 45 are back in stock at QADAM. Reserve your pair with nationwide Cash on Delivery.');
        setTargetUrl('/product/qadam-tuscan-chelsea-sovereign');
        break;
      case 'vip':
        setTitle('VIP Early Access: QADAM New Arrivals');
        setBody('Explore our newest handcrafted footwear silhouettes online with priority delivery across Pakistan.');
        setTargetUrl('/shop?newArrival=true');
        break;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        
        {/* Header */}
        <div className="border-b border-neutral-200 pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="font-tech text-[10px] uppercase tracking-widest text-neutral-400">Notifications</span>
              <span className="h-1 w-1 bg-black rounded-full" />
              <span className="font-tech text-[10px] uppercase tracking-widest text-emerald-700 font-bold">Active</span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-black uppercase tracking-tight text-black">
              Push Notifications
            </h1>
            <p className="font-editorial text-base italic text-neutral-500 mt-1">
              Send order updates to one customer, or offers and news to everyone.
            </p>
          </div>

          <div className="flex items-center gap-3 border border-neutral-200 bg-white px-4 py-2 self-start sm:self-auto font-tech text-xs">
            <Radio className="h-3.5 w-3.5 text-black animate-pulse" />
            <span className="font-bold text-black uppercase">{subscriberCount} devices subscribed</span>
          </div>
        </div>

        {/* Order notifications (one customer) */}
        <OrderPushPanel />

        <h2 className="pt-2 text-lg">Send to all subscribers</h2>

        {/* Quick Pre-set Templates */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-tech text-[10px] uppercase tracking-widest text-neutral-400 mr-2">
            [ PRESETS ]:
          </span>
          {[
            { id: 'drop', label: 'New Drop' },
            { id: 'discount', label: 'VIP Voucher' },
            { id: 'restock', label: 'Restock Alert' },
            { id: 'vip', label: 'VIP Early Access' },
          ].map(tpl => (
            <button
              key={tpl.id}
              onClick={() => handleTemplateSelect(tpl.id as any)}
              className="border border-neutral-200 bg-white px-3.5 py-1.5 font-tech text-xs uppercase tracking-wider text-neutral-700 hover:border-black hover:text-black transition-colors"
            >
              {tpl.label}
            </button>
          ))}
        </div>

        {/* Composer & Live Phone Mockup Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Form Composer */}
          <div className="lg:col-span-7 border border-neutral-200 bg-white p-8 space-y-5">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <h3 className="font-display text-lg font-bold uppercase tracking-tight text-black flex items-center gap-2">
                <Send className="h-4 w-4 text-black" />
                <span>Compose Real Web Push Notification</span>
              </h3>
              <span className="font-tech text-[10px] uppercase tracking-widest text-neutral-400">[ LIVE BROADCAST ]</span>
            </div>

            <form onSubmit={handleBroadcast} className="space-y-4">
              <div>
                <label className="block font-tech text-[10px] uppercase tracking-widest text-neutral-500 mb-1">
                  Notification Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full border border-neutral-200 bg-neutral-50/40 px-4 py-2.5 font-tech text-xs text-black focus:outline-none focus:border-black focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-tech text-[10px] uppercase tracking-widest text-neutral-500 mb-1">
                  Message Payload Body *
                </label>
                <textarea
                  required
                  rows={3}
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  className="w-full border border-neutral-200 bg-neutral-50/40 px-4 py-2.5 font-tech text-xs text-black focus:outline-none focus:border-black focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-tech text-[10px] uppercase tracking-widest text-neutral-500 mb-1">
                    Destination URL
                  </label>
                  <input
                    type="text"
                    value={targetUrl}
                    onChange={e => setTargetUrl(e.target.value)}
                    className="w-full border border-neutral-200 bg-neutral-50/40 px-3 py-2 font-tech text-xs text-black focus:outline-none focus:border-black focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-tech text-[10px] uppercase tracking-widest text-neutral-500 mb-1">
                    Audience Segment
                  </label>
                  <select
                    value={targetAudience}
                    onChange={e => setTargetAudience(e.target.value as any)}
                    className="w-full border border-neutral-200 bg-neutral-50/40 px-3 py-2 font-tech text-xs text-black focus:outline-none focus:border-black focus:bg-white"
                  >
                    <option value="all">All Subscribed Devices ({subscriberCount})</option>
                    <option value="vip">VIP Drop Collectors</option>
                    <option value="men">Men's Silhouettes Only</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 space-y-3">
                {/* Browser subscription helper so admin can verify real push on this device */}
                <div className="flex flex-wrap items-center justify-between gap-2 rounded border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-xs">
                  <div className="flex items-center gap-2 font-tech text-[11px] text-neutral-700">
                    {isSubscribed ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span>This browser is subscribed to customer push broadcasts.</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                        <span>This browser is not subscribed yet{pushSupport !== 'supported' ? ` (${pushSupport})` : ''}.</span>
                      </>
                    )}
                  </div>
                  {!isSubscribed && pushSupport === 'supported' && (
                    <button
                      type="button"
                      disabled={subBusy}
                      onClick={async () => {
                        const ok = await subscribeToPush();
                        if (ok) await loadData();
                      }}
                      className="inline-flex items-center gap-1.5 border border-black bg-white px-3 py-1 font-tech text-[10px] font-bold uppercase tracking-wider text-black hover:bg-black hover:text-white disabled:opacity-50 transition-colors cursor-pointer"
                    >
                      {subBusy && <Loader2 className="h-3 w-3 animate-spin" />}
                      <span>{subBusy ? 'Subscribing...' : 'Subscribe This Browser'}</span>
                    </button>
                  )}
                </div>

                {subError && (
                  <p className="border border-red-300 bg-red-50 px-3.5 py-2.5 font-tech text-[11px] text-red-700">
                    {subError}
                  </p>
                )}

                {feedback && (
                  <div
                    role="status"
                    className={`flex items-start gap-2.5 border p-3.5 font-tech text-xs ${
                      feedback.tone === 'error'
                        ? 'border-red-300 bg-red-50 text-red-700'
                        : feedback.tone === 'warning'
                          ? 'border-amber-300 bg-amber-50 text-amber-900'
                          : 'border-emerald-300 bg-emerald-50 text-emerald-800'
                    }`}
                  >
                    {feedback.tone === 'success' ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="font-bold">{feedback.text}</p>
                      {feedback.detail && <p className="mt-0.5 text-[11px] opacity-80">{feedback.detail}</p>}
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={sending}
                  className="flex items-center justify-center gap-3 w-full bg-black py-4 font-tech text-xs font-bold uppercase tracking-widest text-white hover:bg-neutral-800 disabled:opacity-50 transition-all cursor-pointer"
                >
                  <Bell className="h-4 w-4" />
                  <span>{sending ? '[ TRANSMITTING RFC 8291 PACKETS... ]' : `Broadcast Notification to ${subscriberCount} Subscribers`}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Phone Mockup Screen */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <span className="font-tech text-[10px] uppercase tracking-widest text-neutral-400 mb-3 flex items-center gap-2">
              <Smartphone className="h-3.5 w-3.5 text-black" />
              <span>[ HARDWARE LOCKSCREEN SIMULATION ]</span>
            </span>

            {/* Smartphone Shell */}
            <div className="w-[300px] h-[580px] rounded-[36px] border-[5px] border-neutral-900 bg-gradient-to-b from-neutral-100 to-neutral-200 p-3 shadow-2xl relative flex flex-col justify-between overflow-hidden">
              {/* Dynamic Island / Speaker notch */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 h-4 w-24 bg-neutral-900 rounded-full z-20" />

              {/* Lockscreen Time */}
              <div className="text-center pt-14 space-y-1">
                <p className="font-tech text-[10px] uppercase tracking-wider text-neutral-500">Thursday, November 5</p>
                <p className="font-display text-5xl font-black text-black tracking-tight">09:41</p>
              </div>

              {/* Notification Banner on Glass Card */}
              <div className="relative z-10 border border-neutral-300 bg-white/95 p-4 shadow-xl backdrop-blur-md mb-20 space-y-2 transition-all">
                <div className="flex items-center justify-between font-tech text-[9px] uppercase tracking-wider text-neutral-500">
                  <div className="flex items-center gap-1.5">
                    <div className="h-4 w-4 bg-black flex items-center justify-center text-[8px] font-bold text-white">
                      Q
                    </div>
                    <span className="font-bold text-black tracking-widest">QADAM FOOTWEAR</span>
                  </div>
                  <span>NOW</span>
                </div>

                <h5 className="font-display text-xs font-bold uppercase tracking-tight text-black line-clamp-1">{title}</h5>
                <p className="font-tech text-[10px] text-neutral-600 line-clamp-2 leading-relaxed">{body}</p>
              </div>

              {/* Bottom bar indicator */}
              <div className="h-1 w-24 bg-neutral-900 rounded-full mx-auto mb-1" />
            </div>
          </div>

        </div>

        {/* Broadcast History Table */}
        <div className="border border-neutral-200 bg-white p-8 space-y-5">
          <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
            <h3 className="font-display text-xl font-bold uppercase tracking-tight text-black">
              Broadcast Dispatch Ledger
            </h3>
            <span className="font-tech text-[10px] uppercase tracking-widest text-neutral-400">[ AUDIT LOG ]</span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left font-tech text-xs">
              <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-400 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">PAYLOAD MESSAGE</th>
                  <th className="py-3.5 px-4">SEGMENT</th>
                  <th className="py-3.5 px-4">DELIVERY RATIO</th>
                  <th className="py-3.5 px-4">DISPATCHER</th>
                  <th className="py-3.5 px-4">TIMESTAMP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 text-black">
                {history.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 px-4 text-center text-neutral-400">
                      No broadcasts sent yet.
                    </td>
                  </tr>
                )}
                {history.map(log => {
                  const ok = log.successCount > 0 && !log.failureCount;
                  const partial = log.successCount > 0 && !!log.failureCount;
                  const badgeCls = ok
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                    : partial
                      ? 'border-amber-600 bg-amber-50 text-amber-800'
                      : 'border-red-600 bg-red-50 text-red-700';
                  return (
                    <tr key={log._id || (log as any).id} className="hover:bg-neutral-50 transition-colors">
                      <td className="py-4 px-4">
                        <span className="font-bold uppercase block">{log.title}</span>
                        <span className="text-neutral-500 text-[10px] line-clamp-1">{log.body}</span>
                      </td>
                      <td className="py-4 px-4 uppercase">{log.targetAudience}</td>
                      <td className="py-4 px-4">
                        <span className={`border px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest ${badgeCls}`}>
                          {log.successCount} / {log.recipientCount}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-neutral-600">{log.sentBy}</td>
                      <td className="py-4 px-4 text-neutral-400 text-[11px]">
                        {new Date(log.createdAt).toLocaleDateString()} {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
};
