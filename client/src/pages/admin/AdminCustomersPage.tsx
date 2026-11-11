import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { api } from '../../utils/api';
import { User } from '../../types';
import { Users, Mail, Phone, Calendar, Shield } from 'lucide-react';

export const AdminCustomersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCustomers() {
      try {
        const list = await api.getUsers();
        setUsers(list);
      } catch (e) {
        console.warn('Customer load error:', e);
      } finally {
        setLoading(false);
      }
    }
    loadCustomers();
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-8">
        
        {/* Header */}
        <div className="border-b border-neutral-200 pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="font-tech text-[10px] uppercase tracking-widest text-neutral-400">[ CLIENT DIRECTORY // ENROLLED PATRONS ]</span>
              <span className="h-1 w-1 bg-black rounded-full" />
              <span className="font-tech text-[10px] uppercase tracking-widest text-neutral-500">{users.length} REGISTERED ACCOUNTS</span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-black uppercase tracking-tight text-black">
              Client Directory
            </h1>
            <p className="font-editorial text-base italic text-neutral-500 mt-1">
              Global clientele enrolled in QADAM bespoke footwear allocations and drop alerts.
            </p>
          </div>

          <span className="font-tech text-xs uppercase tracking-wider text-black border border-black px-4 py-2 self-start sm:self-auto">
            [ VERIFIED CLIENT DOSSIERS ]
          </span>
        </div>

        {/* Table */}
        <div className="border border-neutral-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-tech text-xs">
              <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-400 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">PATRON IDENTITY</th>
                  <th className="py-3.5 px-4">EMAIL COORDINATE</th>
                  <th className="py-3.5 px-4">CLEARANCE ROLE</th>
                  <th className="py-3.5 px-4">DIRECT TELEPHONE</th>
                  <th className="py-3.5 px-4">REGISTRATION TIMESTAMP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 text-black">
                {users.map(u => (
                  <tr key={u._id} className="hover:bg-neutral-50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-7 w-7 border border-black bg-black text-white flex items-center justify-center font-bold text-xs">
                          {u.name[0]}
                        </div>
                        <span className="font-bold uppercase">{u.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-neutral-600">{u.email}</td>
                    <td className="py-4 px-4">
                      <span className={`border px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest ${
                        u.role === 'admin' ? 'border-black bg-black text-white' : 'border-neutral-200 bg-neutral-50 text-neutral-800'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-neutral-500">{u.phone || '—'}</td>
                    <td className="py-4 px-4 text-neutral-400 text-[11px]">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString().toUpperCase() : 'ACTIVE PATRON'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
};
