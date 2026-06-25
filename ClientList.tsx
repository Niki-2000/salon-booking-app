import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useBusiness } from '../../context/BusinessContext';
import { Card, Input } from '../ui';
import { formatMoney, formatShortDate } from '../../lib/format';
import ClientProfile from './ClientProfile';
import type { Client, ClientStats } from '../../lib/types';

export default function ClientList() {
  const { business } = useBusiness();
  const [clients, setClients] = useState<Client[]>([]);
  const [stats, setStats] = useState<Record<string, ClientStats>>({});
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from('clients')
      .select('*')
      .order('full_name')
      .then(({ data }) => setClients(data ?? []));
    supabase
      .from('client_stats')
      .select('*')
      .then(({ data }) => {
        const map: Record<string, ClientStats> = {};
        (data ?? []).forEach((s: ClientStats) => (map[s.client_id] = s));
        setStats(map);
      });
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (c) => c.full_name.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || c.phone?.includes(q),
    );
  }, [clients, search]);

  if (selectedId) {
    return <ClientProfile clientId={selectedId} onBack={() => setSelectedId(null)} />;
  }

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold text-slate-900">Clients</h2>
      <Input
        placeholder="Search by name, phone, or email"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 max-w-sm"
      />

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Contact</th>
              <th className="px-4 py-2">Visits</th>
              <th className="px-4 py-2">Total spent</th>
              <th className="px-4 py-2">Last visit</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => {
              const s = stats[c.id];
              return (
                <tr
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  className="cursor-pointer border-t border-slate-100 hover:bg-slate-50"
                >
                  <td className="px-4 py-3 font-medium text-slate-900">{c.full_name}</td>
                  <td className="px-4 py-3 text-slate-500">{c.phone || c.email}</td>
                  <td className="px-4 py-3 text-slate-700">{s?.completed_visits ?? 0}</td>
                  <td className="px-4 py-3 text-slate-700">{formatMoney(s?.total_spent ?? 0, business?.currency)}</td>
                  <td className="px-4 py-3 text-slate-500">{s?.last_visit ? formatShortDate(new Date(s.last_visit)) : '-'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="p-6 text-center text-sm text-slate-500">No clients found.</p>}
      </Card>
    </div>
  );
}
