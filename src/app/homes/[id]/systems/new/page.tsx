'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useParams } from 'next/navigation';
import AppShell from '@/components/AppShell';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import {
  SYSTEM_TYPE_LABELS,
  DEFAULT_LIFESPAN,
  getRulesForSystem,
  calculateNextDueDate,
} from '@/lib/maintenance-rules';
import type { SystemType } from '@/types/database';

export default function NewSystemPage() {
  const router = useRouter();
  const params = useParams();
  const homeId = params.id as string;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedType, setSelectedType] = useState<SystemType>('hvac');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const form = new FormData(e.currentTarget);
    const supabase = createClient();
    const systemType = form.get('system_type') as SystemType;
    const installDate = form.get('install_date') as string || null;
    const lastServiceDate = form.get('last_service_date') as string || null;

    // 1. Insert the system
    const { data: system, error: sysError } = await supabase
      .from('systems')
      .insert({
        home_id: homeId,
        name: form.get('name') as string,
        system_type: systemType,
        manufacturer: form.get('manufacturer') as string || null,
        model: form.get('model') as string || null,
        install_date: installDate,
        last_service_date: lastServiceDate,
        lifespan_years: form.get('lifespan_years')
          ? Number(form.get('lifespan_years'))
          : DEFAULT_LIFESPAN[systemType] || null,
        condition: form.get('condition') as string,
        notes: form.get('notes') as string || null,
      })
      .select()
      .single();

    if (sysError) {
      setError(sysError.message);
      setLoading(false);
      return;
    }

    // 2. Auto-generate maintenance tasks based on rules
    const rules = getRulesForSystem(systemType);
    if (rules.length > 0) {
      const tasksToInsert = rules.map((rule) => ({
        home_id: homeId,
        system_id: system.id,
        title: rule.title,
        description: rule.description,
        frequency_months: rule.frequency_months,
        due_date: calculateNextDueDate(rule.frequency_months, lastServiceDate, installDate),
        status: 'pending' as const,
        priority: rule.priority,
        is_auto_generated: true,
      }));

      await supabase.from('maintenance_tasks').insert(tasksToInsert);
    }

    router.push(`/homes/${homeId}`);
  }

  const inputClass =
    'w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent';

  return (
    <AppShell>
      <Link
        href={`/homes/${homeId}`}
        className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 mb-4"
      >
        <ArrowLeft size={16} />
        Back to home
      </Link>

      <h1 className="text-xl font-bold mb-6">Add a System</h1>

      <form onSubmit={handleSubmit} className="max-w-lg space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">System Type *</label>
          <select
            name="system_type"
            className={inputClass}
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as SystemType)}
          >
            {Object.entries(SYSTEM_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Name *</label>
          <input
            name="name"
            required
            placeholder={`e.g. ${SYSTEM_TYPE_LABELS[selectedType]} — Main Unit`}
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Manufacturer</label>
            <input name="manufacturer" placeholder="e.g. Carrier" className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Model</label>
            <input name="model" placeholder="e.g. 24ACC636" className={inputClass} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Install Date</label>
            <input name="install_date" type="date" className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Last Service Date</label>
            <input name="last_service_date" type="date" className={inputClass} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">
              Lifespan (years)
            </label>
            <input
              name="lifespan_years"
              type="number"
              min={1}
              max={100}
              placeholder={DEFAULT_LIFESPAN[selectedType]?.toString() || '—'}
              className={inputClass}
            />
            {DEFAULT_LIFESPAN[selectedType] && (
              <p className="text-xs text-neutral-400 mt-1">
                Default: {DEFAULT_LIFESPAN[selectedType]} years
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Condition</label>
            <select name="condition" className={inputClass} defaultValue="good">
              <option value="excellent">Excellent</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="poor">Poor</option>
              <option value="unknown">Unknown</option>
            </select>
          </div>
        </div>

        {/* Preview what tasks will be auto-created */}
        {getRulesForSystem(selectedType).length > 0 && (
          <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
            <p className="text-xs font-medium text-neutral-600 mb-2">
              Auto-generated maintenance tasks:
            </p>
            <ul className="space-y-1">
              {getRulesForSystem(selectedType).map((rule, i) => (
                <li key={i} className="text-xs text-neutral-500">
                  • {rule.title} — every {rule.frequency_months} months
                </li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">Notes</label>
          <textarea
            name="notes"
            rows={3}
            placeholder="Any additional details..."
            className={inputClass}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-neutral-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Add System'}
        </button>
      </form>
    </AppShell>
  );
}
