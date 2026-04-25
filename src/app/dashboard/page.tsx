'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import AppShell from '@/components/AppShell';
import Link from 'next/link';
import {
  Home as HomeIcon,
  Wrench,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Plus,
  ArrowRight,
  FileText,
  Users,
  Bot,
  Sparkles,
  Loader2,
} from 'lucide-react';
import type { Home, HomeSystem, MaintenanceTask } from '@/types/database';
import { isNearingEndOfLife } from '@/lib/maintenance-rules';

export default function DashboardPage() {
  const [homes, setHomes] = useState<Home[]>([]);
  const [systems, setSystems] = useState<HomeSystem[]>([]);
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [docCount, setDocCount] = useState(0);
  const [vendorCount, setVendorCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [aiTips, setAiTips] = useState<string | null>(null);
  const [aiTipsLoading, setAiTipsLoading] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();
      const [homesRes, systemsRes, tasksRes, docsRes, vendorsRes] = await Promise.all([
        supabase.from('homes').select('*').order('created_at'),
        supabase.from('systems').select('*'),
        supabase
          .from('maintenance_tasks')
          .select('*')
          .neq('status', 'completed')
          .order('due_date', { ascending: true }),
        supabase.from('documents').select('id', { count: 'exact', head: true }),
        supabase.from('vendors').select('id', { count: 'exact', head: true }),
      ]);
      setHomes(homesRes.data || []);
      setSystems(systemsRes.data || []);
      setTasks(tasksRes.data || []);
      setDocCount(docsRes.count || 0);
      setVendorCount(vendorsRes.count || 0);
      setLoading(false);
    }
    fetchData();
  }, []);

  async function completeTask(taskId: string) {
    const supabase = createClient();
    await supabase
      .from('maintenance_tasks')
      .update({
        status: 'completed',
        completed_date: new Date().toISOString().split('T')[0],
      })
      .eq('id', taskId);
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  }

  if (loading) {
    return (
      <AppShell>
        <div className="text-sm text-neutral-500">Loading...</div>
      </AppShell>
    );
  }

  // ── Computed metrics ────────────────────────────────
  const now = new Date();
  const overdueTasks = tasks.filter(
    (t) => t.due_date && new Date(t.due_date) < now
  );
  const next30Days = tasks.filter((t) => {
    if (!t.due_date) return false;
    const d = new Date(t.due_date);
    return d >= now && d <= new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  });
  const agingSystems = systems.filter((s) =>
    isNearingEndOfLife(s.install_date, s.lifespan_years, s.system_type as any)
  );

  // ── Empty state ─────────────────────────────────────
  if (homes.length === 0) {
    return (
      <AppShell>
        <h1 className="text-xl font-bold mb-6">Dashboard</h1>
        <div className="border border-dashed border-neutral-300 rounded-xl p-12 text-center">
          <HomeIcon size={36} className="mx-auto text-neutral-400 mb-3" />
          <p className="text-neutral-600 font-medium text-lg">Welcome to HomeLoop</p>
          <p className="text-sm text-neutral-400 mt-1 max-w-sm mx-auto">
            Add your first home to start tracking systems, maintenance, and more.
          </p>
          <Link
            href="/homes/new"
            className="inline-flex items-center gap-2 bg-neutral-900 text-white px-5 py-2.5 rounded-lg text-sm font-medium mt-5 hover:bg-neutral-800 transition-colors"
          >
            <Plus size={16} />
            Add Your Home
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <h1 className="text-xl font-bold mb-6">Dashboard</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-8">
        <div className="border border-neutral-200 rounded-xl p-4 bg-white">
          <div className="flex items-center gap-2 text-neutral-400 mb-1">
            <HomeIcon size={16} />
            <span className="text-xs font-medium">Homes</span>
          </div>
          <p className="text-2xl font-bold">{homes.length}</p>
        </div>
        <div className="border border-neutral-200 rounded-xl p-4 bg-white">
          <div className="flex items-center gap-2 text-neutral-400 mb-1">
            <Wrench size={16} />
            <span className="text-xs font-medium">Systems</span>
          </div>
          <p className="text-2xl font-bold">{systems.length}</p>
        </div>
        <div className={`border rounded-xl p-4 ${overdueTasks.length > 0 ? 'border-red-200 bg-red-50' : 'border-neutral-200 bg-white'}`}>
          <div className="flex items-center gap-2 text-neutral-400 mb-1">
            <AlertTriangle size={16} className={overdueTasks.length > 0 ? 'text-red-400' : ''} />
            <span className="text-xs font-medium">Overdue</span>
          </div>
          <p className={`text-2xl font-bold ${overdueTasks.length > 0 ? 'text-red-600' : ''}`}>
            {overdueTasks.length}
          </p>
        </div>
        <div className="border border-neutral-200 rounded-xl p-4 bg-white">
          <div className="flex items-center gap-2 text-neutral-400 mb-1">
            <Clock size={16} />
            <span className="text-xs font-medium">Next 30 Days</span>
          </div>
          <p className="text-2xl font-bold">{next30Days.length}</p>
        </div>
        <div className="border border-neutral-200 rounded-xl p-4 bg-white">
          <div className="flex items-center gap-2 text-neutral-400 mb-1">
            <FileText size={16} />
            <span className="text-xs font-medium">Documents</span>
          </div>
          <p className="text-2xl font-bold">{docCount}</p>
        </div>
        <div className="border border-neutral-200 rounded-xl p-4 bg-white">
          <div className="flex items-center gap-2 text-neutral-400 mb-1">
            <Users size={16} />
            <span className="text-xs font-medium">Vendors</span>
          </div>
          <p className="text-2xl font-bold">{vendorCount}</p>
        </div>
      </div>

      {/* Aging systems alert */}
      {agingSystems.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6">
          <p className="text-sm text-amber-700 font-medium">
            {agingSystems.length} system{agingSystems.length > 1 ? 's' : ''} nearing end of life
          </p>
          <p className="text-xs text-amber-600 mt-1">
            {agingSystems.map((s) => s.name).join(', ')}
          </p>
        </div>
      )}

      {/* What needs attention now */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-3">What Needs Attention</h2>
        {overdueTasks.length === 0 && next30Days.length === 0 ? (
          <div className="border border-green-200 bg-green-50 rounded-xl p-6 text-center">
            <CheckCircle2 size={28} className="mx-auto text-green-500 mb-2" />
            <p className="text-sm text-green-700 font-medium">You&apos;re all caught up!</p>
            <p className="text-xs text-green-600 mt-1">No overdue or upcoming tasks.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {[...overdueTasks, ...next30Days].slice(0, 8).map((task) => {
              const isOverdue =
                task.due_date && new Date(task.due_date) < now;
              const home = homes.find((h) => h.id === task.home_id);
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
                      <p className={`text-xs ${isOverdue ? 'text-red-500' : 'text-neutral-400'}`}>
                        {home?.name || 'Home'} ·{' '}
                        {task.due_date
                          ? `Due ${new Date(task.due_date).toLocaleDateString()}`
                          : 'No due date'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => completeTask(task.id)}
                    className="text-xs font-medium text-neutral-600 hover:text-green-600 border border-neutral-200 hover:border-green-200 px-3 py-1 rounded-lg transition-colors shrink-0"
                  >
                    Done
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* AI Smart Tips */}
      {homes.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-amber-500" />
              <h2 className="text-lg font-semibold">Smart Tips</h2>
            </div>
            {!aiTips && !aiTipsLoading && (
              <button
                onClick={async () => {
                  setAiTipsLoading(true);
                  try {
                    const res = await fetch(`/api/ai/tips?homeId=${homes[0].id}`);
                    const data = await res.json();
                    setAiTips(data.tips || 'No tips available.');
                  } catch {
                    setAiTips('Unable to load tips. Make sure your OpenAI API key is configured.');
                  }
                  setAiTipsLoading(false);
                }}
                className="text-xs font-medium text-neutral-600 hover:text-neutral-900 border border-neutral-200 hover:border-neutral-400 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Bot size={14} />
                Get AI Tips
              </button>
            )}
          </div>
          {aiTipsLoading ? (
            <div className="border border-neutral-200 rounded-xl p-6 bg-white flex items-center justify-center gap-2">
              <Loader2 size={16} className="animate-spin text-neutral-400" />
              <span className="text-sm text-neutral-400">Analyzing your home...</span>
            </div>
          ) : aiTips ? (
            <div className="border border-amber-200 bg-amber-50 rounded-xl p-4">
              {aiTips.split('\n').map((line, i) => (
                <p key={i} className={`text-sm text-amber-900 ${i > 0 ? 'mt-2' : ''}`}>
                  {line}
                </p>
              ))}
            </div>
          ) : (
            <p className="text-xs text-neutral-400">
              Click &quot;Get AI Tips&quot; for personalized maintenance recommendations.
            </p>
          )}
        </div>
      )}

      {/* Homes quick nav */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Your Homes</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {homes.map((home) => {
            const homeSystemCount = systems.filter(
              (s) => s.home_id === home.id
            ).length;
            const homeTaskCount = tasks.filter(
              (t) => t.home_id === home.id
            ).length;
            return (
              <Link
                key={home.id}
                href={`/homes/${home.id}`}
                className="border border-neutral-200 rounded-xl p-4 hover:border-neutral-400 transition-colors bg-white flex items-center justify-between"
              >
                <div>
                  <h3 className="font-medium text-sm">{home.name}</h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    {homeSystemCount} system{homeSystemCount !== 1 ? 's' : ''} ·{' '}
                    {homeTaskCount} pending task{homeTaskCount !== 1 ? 's' : ''}
                  </p>
                </div>
                <ArrowRight size={16} className="text-neutral-400" />
              </Link>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
