'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useParams } from 'next/navigation';
import AppShell from '@/components/AppShell';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  Users,
  Bot,
} from 'lucide-react';
import type { Home, HomeSystem, MaintenanceTask, Document, Vendor } from '@/types/database';
import {
  SYSTEM_TYPE_LABELS,
  getSystemAge,
  isNearingEndOfLife,
} from '@/lib/maintenance-rules';

export default function HomeDetailPage() {
  const params = useParams();
  const homeId = params.id as string;

  const [home, setHome] = useState<Home | null>(null);
  const [systems, setSystems] = useState<HomeSystem[]>([]);
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [docCount, setDocCount] = useState(0);
  const [vendorCount, setVendorCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();

      const [homeRes, systemsRes, tasksRes, docsRes, vendorsRes] = await Promise.all([
        supabase.from('homes').select('*').eq('id', homeId).single(),
        supabase.from('systems').select('*').eq('home_id', homeId).order('created_at'),
        supabase
          .from('maintenance_tasks')
          .select('*')
          .eq('home_id', homeId)
          .neq('status', 'completed')
          .order('due_date', { ascending: true }),
        supabase.from('documents').select('id', { count: 'exact', head: true }).eq('home_id', homeId),
        supabase.from('vendors').select('id', { count: 'exact', head: true }).eq('home_id', homeId),
      ]);

      setHome(homeRes.data);
      setSystems(systemsRes.data || []);
      setTasks(tasksRes.data || []);
      setDocCount(docsRes.count || 0);
      setVendorCount(vendorsRes.count || 0);
      setLoading(false);
    }
    fetchData();
  }, [homeId]);

  if (loading) {
    return (
      <AppShell>
        <div className="text-sm text-neutral-500">Loading...</div>
      </AppShell>
    );
  }

  if (!home) {
    return (
      <AppShell>
        <p className="text-neutral-500">Home not found.</p>
      </AppShell>
    );
  }

  const overdueTasks = tasks.filter(
    (t) => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed'
  );
  const upcomingTasks = tasks.filter(
    (t) => t.due_date && new Date(t.due_date) >= new Date()
  );

  const conditionColors: Record<string, string> = {
    excellent: 'text-green-600 bg-green-50',
    good: 'text-blue-600 bg-blue-50',
    fair: 'text-amber-600 bg-amber-50',
    poor: 'text-red-600 bg-red-50',
    unknown: 'text-neutral-500 bg-neutral-100',
  };

  return (
    <AppShell>
      <Link
        href="/homes"
        className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 mb-4"
      >
        <ArrowLeft size={16} />
        Back to homes
      </Link>

      {/* Home header */}
      <div className="mb-8">
        <h1 className="text-xl font-bold">{home.name}</h1>
        <p className="text-sm text-neutral-500 mt-1">
          {home.address}{home.city ? `, ${home.city}` : ''}{home.state ? ` ${home.state}` : ''} {home.zip}
        </p>
        <div className="flex gap-4 mt-2 text-sm text-neutral-400">
          {home.year_built && <span>Built {home.year_built}</span>}
          {home.square_feet && <span>{home.square_feet.toLocaleString()} sqft</span>}
          {home.bedrooms && <span>{home.bedrooms} bed</span>}
          {home.bathrooms && <span>{home.bathrooms} bath</span>}
          {home.home_type && (
            <span className="capitalize">{home.home_type.replace('_', ' ')}</span>
          )}
        </div>
      </div>

      {/* Alert bar for overdue */}
      {overdueTasks.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-6 flex items-center gap-2">
          <AlertTriangle size={18} className="text-red-500 shrink-0" />
          <span className="text-sm text-red-700 font-medium">
            {overdueTasks.length} overdue task{overdueTasks.length > 1 ? 's' : ''} need attention
          </span>
        </div>
      )}

      {/* Systems section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Systems</h2>
          <Link
            href={`/homes/${homeId}/systems/new`}
            className="flex items-center gap-1.5 text-sm font-medium text-neutral-600 hover:text-neutral-900"
          >
            <Plus size={16} />
            Add System
          </Link>
        </div>

        {systems.length === 0 ? (
          <div className="border border-dashed border-neutral-300 rounded-xl p-8 text-center">
            <Wrench size={28} className="mx-auto text-neutral-400 mb-2" />
            <p className="text-sm text-neutral-500">
              No systems added yet. Add your HVAC, roof, water heater, and more.
            </p>
            <Link
              href={`/homes/${homeId}/systems/new`}
              className="inline-flex items-center gap-1.5 bg-neutral-900 text-white px-4 py-2 rounded-lg text-sm font-medium mt-3 hover:bg-neutral-800 transition-colors"
            >
              <Plus size={16} />
              Add First System
            </Link>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {systems.map((sys) => {
              const age = getSystemAge(sys.install_date);
              const nearEnd = isNearingEndOfLife(sys.install_date, sys.lifespan_years, sys.system_type as any);
              return (
                <Link
                  key={sys.id}
                  href={`/homes/${homeId}/systems/${sys.id}`}
                  className="border border-neutral-200 rounded-xl p-4 hover:border-neutral-400 transition-colors bg-white"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-sm">{sys.name}</h3>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        {SYSTEM_TYPE_LABELS[sys.system_type as keyof typeof SYSTEM_TYPE_LABELS] || sys.system_type}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                        conditionColors[sys.condition] || conditionColors.unknown
                      }`}
                    >
                      {sys.condition}
                    </span>
                  </div>
                  {age !== null && (
                    <p className={`text-xs mt-2 ${nearEnd ? 'text-red-500 font-medium' : 'text-neutral-400'}`}>
                      {nearEnd ? '⚠ ' : ''}
                      {age} years old
                      {sys.lifespan_years ? ` / ${sys.lifespan_years} yr lifespan` : ''}
                    </p>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Tasks section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Maintenance Tasks</h2>
          <Link
            href={`/homes/${homeId}/tasks`}
            className="text-sm font-medium text-neutral-600 hover:text-neutral-900"
          >
            View All →
          </Link>
        </div>

        {tasks.length === 0 ? (
          <p className="text-sm text-neutral-400">
            No upcoming tasks. Add systems to auto-generate maintenance schedules.
          </p>
        ) : (
          <div className="space-y-2">
            {tasks.slice(0, 5).map((task) => {
              const isOverdue =
                task.due_date && new Date(task.due_date) < new Date();
              return (
                <div
                  key={task.id}
                  className={`border rounded-lg p-3 flex items-center justify-between ${
                    isOverdue
                      ? 'border-red-200 bg-red-50'
                      : 'border-neutral-200 bg-white'
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
                      {task.due_date && (
                        <p className={`text-xs ${isOverdue ? 'text-red-500' : 'text-neutral-400'}`}>
                          Due {new Date(task.due_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                      task.priority === 'high' || task.priority === 'urgent'
                        ? 'text-red-600 bg-red-50'
                        : task.priority === 'medium'
                        ? 'text-amber-600 bg-amber-50'
                        : 'text-neutral-500 bg-neutral-100'
                    }`}
                  >
                    {task.priority}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Documents, Vendors, & AI Assistant quick links */}
      <div className="grid grid-cols-3 gap-3 mt-8">
        <Link
          href={`/homes/${homeId}/documents`}
          className="border border-neutral-200 rounded-xl p-5 hover:border-neutral-400 transition-colors bg-white"
        >
          <div className="flex items-center gap-3">
            <FileText size={20} className="text-neutral-400" />
            <div>
              <h3 className="font-semibold text-sm">Documents</h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                {docCount} file{docCount !== 1 ? 's' : ''} stored
              </p>
            </div>
          </div>
        </Link>
        <Link
          href={`/homes/${homeId}/vendors`}
          className="border border-neutral-200 rounded-xl p-5 hover:border-neutral-400 transition-colors bg-white"
        >
          <div className="flex items-center gap-3">
            <Users size={20} className="text-neutral-400" />
            <div>
              <h3 className="font-semibold text-sm">Vendors</h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                {vendorCount} vendor{vendorCount !== 1 ? 's' : ''} saved
              </p>
            </div>
          </div>
        </Link>
        <Link
          href={`/homes/${homeId}/assistant`}
          className="border border-neutral-200 rounded-xl p-5 hover:border-neutral-400 transition-colors bg-white"
        >
          <div className="flex items-center gap-3">
            <Bot size={20} className="text-neutral-400" />
            <div>
              <h3 className="font-semibold text-sm">AI Assistant</h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Ask anything
              </p>
            </div>
          </div>
        </Link>
      </div>
    </AppShell>
  );
}
