import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useBusiness } from '../../context/BusinessContext';
import { Badge, Button, Card, Input, Label, Select } from '../ui';
import type { WaitlistEntry } from '../../lib/types';

const emptyEntry: Omit<WaitlistEntry, 'id' | 'status' | 'created_at'> = {
  client_id: null,
  full_name: '',
  phone: '',
  email: '',
  service_id: null,
  preferred_date: null,
  preferred_time_range: '',
  notes: '',
};

export default function WaitlistPanel() {
  const { services } = useBusiness();
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState(emptyEntry);
  const [notifyingId, setNotifyingId] = useState<string | null>(null);

  async function load() {
    const { data } = await supabase
      .from('waitlist')
      .select('*')
      .in('status', ['waiting', 'notified'])
      .order('created_at', { ascending: false });
    setEntries(data ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function addEntry() {
    if (!draft.full_name) return;
    await supabase.from('waitlist').insert(draft);
    setDraft(emptyEntry);
    setShowForm(false);
    load();
  }

  async function setStatus(id: string, status: WaitlistEntry['status']) {
    await supabase.from('waitlist').update({ status }).eq('id', id);
    load();
  }

  async function notify(entry: WaitlistEntry) {
    if (!entry.email) {
      await setStatus(entry.id, 'notified');
      return;
    }
    setNotifyingId(entry.id);
    await supabase.functions.invoke('notify-client', {
      body: {
        to: entry.email,
        subject: 'A slot just opened up!',
        message: `Hi ${entry.full_name}, a spot just freed up that might work for you. Reply to this email or call us to grab it before it's gone!`,
      },
    });
    setNotifyingId(null);
    setStatus(entry.id, 'notified');
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Waitlist</h2>
          <p className="text-sm text-slate-500">Clients waiting for a slot to free up.</p>
        </div>
        <Button onClick={() => setShowForm(true)}>Add to waitlist</Button>
      </div>

      {showForm && (
        <Card className="mb-5 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Name</Label>
              <Input value={draft.full_name} onChange={(e) => setDraft({ ...draft, full_name: e.target.value })} />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={draft.email ?? ''} onChange={(e) => setDraft({ ...draft, email: e.target.value })} />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={draft.phone ?? ''} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} />
            </div>
            <div>
              <Label>Service</Label>
              <Select value={draft.service_id ?? ''} onChange={(e) => setDraft({ ...draft, service_id: e.target.value || null })}>
                <option value="">Any service</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Preferred date</Label>
              <Input type="date" value={draft.preferred_date ?? ''} onChange={(e) => setDraft({ ...draft, preferred_date: e.target.value })} />
            </div>
            <div>
              <Label>Preferred time</Label>
              <Input
                placeholder="e.g. afternoons"
                value={draft.preferred_time_range ?? ''}
                onChange={(e) => setDraft({ ...draft, preferred_time_range: e.target.value })}
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button onClick={addEntry}>Save</Button>
            <Button variant="ghost" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </Card>
      )}

      <div className="space-y-2">
        {entries.map((entry) => (
          <Card key={entry.id} className="flex flex-wrap items-center gap-4 p-4">
            <div className="min-w-[160px] flex-1">
              <p className="font-medium text-slate-900">{entry.full_name}</p>
              <p className="text-xs text-slate-500">{entry.phone || entry.email}</p>
            </div>
            <p className="text-sm text-slate-500">
              {entry.preferred_date ?? 'Any date'} {entry.preferred_time_range && `• ${entry.preferred_time_range}`}
            </p>
            <Badge tone={entry.status === 'waiting' ? 'amber' : 'blue'}>{entry.status}</Badge>
            <div className="ml-auto flex gap-2">
              <Button variant="secondary" disabled={notifyingId === entry.id} onClick={() => notify(entry)}>
                {notifyingId === entry.id ? 'Notifying...' : 'Notify'}
              </Button>
              <Button variant="ghost" onClick={() => setStatus(entry.id, 'booked')}>
                Mark booked
              </Button>
              <Button variant="ghost" onClick={() => setStatus(entry.id, 'expired')}>
                Remove
              </Button>
            </div>
          </Card>
        ))}
        {entries.length === 0 && <p className="text-sm text-slate-500">No one on the waitlist right now.</p>}
      </div>
    </div>
  );
}
