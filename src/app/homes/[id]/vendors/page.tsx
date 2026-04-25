'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useParams } from 'next/navigation';
import AppShell from '@/components/AppShell';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  Users,
  Phone,
  Mail,
  Globe,
  Star,
  Trash2,
  Pencil,
} from 'lucide-react';
import type { Vendor } from '@/types/database';

function StarRating({ rating }: { rating: number | null }) {
  if (!rating) return null;
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={12}
          className={i <= rating ? 'text-amber-400 fill-amber-400' : 'text-neutral-200'}
        />
      ))}
    </div>
  );
}

// Common vendor specialties for homeowners
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

export default function VendorsPage() {
  const params = useParams();
  const homeId = params.id as string;

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSpecialty, setFilterSpecialty] = useState<string | null>(null);

  useEffect(() => {
    fetchVendors();
  }, [homeId]);

  async function fetchVendors() {
    const supabase = createClient();
    const { data } = await supabase
      .from('vendors')
      .select('*')
      .eq('home_id', homeId)
      .order('name');
    setVendors(data || []);
    setLoading(false);
  }

  async function deleteVendor(vendor: Vendor) {
    if (!confirm(`Remove "${vendor.name}" from your vendors?`)) return;
    const supabase = createClient();
    await supabase.from('vendors').delete().eq('id', vendor.id);
    setVendors((prev) => prev.filter((v) => v.id !== vendor.id));
  }

  const filtered = filterSpecialty
    ? vendors.filter((v) => v.specialty === filterSpecialty)
    : vendors;

  // Get all specialties in use
  const activeSpecialties = Array.from(
    new Set(vendors.map((v) => v.specialty).filter(Boolean))
  ).sort();

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
        <h1 className="text-xl font-bold">Vendors</h1>
        <Link
          href={`/homes/${homeId}/vendors/new`}
          className="flex items-center gap-2 bg-neutral-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors"
        >
          <Plus size={16} />
          Add Vendor
        </Link>
      </div>

      {/* Specialty filter */}
      {activeSpecialties.length > 1 && (
        <div className="flex gap-1.5 flex-wrap mb-4">
          <button
            onClick={() => setFilterSpecialty(null)}
            className={`text-xs px-2.5 py-1.5 rounded-lg transition-colors ${
              !filterSpecialty
                ? 'bg-neutral-900 text-white'
                : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
            }`}
          >
            All
          </button>
          {activeSpecialties.map((spec) => (
            <button
              key={spec}
              onClick={() => setFilterSpecialty(spec === filterSpecialty ? null : spec!)}
              className={`text-xs px-2.5 py-1.5 rounded-lg transition-colors ${
                filterSpecialty === spec
                  ? 'bg-neutral-900 text-white'
                  : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
              }`}
            >
              {spec}
            </button>
          ))}
        </div>
      )}

      {/* Vendor list */}
      {loading ? (
        <p className="text-sm text-neutral-500">Loading...</p>
      ) : vendors.length === 0 ? (
        <div className="border border-dashed border-neutral-300 rounded-xl p-12 text-center">
          <Users size={32} className="mx-auto text-neutral-400 mb-3" />
          <p className="text-neutral-600 font-medium">No vendors yet</p>
          <p className="text-sm text-neutral-400 mt-1">
            Save your trusted contractors, repair pros, and service providers.
          </p>
          <Link
            href={`/homes/${homeId}/vendors/new`}
            className="inline-flex items-center gap-2 bg-neutral-900 text-white px-4 py-2 rounded-lg text-sm font-medium mt-4 hover:bg-neutral-800 transition-colors"
          >
            <Plus size={16} />
            Add First Vendor
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-neutral-400">No vendors match this filter.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((vendor) => (
            <div
              key={vendor.id}
              className="border border-neutral-200 rounded-xl p-4 bg-white"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-sm">{vendor.name}</h3>
                  {vendor.specialty && (
                    <p className="text-xs text-neutral-400 mt-0.5">{vendor.specialty}</p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <StarRating rating={vendor.rating} />
                  <button
                    onClick={() => deleteVendor(vendor)}
                    className="p-1.5 text-neutral-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors ml-1"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Contact info */}
              <div className="mt-3 space-y-1.5">
                {vendor.phone && (
                  <a
                    href={`tel:${vendor.phone}`}
                    className="flex items-center gap-2 text-xs text-neutral-500 hover:text-neutral-900"
                  >
                    <Phone size={13} />
                    {vendor.phone}
                  </a>
                )}
                {vendor.email && (
                  <a
                    href={`mailto:${vendor.email}`}
                    className="flex items-center gap-2 text-xs text-neutral-500 hover:text-neutral-900"
                  >
                    <Mail size={13} />
                    {vendor.email}
                  </a>
                )}
                {vendor.website && (
                  <a
                    href={vendor.website.startsWith('http') ? vendor.website : `https://${vendor.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-neutral-500 hover:text-neutral-900"
                  >
                    <Globe size={13} />
                    {vendor.website.replace(/^https?:\/\//, '')}
                  </a>
                )}
              </div>

              {vendor.notes && (
                <p className="text-xs text-neutral-400 mt-2 line-clamp-2">
                  {vendor.notes}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
