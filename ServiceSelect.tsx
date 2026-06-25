import { Card, Badge } from '../ui';
import { formatMoney, amountDueForService } from '../../lib/format';
import type { Service } from '../../lib/types';

export default function ServiceSelect({
  services,
  currency,
  onSelect,
}: {
  services: Service[];
  currency: string;
  onSelect: (service: Service) => void;
}) {
  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold text-slate-900">Choose a service</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {services.map((service) => {
          const due = amountDueForService(service);
          return (
            <Card
              key={service.id}
              className="cursor-pointer p-4 transition hover:border-brand-primary hover:shadow-md"
            >
              <button onClick={() => onSelect(service)} className="w-full text-left">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-slate-900">{service.name}</p>
                    {service.description && <p className="mt-0.5 text-sm text-slate-500">{service.description}</p>}
                  </div>
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: service.color ?? '#7c3aed' }} />
                </div>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-slate-500">{service.duration_minutes} min</span>
                  <span className="font-semibold text-slate-900">{formatMoney(service.price, currency)}</span>
                </div>
                <div className="mt-2">
                  {service.payment_type === 'full' && <Badge tone="blue">Pay in full to book</Badge>}
                  {service.payment_type === 'deposit' && <Badge tone="amber">{formatMoney(due, currency)} deposit</Badge>}
                  {service.payment_type === 'none' && <Badge tone="green">Pay at appointment</Badge>}
                </div>
              </button>
            </Card>
          );
        })}
        {services.length === 0 && (
          <p className="text-sm text-slate-500">No services are available to book online yet.</p>
        )}
      </div>
    </div>
  );
}
