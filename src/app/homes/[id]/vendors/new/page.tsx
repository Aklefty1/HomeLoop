'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useParams } from 'next/navigation';
import AppShell from '@/components/AppShell';
import Link from 'next/link';
import { ArrowLeft, Star } from 'lucide-react';

const SPECIALTIES = [
  'HVAC',
  'Plumbing',
  'Electrical',
  'Roofing',
  'General Contractor',
  'Landscaping',
  'Painting',
  'Pest Control',
  'Cleaning',
  'Handyman',
  'Appliance Repair',
  'Flooring',
  'Windows & Doors',
  'Pool Service',
  'Security',
  'Other',
];

export default function NewVendorPage() {
  const router = useRouter();
  const params = useParams();
  const homeId = params.id as string;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const form = new FormData(e.currentTarget);
    const supabase = createClient();

    const { error: insertError } = await supabase.from('vendors').insert({
      home_id: homeId,
      name: form.get('name') as string,
      specialty: form.get('specialty') as string || null,
      phone: form.get('phone') as string || null,
      email: form.get('email') as string || null,
      website: form.get('website') as string || null,
      rating: rating,
      notes: form.get('notes') as string || null,
    });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    router.push(`/homes/${homeId}/vendors`);
  }

  const inputClass =
    'w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent';

  return (
    <AppShell>
      <Link
        href={`/homes/${homeId}/vendors`}
        className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 mb-4"
      >
        <ArrowLeft size={16} />
        Back to vendors
      </Link>

      <h1 className="text-xl font-bold mb-6">Add a Vendor</h1>

      <form onSubmit={handleSubmit} className="max-w-lg space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">Company / Name *</label>
          <input
            name="name"
            required
            placeholder="e.g. ATL Plumbing Pros"
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Specialty</label>
          <select name="specialty" className={inputClass} defaultValue="">
            <option value="">Select a specialty...</option>
            {SPECIALTIES.map((spec) => (
              <option key={spec} value={spec}>
                {spec}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Phone</label>
            <input
              name="phone"
              type="tel"
              placeholder="(404) 555-1234"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              name="email"
              type="email"
              placeholder="contact@vendor.com"
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Website</label>
          <input
            name="website"
            placeholder="www.vendor.com"
            className={inputClass}
          />
        </div>

        {/* Star rating picker */}
        <div>
          <label className="block text-sm font-medium mb-2">Rating</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <button
                key={i}
                type="button"
                onMouseEnter={() => setHoverRating(i)}
                onMouseLeave={() => setHoverRating(null)}
                onClick={() => setRating(rating === i ? null : i)}
                className="p-0.5"
              >
                <Star
                  size={24}
                  className={`transition-colors ${
                    i <= (hoverRating || rating || 0)
                      ? 'text-amber-400 fill-amber-400'
                      : 'text-neutral-200'
                  }`}
                />
              </button>
            ))}
            {rating && (
              <button
                type="button"
                onClick={() => setRating(null)}
                className="text-xs text-neutral-400 hover:text-neutral-600 ml-2"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Notes</label>
          <textarea
            name="notes"
            rows={3}
            placeholder="Service history, notes, recommendations..."
            className={inputClass}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-neutral-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Add Vendor'}
        </button>
      </form>
    </AppShell>
  );
}
