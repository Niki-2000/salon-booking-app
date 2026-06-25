import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useBusiness } from '../../context/BusinessContext';
import { Button, Card, Input, Label, Select } from '../ui';
import type { BusinessSettings, OpeningHour } from '../../lib/types';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function SettingsPanel() {
  const { business, openingHours, refresh } = useBusiness();
  const [form, setForm] = useState<BusinessSettings | null>(business);
  const [hours, setHours] = useState<OpeningHour[]>(openingHours);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setForm(business);
    setHours(openingHours);
  }, [business, openingHours]);

  if (!form) return null;

  function updateHour(day: number, patch: Partial<OpeningHour>) {
    setHours((prev) => prev.map((h) => (h.day_of_week === day ? { ...h, ...patch } : h)));
  }

  async function handleLogoUpload(file: File) {
    if (!form) return;
    setUploading(true);
    const path = `logo-${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from('branding').upload(path, file, { upsert: true });
    if (!error) {
      const { data } = supabase.storage.from('branding').getPublicUrl(path);
      setForm({ ...form, logo_url: data.publicUrl });
    }
    setUploading(false);
  }

  async function save() {
    if (!form) return;
    setSaving(true);
    await supabase.from('business_settings').update(form).eq('id', 1);
    for (const h of hours) {
      await supabase.from('opening_hours').upsert(h);
    }
    setSaving(false);
    refresh();
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h2 className="text-lg font-semibold text-slate-900">Settings</h2>
      <p className="text-sm text-slate-500">
        Everything here is your own branding and rules - changes apply immediately, no code or redeploy needed.
      </p>

      <Card className="p-4">
        <h3 className="mb-3 text-sm font-semibold text-slate-900">Business profile</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Business name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <Label>Currency</Label>
            <Select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
              <option value="GBP">GBP (£)</option>
              <option value="EUR">EUR (€)</option>
              <option value="USD">USD ($)</option>
              <option value="AUD">AUD (A$)</option>
              <option value="CAD">CAD (C$)</option>
            </Select>
          </div>
          <div>
            <Label>Phone</Label>
            <Input value={form.phone ?? ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <Label>Email</Label>
            <Input value={form.email ?? ''} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <Label>Address</Label>
            <Input value={form.address ?? ''} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="mb-3 text-sm font-semibold text-slate-900">Branding</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Primary colour</Label>
            <Input type="color" value={form.primary_color} onChange={(e) => setForm({ ...form, primary_color: e.target.value })} />
          </div>
          <div>
            <Label>Secondary colour</Label>
            <Input type="color" value={form.secondary_color} onChange={(e) => setForm({ ...form, secondary_color: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <Label>Logo</Label>
            <div className="flex items-center gap-3">
              {form.logo_url && <img src={form.logo_url} alt="Logo" className="h-10 w-10 rounded object-cover" />}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0])}
                className="text-sm"
              />
              {uploading && <span className="text-xs text-slate-400">Uploading...</span>}
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Requires a public "branding" storage bucket in Supabase (Storage &gt; New bucket &gt; Public).
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="mb-3 text-sm font-semibold text-slate-900">Booking rules</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Minimum notice (minutes)</Label>
            <Input
              type="number"
              value={form.min_lead_minutes}
              onChange={(e) => setForm({ ...form, min_lead_minutes: Number(e.target.value) })}
            />
          </div>
          <div>
            <Label>Buffer between appointments (minutes)</Label>
            <Input
              type="number"
              value={form.booking_buffer_minutes}
              onChange={(e) => setForm({ ...form, booking_buffer_minutes: Number(e.target.value) })}
            />
          </div>
          <div>
            <Label>Slot interval (minutes)</Label>
            <Input
              type="number"
              value={form.slot_interval_minutes}
              onChange={(e) => setForm({ ...form, slot_interval_minutes: Number(e.target.value) })}
            />
          </div>
          <div>
            <Label>How far ahead clients can book (days)</Label>
            <Input
              type="number"
              value={form.booking_horizon_days}
              onChange={(e) => setForm({ ...form, booking_horizon_days: Number(e.target.value) })}
            />
          </div>
          <div>
            <Label>Cancellation window (hours)</Label>
            <Input
              type="number"
              value={form.cancellation_window_hours}
              onChange={(e) => setForm({ ...form, cancellation_window_hours: Number(e.target.value) })}
            />
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="mb-3 text-sm font-semibold text-slate-900">Opening hours</h3>
        <div className="space-y-2">
          {hours
            .slice()
            .sort((a, b) => a.day_of_week - b.day_of_week)
            .map((h) => (
              <div key={h.day_of_week} className="flex items-center gap-3 text-sm">
                <span className="w-24 text-slate-600">{DAY_NAMES[h.day_of_week]}</span>
                <label className="flex items-center gap-1 text-xs text-slate-500">
                  <input
                    type="checkbox"
                    checked={h.is_closed}
                    onChange={(e) => updateHour(h.day_of_week, { is_closed: e.target.checked })}
                  />
                  Closed
                </label>
                {!h.is_closed && (
                  <>
                    <Input
                      type="time"
                      className="w-32"
                      value={h.open_time.slice(0, 5)}
                      onChange={(e) => updateHour(h.day_of_week, { open_time: e.target.value })}
                    />
                    <span className="text-slate-400">to</span>
                    <Input
                      type="time"
                      className="w-32"
                      value={h.close_time.slice(0, 5)}
                      onChange={(e) => updateHour(h.day_of_week, { close_time: e.target.value })}
                    />
                  </>
                )}
              </div>
            ))}
        </div>
      </Card>

      <Button onClick={save} disabled={saving}>
        {saving ? 'Saving...' : 'Save settings'}
      </Button>
    </div>
  );
}
