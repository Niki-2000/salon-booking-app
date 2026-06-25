import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useBusiness } from '../../context/BusinessContext';
import { Badge, Button, Card, Input, Label, Select, Textarea } from '../ui';
import { formatMoney } from '../../lib/format';
import type { PaymentType, Service } from '../../lib/types';

const emptyService: Omit<Service, 'id'> = {
  name: '',
  description: '',
  duration_minutes: 30,
  price: 0,
  payment_type: 'none',
  deposit_amount: null,
  deposit_is_percent: false,
  color: '#7c3aed',
  active: true,
  sort_order: 0,
};

export default function ServicesManager() {
  const { business, refresh } = useBusiness();
  const [services, setServices] = useState<Service[]>([]);
  const [editing, setEditing] = useState<Service | (typeof emptyService & { id?: undefined }) | null>(null);

  async function load() {
    const { data } = await supabase.from('services').select('*').order('sort_order');
    setServices(data ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function save() {
    if (!editing) return;
    if (editing.id) {
      await supabase.from('services').update(editing).eq('id', editing.id);
    } else {
      const { id, ...rest } = editing;
      await supabase.from('services').insert(rest);
    }
    setEditing(null);
    load();
    refresh();
  }

  async function toggleActive(service: Service) {
    await supabase.from('services').update({ active: !service.active }).eq('id', service.id);
    load();
    refresh();
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Services</h2>
        <Button onClick={() => setEditing({ ...emptyService })}>Add service</Button>
      </div>

      {editing && (
        <Card className="mb-5 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Name</Label>
              <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            </div>
            <div>
              <Label>Duration (minutes)</Label>
              <Input
                type="number"
                value={editing.duration_minutes}
                onChange={(e) => setEditing({ ...editing, duration_minutes: Number(e.target.value) })}
              />
            </div>
            <div className="sm:col-span-2">
              <Label>Description</Label>
              <Textarea value={editing.description ?? ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
            </div>
            <div>
              <Label>Price ({business?.currency})</Label>
              <Input
                type="number"
                step="0.01"
                value={editing.price}
                onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label>Payment</Label>
              <Select
                value={editing.payment_type}
                onChange={(e) => setEditing({ ...editing, payment_type: e.target.value as PaymentType })}
              >
                <option value="none">Pay at appointment</option>
                <option value="deposit">Deposit online</option>
                <option value="full">Full payment online</option>
              </Select>
            </div>
            {editing.payment_type === 'deposit' && (
              <>
                <div>
                  <Label>Deposit amount</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editing.deposit_amount ?? ''}
                    onChange={(e) => setEditing({ ...editing, deposit_amount: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Deposit type</Label>
                  <Select
                    value={editing.deposit_is_percent ? 'percent' : 'fixed'}
                    onChange={(e) => setEditing({ ...editing, deposit_is_percent: e.target.value === 'percent' })}
                  >
                    <option value="fixed">Fixed amount</option>
                    <option value="percent">Percent of price</option>
                  </Select>
                </div>
              </>
            )}
            <div>
              <Label>Colour</Label>
              <Input type="color" value={editing.color ?? '#7c3aed'} onChange={(e) => setEditing({ ...editing, color: e.target.value })} />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button onClick={save}>Save service</Button>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Cancel
            </Button>
          </div>
        </Card>
      )}

      <div className="space-y-2">
        {services.map((s) => (
          <Card key={s.id} className="flex flex-wrap items-center gap-4 p-4">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: s.color ?? '#7c3aed' }} />
            <div className="min-w-[140px] flex-1">
              <p className="font-medium text-slate-900">{s.name}</p>
              <p className="text-xs text-slate-500">{s.duration_minutes} min</p>
            </div>
            <p className="text-sm text-slate-700">{formatMoney(s.price, business?.currency)}</p>
            <Badge tone={s.payment_type === 'none' ? 'green' : s.payment_type === 'deposit' ? 'amber' : 'blue'}>
              {s.payment_type === 'none' ? 'Pay at appointment' : s.payment_type === 'deposit' ? 'Deposit' : 'Full payment'}
            </Badge>
            {!s.active && <Badge tone="slate">Inactive</Badge>}
            <div className="ml-auto flex gap-2">
              <Button variant="secondary" onClick={() => setEditing(s)}>
                Edit
              </Button>
              <Button variant="ghost" onClick={() => toggleActive(s)}>
                {s.active ? 'Deactivate' : 'Activate'}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
