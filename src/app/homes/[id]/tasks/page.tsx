'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useParams } from 'next/navigation';
import AppShell from '@/components/AppShell';
import Link from 'next/link';
import {
  ArrowLeft,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Filter,
} from 'lucide-react';
import type { MaintenanceTask } from '@/types/database';

type FilterStatus = 'all' | 'overdue' | 'pending' | 'completed';

export default function TasksPage() {
  const params = useParams();
  const homeId = params.id as string;

  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>('all');

  useEffect(() => {
    async function fetchTasks() {
      const supabase = createClient();
      const { data } = await supabase
        .from('maintenance_tasks')
        .select('*')
        .eq('home_id', homeId)
        .order('due_date', { ascending: true });
      setTasks(data || []);
      setLoading(false);
    }
    fetchTasks();
  }, [homeId]);

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

  const now = new Date();
  const filtered = tasks.filter((t) => {
    if (filter === 'overdue')
      return t.due_date && new Date(t.due_date) < now && t.status !== 'completed';
    if (filter === 'pending') return t.status !== 'completed';
    if (filter === 'completed') return t.status === 'completed';
    return true;
  });

  const overdueCt = tasks.filter(
    (t) => t.due_date && new Date(t.due_date) < now && t.status !== 'completed'
  ).length;

  return (
    <AppShell>
      <Link
        href={`/homes/${homeId}`}
        className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 mb-4"
      >
        <ArrowLeft size={16} />
        Back to home
      </Link>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">All Tasks</h1>
        {overdueCt > 0 && (
          <span className="text-xs font-medium text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
            {overdueCt} overdue
          </span>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        {(['all', 'overdue', 'pending', 'completed'] as FilterStatus[]).map(
          (f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg capitalize transition-colors ${
                filter === f
                  ? 'bg-neutral-900 text-white'
                  : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
              }`}
            >
              {f}
            </button>
          )
        )}
      </div>

      {loading ? (
        <p className="text-sm text-neutral-500">Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-neutral-400">No tasks match this filter.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((task) => {
            const isOverdue =
              task.due_date &&
              new Date(task.due_date) < now &&
              task.status !== 'completed';
            const isCompleted = task.status === 'completed';
            return (
              <div
                key={task.id}
                className={`border rounded-lg p-3 flex items-center justify-between ${
                  isCompleted
                    ? 'border-neutral-100 bg-neutral-50'
                    : isOverdue
                    ? 'border-red-200 bg-red-50'
                    : 'border-neutral-200 bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  {isCompleted ? (
                    <CheckCircle2 size={16} className="text-green-500 shrink-0" />
                  ) : isOverdue ? (
                    <AlertTriangle size={16} className="text-red-500 shrink-0" />
                  ) : (
                    <Clock size={16} className="text-neutral-400 shrink-0" />
                  )}
                  <div>
                    <p
                      className={`text-sm font-medium ${
                        isCompleted ? 'line-through text-neutral-400' : ''
                      }`}
                    >
                      {task.title}
                    </p>
                    <p
                      className={`text-xs ${
                        isOverdue ? 'text-red-500' : 'text-neutral-400'
                      }`}
                    >
                      {task.due_date
                        ? isCompleted
                          ? `Completed ${new Date(task.completed_date!).toLocaleDateString()}`
                          : `Due ${new Date(task.due_date).toLocaleDateString()}`
                        : ''}
                      {task.frequency_months
                        ? ` · Every ${task.frequency_months} mo`
                        : ''}
                    </p>
                  </div>
                </div>
                {!isCompleted && (
                  <button
                    onClick={() => completeTask(task.id)}
                    className="text-xs font-medium text-neutral-600 hover:text-green-600 border border-neutral-200 hover:border-green-200 px-3 py-1 rounded-lg transition-colors shrink-0"
                  >
                    Done
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
