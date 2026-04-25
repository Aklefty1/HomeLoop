'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import AppShell from '@/components/AppShell';
import Link from 'next/link';
import { Plus, Home as HomeIcon, MapPin } from 'lucide-react';
import type { Home } from '@/types/database';

export default function HomesPage() {
  const [homes, setHomes] = useState<Home[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHomes() {
      const supabase = createClient();
      const { data } = await supabase
        .from('homes')
        .select('*')
        .order('created_at', { ascending: false });
      setHomes(data || []);
      setLoading(false);
    }
    fetchHomes();
  }, []);

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">My Homes</h1>
        <Link
          href="/homes/new"
          className="flex items-center gap-2 bg-neutral-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors"
        >
          <Plus size={16} />
          Add Home
        </Link>
      </div>

      {loading ? (
        <div className="text-sm text-neutral-500">Loading...</div>
      ) : homes.length === 0 ? (
        <div className="border border-dashed border-neutral-300 rounded-xl p-12 text-center">
          <HomeIcon size={32} className="mx-auto text-neutral-400 mb-3" />
          <p className="text-neutral-600 font-medium">No homes yet</p>
          <p className="text-sm text-neutral-400 mt-1">
            Add your first home to start tracking maintenance and systems.
          </p>
          <Link
            href="/homes/new"
            className="inline-flex items-center gap-2 bg-neutral-900 text-white px-4 py-2 rounded-lg text-sm font-medium mt-4 hover:bg-neutral-800 transition-colors"
          >
            <Plus size={16} />
            Add Your Home
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {homes.map((home) => (
            <Link
              key={home.id}
              href={`/homes/${home.id}`}
              className="border border-neutral-200 rounded-xl p-5 hover:border-neutral-400 transition-colors bg-white"
            >
              <h2 className="font-semibold">{home.name}</h2>
              <div className="flex items-center gap-1.5 text-sm text-neutral-500 mt-1">
                <MapPin size={14} />
                {home.address}{home.city ? `, ${home.city}` : ''}{home.state ? ` ${home.state}` : ''}
              </div>
              <div className="flex gap-4 mt-3 text-xs text-neutral-400">
                {home.year_built && <span>Built {home.year_built}</span>}
                {home.square_feet && <span>{home.square_feet.toLocaleString()} sqft</span>}
                {home.bedrooms && <span>{home.bedrooms} bed</span>}
                {home.bathrooms && <span>{home.bathrooms} bath</span>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}
