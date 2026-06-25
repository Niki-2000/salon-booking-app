import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Badge, Button, Card, Input, Label, Select, Textarea } from '../ui';
import type { ReminderRule } from '../../lib/types';

const emptyRule: Omit<ReminderRule, 'id'> = {
  label: '',
  offset_minutes: 1440,
  channel: 'email',
  enabled: true,
  subject: 'Appointment reminder',
  message: 'Hi {{client_name}}, just a reminder of your {{service_name}} appointment on {{appointment_date}} at {{appointment_time}}.',
};

function minutesToValueUnit(minutes: number) {
  if (minutes % 1440 === 0) return { value: minutes / 1440, unit: 'days' as const };
  if (minutes % 60 === 0) return { value: minutes / 60, unit: 'hours' as const };
  return { value: minutes, unit: 'minutes' as const };
}

function valueUnitToMinutes(value: number, unit: 'days' | 'hours' | 'minutes') {
  if (unit === 'days') return value * 1440;
  if (unit === 'hours') return value * 60;
  return value;
}

export default function ReminderSettings() {
  const [rules, setRules] = useState<ReminderRule[]>([]);
  const [editing, setEditing] = useState<ReminderRule | (typeof emptyRule & { id?: undefined }) | null>(null);
  const [unit, setUnit] = useState<'days' | 'hours' | 'minutes'>('hours');
  const [value, setValue] = useState(24);

  async function load() {
    const { data } = await supabase.from('reminder_rules').select('*').order('offset_minutes', { ascending: false });
    setRules(data ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  function startEdit(rule: ReminderRule | (typeof emptyRule & { id?: undefined })) {
    const { value: v, unit: u } = minutesToValueUnit(rule.offset_minutes);
    setValue(v);
    setUnit(u);
    setEditing(rule);
  }

  async function save() {
    if (!editing) return;
    const offset_minutes = valueUnitToMinutes(value, unit);
    if (editing.id) {
      await supabase
        .from('reminder_rules')
        .update({ ...editing, offset_minutes })
        .eq('id', editing.id);
    } else {
      const { id, ...rest } = editing;
      await supabase.from('reminder_rules').insert({ ...rest, offset_minutes });
    }
    setEditing(null);
    load();
  }

  async function remove(id: string) {
    await supabase.from('reminder_rules').delete().eq('id', id);
    load();
  }

  async function toggleEnabled(rule: ReminderRule) {
    await supabase.from('reminder_rules').update({ enabled: !rule.enabled }).eq('id', rule.id);
    load();
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Reminders</h2>
          <p className="text-sm text-slate-500">Choose exactly when automatic email reminders go out.</p>
        </div>
        <Button onClick={() => startEdit({ ...emptyRule })}>Add reminder</Button>
      </div>

      {editing && (
        <Card className="mb-5 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Label</Label>
              <Input value={editing.label} onChange={(e) => setEditing({ ...editing, label: e.target.value })} placeholder="e.g. Day-before reminder" />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <Label>Send</Label>
                <Input type="number" min={1} value={value} onChange={(e) => setValue(Number(e.target.value))} />
              </div>
              <div className="flex-1">
                <Label>Before appointment</Label>
                <Select value={unit} onChange={(e) => setUnit(e.target.value as 'days' | 'hours' | 'minutes')}>
                  <option value="minutes">Minutes</option>
                  <option value="hours">Hours</option>
                  <option value="days">Days</option>
                </Select>
              </div>
            </div>
            <div className="sm:col-span-2">
              <Label>Email subject</Label>
              <Input value={editing.subject} onChange={(e) => setEditing({ ...editing, subject: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <Label>Message</Label>
              <Textarea
                rows={3}
                value={editing.message}
                onChange={(e) => setEditing({ ...editing, message: e.target.value })}
              />
              <p className="mt-1 text-xs text-slate-400">
                Available tokens: {'{{client_name}}'}, {'{{service_name}}'}, {'{{appointment_date}}'}, {'{{appointment_time}}'}
              </p>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button onClick={save}>Save reminder</Button>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Cancel
            </Button>
          </div>
        </Card>
      )}

      <div className="space-y-2">
        {rules.map((r) => (
          <Card key={r.id} className="flex flex-wrap items-center gap-4 p-4">
            <div className="min-w-[160px] flex-1">
              <p className="font-medium text-slate-900">{r.label}</p>
              <p className="text-xs text-slate-500">
                {minutesToValueUnit(r.offset_minutes).value} {minutesToValueUnit(r.offset_minutes).unit} before
              </p>
            </div>
            <Badge tone={r.enabled ? 'green' : 'slate'}>{r.enabled ? 'Active' : 'Paused'}</Badge>
            <div className="ml-auto flex gap-2">
              <Button variant="secondary" onClick={() => startEdit(r)}>
                Edit
              </Button>
              <Button variant="ghost" onClick={() => toggleEnabled(r)}>
                {r.enabled ? 'Pause' : 'Activate'}
              </Button>
              <Button variant="ghost" onClick={() => remove(r.id)}>
                Delete
              </Button>
            </div>
          </Card>
        ))}
        {rules.length === 0 && <p className="text-sm text-slate-500">No reminder rules yet - add one above.</p>}
      </div>

      <p className="mt-6 text-xs text-slate-400">
        Reminders are sent by the <code>send-reminders</code> scheduled function - see supabase/cron-setup.sql to
        wire up the schedule after deploying.
      </p>
    </div>
  );
}
