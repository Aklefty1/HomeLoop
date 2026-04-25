'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function NewHomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const form = new FormData(e.currentTarget);
    const supabase = createClient();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError('Not authenticated');
      setLoading(false);
      return;
    }

    const { data, error: insertError } = await supabase
      .from('homes')
      .insert({
        user_id: user.id,
        name: form.get('name') as string,
        address: form.get('address') as string,
        city: form.get('city') as string,
        state: form.get('state') as string,
        zip: form.get('zip') as string,
        year_built: form.get('year_built') ? Number(form.get('year_built')) : null,
        square_feet: form.get('square_feet') ? Number(form.get('square_feet')) : null,
        bedrooms: form.get('bedrooms') ? Number(form.get('bedrooms')) : null,
        bathrooms: form.get('bathrooms') ? Number(form.get('bathrooms')) : null,
        home_type: form.get('home_type') as string,
        notes: form.get('notes') as string || null,
      })
      .select()
      .single();

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    router.push(`/homes/${data.id}`);
  }

  const inputClass =
    'w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent';

  return (
    <AppShell>
      <Link
        href="/homes"
        className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 mb-4"
      >
        <ArrowLeft size={16} />
        Back to homes
      </Link>

      <h1 className="text-xl font-bold mb-6">Add a Home</h1>

      <form onSubmit={handleSubmit} className="max-w-lg space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">Home Name *</label>
          <input name="name" required placeholder="e.g. Our House" className={inputClass} />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Street Address *</label>
          <input name="address" required placeholder="123 Main St" className={inputClass} />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">City</label>
            <input name="city" placeholder="Atlanta" className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">State</label>
            <input name="state" placeholder="GA" maxLength={2} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">ZIP</label>
            <input name="zip" placeholder="30301" className={inputClass} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Home Type</label>
          <select name="home_type" className={inputClass} defaultValue="single_family">
            <option value="single_family">Single Family</option>
            <option value="condo">Condo</option>
            <option value="townhouse">Townhouse</option>
            <option value="multi_family">Multi-Family</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Year Built</label>
            <input name="year_built" type="number" min={1800} max={2030} placeholder="2005" className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Square Feet</label>
            <input name="square_feet" type="number" min={0} placeholder="2400" className={inputClass} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Bedrooms</label>
            <input name="bedrooms" type="number" min={0} max={20} placeholder="4" className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Bathrooms</label>
            <input name="bathrooms" type="number" min={0} max={20} step={0.5} placeholder="2.5" className={inputClass} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Notes</label>
          <textarea
            name="notes"
            rows={3}
            placeholder="Any additional details about this home..."
            className={inputClass}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-neutral-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Add Home'}
        </button>
      </form>
    </AppShell>
  );
}
