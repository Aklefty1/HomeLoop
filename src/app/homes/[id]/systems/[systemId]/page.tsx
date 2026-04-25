'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useParams } from 'next/navigation';
import AppShell from '@/components/AppShell';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Clock, AlertTriangle, DollarSign, Loader2 } from 'lucide-react';
import type { HomeSystem, MaintenanceTask } from '@/types/database';
import {
  SYSTEM_TYPE_LABELS,
  getSystemAge,
  isNearingEndOfLife,
  DEFAULT_LIFESPAN,
} from '@/lib/maintenance-rules';

export default function SystemDetailPage() {
  const params = useParams();
  const homeId = params.id as string;
  const systemId = params.systemId as string;

  const [system, setSystem] = useState<HomeSystem | null>(null);
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [costEstimate, setCostEstimate] = useState<string | null>(null);
  const [costLoading, setCostLoading] = useState(false);
  const [costType, setCostType] = useState<'repair' | 'replace' | 'service' | null>(null);

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();
      const [sysRes, tasksRes] = await Promise.all([
        supabase.from('systems').select('*').eq('id', systemId).single(),
        supabase
          .from('maintenance_tasks')
          .select('*')
          .eq('system_id', systemId)
          .order('due_date', { ascending: true }),
      ]);
      setSystem(sysRes.data);
      setTasks(tasksRes.data || []);
      setLoading(false);
    }
    fetchData();
  }, [systemId]);

  async function completeTask(taskId: string) {
    const supabase = createClient();
    await supabase
      .from('maintenance_tasks')
      .update({
        status: 'completed',
        completed_date: new Date().toISOString().split('T')[0],
      })
      .eq('id', taskId);

    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, status: 'completed' as const, completed_date: new Date().toISOString().split('T')[0] }
          : t
      )
    );
  }

  if (loading) {
    return (
      <AppShell>
        <div className="text-sm text-neutral-500">Loading...</div>
      </AppShell>
    );
  }

  if (!system) {
    return (
      <AppShell>
        <p className="text-neutral-500">System not found.</p>
      </AppShell>
    );
  }

  const age = getSystemAge(system.install_date);
  const nearEnd = isNearingEndOfLife(
    system.install_date,
    system.lifespan_years,
    system.system_type as any
  );

  const pendingTasks = tasks.filter((t) => t.status !== 'completed');
  const completedTasks = tasks.filter((t) => t.status === 'completed');

  return (
    <AppShell>
      <Link
        href={`/homes/${homeId}`}
        className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 mb-4"
      >
        <ArrowLeft size={16} />
        Back to home
      </Link>

      <div className="mb-8">
        <h1 className="text-xl font-bold">{system.name}</h1>
        <p className="text-sm text-neutral-500 mt-1">
          {SYSTEM_TYPE_LABELS[system.system_type as keyof typeof SYSTEM_TYPE_LABELS]}
          {system.manufacturer ? ` — ${system.manufacturer}` : ''}
          {system.model ? ` ${system.model}` : ''}
        </p>
      </div>

      {/* System info cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <div className="border border-neutral-200 rounded-lg p-3 bg-white">
          <p className="text-xs text-neutral-400">Condition</p>
          <p className="text-sm font-medium capitalize mt-0.5">{system.condition}</p>
        </div>
        <div className="border border-neutral-200 rounded-lg p-3 bg-white">
          <p className="text-xs text-neutral-400">Age</p>
          <p className={`text-sm font-medium mt-0.5 ${nearEnd ? 'text-red-500' : ''}`}>
            {age !== null ? `${age} years` : '—'}
          </p>
        </div>
        <div className="border border-neutral-200 rounded-lg p-3 bg-white">
          <p className="text-xs text-neutral-400">Lifespan</p>
          <p className="text-sm font-medium mt-0.5">
            {system.lifespan_years || DEFAULT_LIFESPAN[system.system_type as keyof typeof DEFAULT_LIFESPAN] || '—'} years
          </p>
        </div>
        <div className="border border-neutral-200 rounded-lg p-3 bg-white">
          <p className="text-xs text-neutral-400">Last Service</p>
          <p className="text-sm font-medium mt-0.5">
            {system.last_service_date
              ? new Date(system.last_service_date).toLocaleDateString()
              : '—'}
          </p>
        </div>
      </div>

      {nearEnd && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-6 flex items-center gap-2">
          <AlertTriangle size={18} className="text-red-500 shrink-0" />
          <span className="text-sm text-red-700 font-medium">
            This system is nearing end of life. Consider planning for replacement.
          </span>
        </div>
      )}

      {/* AI Cost Estimate */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Cost Estimates</h2>
        <div className="flex gap-2 mb-3">
          {(['service', 'repair', 'replace'] as const).map((type) => (
            <button
              key={type}
              onClick={async () => {
                setCostType(type);
                setCostLoading(true);
                setCostEstimate(null);
                try {
                  const res = await fetch('/api/ai/cost-estimate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ systemId, estimateType: type }),
                  });
                  const data = await res.json();
                  setCostEstimate(data.estimate || 'Unable to estimate.');
                } catch {
                  setCostEstimate('Unable to load estimate. Check your OpenAI API key.');
                }
                setCostLoading(false);
              }}
              disabled={costLoading}
              className={`flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border transition-colors capitalize disabled:opacity-50 ${
                costType === type
                  ? 'bg-neutral-900 text-white border-neutral-900'
                  : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400'
              }`}
            >
              <DollarSign size={13} />
              {type}
            </button>
          ))}
        </div>
        {costLoading ? (
          <div className="border border-neutral-200 rounded-xl p-6 bg-white flex items-center justify-center gap-2">
            <Loader2 size={16} className="animate-spin text-neutral-400" />
            <span className="text-sm text-neutral-400">Estimating costs...</span>
          </div>
        ) : costEstimate ? (
          <div className="border border-neutral-200 rounded-xl p-4 bg-white">
            {costEstimate.split('\n').map((line, i) => (
              <p key={i} className={`text-sm text-neutral-700 ${i > 0 ? 'mt-2' : ''}`}>
                {line}
              </p>
            ))}
          </div>
        ) : (
          <p className="text-xs text-neutral-400">
            Select service, repair, or replace to get an AI-powered cost estimate for the Atlanta area.
          </p>
        )}
      </div>

      {/* Pending tasks */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Upcoming Maintenance</h2>
        {pendingTasks.length === 0 ? (
          <p className="text-sm text-neutral-400">No pending tasks.</p>
        ) : (
          <div className="space-y-2">
            {pendingTasks.map((task) => {
              const isOverdue =
                task.due_date && new Date(task.due_date) < new Date();
              return (
                <div
                  key={task.id}
                  className={`border rounded-lg p-3 flex items-center justify-between ${
                    isOverdue ? 'border-red-200 bg-red-50' : 'border-neutral-200 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {isOverdue ? (
                      <AlertTriangle size={16} className="text-red-500 shrink-0" />
                    ) : (
                      <Clock size={16} className="text-neutral-400 shrink-0" />
                    )}
                    <div>
                      <p className="text-sm font-medium">{task.title}</p>
                      <p className={`text-xs ${isOverdue ? 'text-red-500' : 'text-neutral-400'}`}>
                        {task.due_date
                          ? `Due ${new Date(task.due_date).toLocaleDateString()}`
                          : 'No due date'}
                        {task.frequency_months
                          ? ` · Every ${task.frequency_months} months`
                          : ''}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => completeTask(task.id)}
                    className="text-xs font-medium text-neutral-600 hover:text-green-600 border border-neutral-200 hover:border-green-200 px-3 py-1 rounded-lg transition-colors"
                  >
                    Complete
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Completed tasks */}
      {completedTasks.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Completed</h2>
          <div className="space-y-2">
            {completedTasks.map((task) => (
              <div
                key={task.id}
                className="border border-neutral-100 rounded-lg p-3 flex items-center gap-3 bg-neutral-50"
              >
                <CheckCircle2 size={16} className="text-green-500 shrink-0" />
                <div>
                  <p className="text-sm text-neutral-500 line-through">{task.title}</p>
                  <p className="text-xs text-neutral-400">
                    Completed{' '}
                    {task.completed_date
                      ? new Date(task.completed_date).toLocaleDateString()
                      : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </AppShell>
  );
}
