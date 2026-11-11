import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useInstallPrompt } from '../../utils/pwa';
import { NewOrderAlert } from './NewOrderAlert';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Bell,
  LayoutTemplate,
  Grid3x3,
  MessageCircle,
  Download,
  LogOut,
  ExternalLink,
  Menu,
  X,
  Tag,
  Truck,
  ShoppingCart,
  TrendingDown,
  Megaphone,
  Send,
  Radio,
  ShieldCheck,
  DatabaseBackup,
  Settings,
  Headset,
} from 'lucide-react';
import { ChatAlert } from './ChatAlert';
import { BackupAlert } from './BackupAlert';
import { AdminChatModal } from './AdminChatModal';

const NAV_GROUPS = [
  {
    title: 'Store',
    items: [
      { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
      { label: 'Orders', href: '/admin/orders', icon: ShoppingBag },
      { label: 'Products', href: '/admin/products', icon: Package },
    ],
  },
  {
    title: 'Analytics',
    items: [
      { label: 'Live Visitors', href: '/admin/live', icon: Radio },
    ],
  },
  {
    title: 'Marketing',
    items: [
      { label: 'Marketing', href: '/admin/marketing', icon: Megaphone },
    ],
  },
  {
    title: 'Channels & Content',
    items: [
      { label: 'Live Chat', href: '/admin/chat', icon: Headset },
      { label: 'WhatsApp Center', href: '/admin/whatsapp', icon: MessageCircle },
      { label: 'Notifications', href: '/admin/notifications', icon: Bell },
      { label: 'Homepage Banner', href: '/admin/hero', icon: LayoutTemplate },
      { label: 'Categories', href: '/admin/categories', icon: Grid3x3 },
    ],
  },
  {
    title: 'System',
    items: [
      { label: 'Settings', href: '/admin/settings', icon: Settings },
      { label: 'Backups', href: '/admin/backups', icon: DatabaseBackup },
      { label: 'Security Log', href: '/admin/security', icon: ShieldCheck },
    ],
  },
];

const ALL_ITEMS = NAV_GROUPS.flatMap(g => g.items);

export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState<string | undefined>(undefined);

  // PWA install (admin app has its own manifest: /manifest-admin.json)
  const { canInstall, install } = useInstallPrompt();

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const [chatUnread, setChatUnread] = useState(0);
  const isOn = (href: string) =>
    (href === '/admin/chat' ? chatModalOpen : false) ||
    location.pathname === href ||
    (['/admin/marketing', '/admin/settings'].includes(href) && location.pathname.startsWith(href + '/'));
  const current = ALL_ITEMS.find(i => isOn(i.href));
  const initial = (user?.name || 'Admin')[0].toUpperCase();

  const SidebarContent = (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-6">
        <div className="leading-tight">
          <img src="/logo.png" alt="QADAM" className="h-10 w-auto object-contain" />
          <p className="text-[11px] text-[#8A6A52]">Admin Panel</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-4">
        {NAV_GROUPS.map(group => (
          <div key={group.title}>
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9C7B62]">{group.title}</p>
            <div className="space-y-1">
              {group.items.map(item => {
                const Icon = item.icon;
                const active = isOn(item.href);
                if (item.href === '/admin/chat') {
                  return (
                    <button
                      key={item.href}
                      type="button"
                      onClick={() => {
                        setSelectedChatId(undefined);
                        setChatModalOpen(true);
                        setMobileOpen(false);
                      }}
                      className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all cursor-pointer ${
                        active ? 'bg-white/70 text-[#3B2618] shadow-sm' : 'text-[#6B4C36] hover:bg-white/40 hover:text-[#3B2618]'
                      }`}
                    >
                      {active && <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-[#9A6440]" />}
                      <Icon className={`h-[18px] w-[18px] ${active ? 'text-[#9A6440]' : 'text-[#9C7B62] group-hover:text-[#6B4C36]'}`} />
                      <span>{item.label}</span>
                      {chatUnread > 0 && (
                        <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">{chatUnread}</span>
                      )}
                    </button>
                  );
                }
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all ${
                      active ? 'bg-white/70 text-[#3B2618] shadow-sm' : 'text-[#6B4C36] hover:bg-white/40 hover:text-[#3B2618]'
                    }`}
                  >
                    {active && <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-[#9A6440]" />}
                    <Icon className={`h-[18px] w-[18px] ${active ? 'text-[#9A6440]' : 'text-[#9C7B62] group-hover:text-[#6B4C36]'}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer actions */}
      <div className="space-y-1 border-t border-[#E2C9B0] p-3">
        {canInstall && (
          <button
            onClick={() => install()}
            className="mb-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#9A6440] to-[#6E4428] py-2.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 cursor-pointer"
          >
            <Download className="h-4 w-4" /> Install Admin App
          </button>
        )}
        <Link to="/" target="_blank" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] text-[#6B4C36] hover:bg-white/40 hover:text-[#3B2618]">
          <ExternalLink className="h-[18px] w-[18px]" /> View Store
        </Link>
        <button
          onClick={() => { logout(); navigate('/admin/login'); }}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] text-red-700 hover:bg-red-500/10 hover:text-red-800 cursor-pointer"
        >
          <LogOut className="h-[18px] w-[18px]" /> Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="admin-ui flex h-screen overflow-hidden overscroll-none bg-[#F4F4F6] text-neutral-900">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 bg-gradient-to-b from-[#F6E7D8] to-[#EBD3BC] border-r border-[#E2C9B0] md:block">{SidebarContent}</aside>

      {/* Mobile sidebar (drawer) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <aside className="admin-drawer relative h-full w-72 bg-gradient-to-b from-[#F6E7D8] to-[#EBD3BC] shadow-2xl" onClick={e => e.stopPropagation()}>
            <button onClick={() => setMobileOpen(false)} className="absolute right-3 top-6 rounded-lg p-1.5 text-[#6B4C36] hover:bg-white/50 cursor-pointer" aria-label="Close menu">
              <X className="h-5 w-5" />
            </button>
            {SidebarContent}
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-neutral-200/80 bg-white/80 px-4 backdrop-blur-xl sm:px-8">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="rounded-lg p-2 text-neutral-600 hover:bg-neutral-100 md:hidden cursor-pointer" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <p className="text-[11px] text-neutral-400">Admin</p>
              <p className="-mt-0.5 text-sm font-semibold text-neutral-900">{current?.label || 'Dashboard'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <NewOrderAlert />
            <ChatAlert
              onUnread={setChatUnread}
              onOpenChat={(id) => {
                setSelectedChatId(id);
                setChatModalOpen(true);
              }}
            />
            <button
              type="button"
              onClick={() => {
                setSelectedChatId(undefined);
                setChatModalOpen(true);
              }}
              title="Open Live Chat Concierge"
              aria-label="Open Live Chat"
              className="relative flex h-9 w-9 items-center justify-center rounded-full border border-[#E8D9C8] bg-[#FDFAF5] text-[#6B4C36] transition-colors hover:bg-[#3B2618] hover:text-[#F3D9A4] cursor-pointer"
            >
              <Headset className="h-4 w-4" />
              {chatUnread > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white ring-2 ring-white">
                  {chatUnread}
                </span>
              )}
            </button>
            <BackupAlert />
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-neutral-900">{user?.name || 'Administrator'}</p>
              <p className="text-[11px] text-neutral-400">{user?.email || ''}</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#B07A52] to-[#7A4E30] text-sm font-bold text-white ring-2 ring-white shadow">
              {initial}
            </div>
          </div>
        </header>

        <main
          className={`flex-1 ${chatModalOpen ? 'overflow-hidden overscroll-none' : 'overflow-y-auto'}`}
          style={{ scrollbarGutter: 'stable' }}
        >
          <div className="mx-auto max-w-7xl p-4 sm:p-8">{children}</div>
        </main>
      </div>

      {/* In-place Live Chat Overlay Modal */}
      <AdminChatModal
        isOpen={chatModalOpen}
        onClose={() => {
          setChatModalOpen(false);
          setSelectedChatId(undefined);
        }}
        initialChatId={selectedChatId}
      />
    </div>
  );
};
