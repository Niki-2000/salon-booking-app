import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useBusiness } from '../../context/BusinessContext';
import { Button, Card, Input, Label, Textarea } from '../ui';
import { formatMoney, formatShortDate } from '../../lib/format';
import type { Appointment, Client, ClientNote, ClientStats } from '../../lib/types';

export default function ClientProfile({ clientId, onBack }: { clientId: string; onBack: () => void }) {
  const { business } = useBusiness();
  const [client, setClient] = useState<Client | null>(null);
  const [stats, setStats] = useState<ClientStats | null>(null);
  const [notes, setNotes] = useState<ClientNote[]>([]);
  const [history, setHistory] = useState<Appointment[]>([]);
  const [newNote, setNewNote] = useState('');
  const [editing, setEditing] = useState(false);

  async function load() {
    const [clientRes, statsRes, notesRes, historyRes] = await Promise.all([
      supabase.from('clients').select('*').eq('id', clientId).single(),
      supabase.from('client_stats').select('*').eq('client_id', clientId).maybeSingle(),
      supabase.from('client_notes').select('*').eq('client_id', clientId).order('created_at', { ascending: false }),
      supabase
        .from('appointments')
        .select('*, services(*)')
        .eq('client_id', clientId)
        .order('start_time', { ascending: false }),
    ]);
    setClient(clientRes.data);
    setStats(statsRes.data);
    setNotes(notesRes.data ?? []);
    setHistory((historyRes.data as unknown as Appointment[]) ?? []);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  async function addNote() {
    if (!newNote.trim()) return;
    await supabase.from('client_notes').insert({ client_id: clientId, note: newNote.trim() });
    setNewNote('');
    load();
  }

  async function saveClient(updates: Partial<Client>) {
    await supabase.from('clients').update(updates).eq('id', clientId);
    setEditing(false);
    load();
  }

  if (!client) return null;

  return (
    <div>
      <button onClick={onBack} className="mb-4 text-sm text-slate-500 hover:text-slate-700">
        &larr; All clients
      </button>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-4 md:col-span-1">
          <Card className="p-4">
            {editing ? (
              <EditClientForm client={client} onSave={saveClient} onCancel={() => setEditing(false)} />
            ) : (
              <>
                <p className="text-lg font-semibold text-slate-900">{client.full_name}</p>
                <p className="text-sm text-slate-500">{client.email}</p>
                <p className="text-sm text-slate-500">{client.phone}</p>
                <Button variant="secondary" className="mt-3" onClick={() => setEditing(true)}>
                  Edit details
                </Button>
              </>
            )}
          </Card>

          <Card className="grid grid-cols-2 gap-3 p-4 text-center">
            <div>
              <p className="text-xl font-bold text-slate-900">{stats?.completed_visits ?? 0}</p>
              <p className="text-xs text-slate-500">Visits</p>
            </div>
            <div>
              <p className="text-xl font-bold text-slate-900">{formatMoney(stats?.total_spent ?? 0, business?.currency)}</p>
              <p className="text-xs text-slate-500">Total spent</p>
            </div>
            <div>
              <p className="text-xl font-bold text-slate-900">{stats?.no_shows ?? 0}</p>
              <p className="text-xs text-slate-500">No-shows</p>
            </div>
            <div>
              <p className="text-xl font-bold text-slate-900">
                {stats?.last_visit ? formatShortDate(new Date(stats.last_visit)) : '-'}
              </p>
              <p className="text-xs text-slate-500">Last visit</p>
            </div>
          </Card>
        </div>

        <div className="space-y-6 md:col-span-2">
          <Card className="p-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-900">Notes &amp; service history</h3>
            <div className="mb-3 flex gap-2">
              <Textarea
                rows={2}
                placeholder="e.g. patch test clear, used 6.0 + 20vol, loves a strong fringe..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
              />
            </div>
            <Button variant="secondary" onClick={addNote}>
              Add note
            </Button>

            <div className="mt-4 space-y-3">
              {notes.map((n) => (
                <div key={n.id} className="border-l-2 border-slate-200 pl-3 text-sm">
                  <p className="text-slate-700">{n.note}</p>
                  <p className="text-xs text-slate-400">{formatShortDate(new Date(n.created_at))}</p>
                </div>
              ))}
              {notes.length === 0 && <p className="text-sm text-slate-400">No notes yet.</p>}
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-900">Appointment history</h3>
            <div className="space-y-2">
              {history.map((a) => (
                <div key={a.id} className="flex justify-between border-b border-slate-100 py-2 text-sm last:border-0">
                  <div>
                    <p className="text-slate-700">{a.services?.name}</p>
                    <p className="text-xs text-slate-400">{formatShortDate(new Date(a.start_time))}</p>
                  </div>
                  <p className="text-slate-700">{formatMoney(a.total_price, business?.currency)}</p>
                </div>
              ))}
              {history.length === 0 && <p className="text-sm text-slate-400">No past appointments.</p>}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function EditClientForm({
  client,
  onSave,
  onCancel,
}: {
  client: Client;
  onSave: (updates: Partial<Client>) => void;
  onCancel: () => void;
}) {
  const [fullName, setFullName] = useState(client.full_name);
  const [email, setEmail] = useState(client.email ?? '');
  const [phone, setPhone] = useState(client.phone ?? '');

  return (
    <div className="space-y-2">
      <div>
        <Label>Name</Label>
        <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
      </div>
      <div>
        <Label>Email</Label>
        <Input value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div>
        <Label>Phone</Label>
        <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>
      <div className="flex gap-2">
        <Button onClick={() => onSave({ full_name: fullName, email, phone })}>Save</Button>
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
