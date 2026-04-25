// ============================================================
// HomeLoop Database Types
// These types mirror the Supabase PostgreSQL tables exactly.
// ============================================================

export interface Home {
  id: string;
  user_id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  year_built: number | null;
  square_feet: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  lot_size: string | null;
  home_type: 'single_family' | 'condo' | 'townhouse' | 'multi_family' | 'other';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type SystemType =
  | 'hvac'
  | 'roof'
  | 'plumbing'
  | 'electrical'
  | 'water_heater'
  | 'gutters'
  | 'appliance'
  | 'foundation'
  | 'exterior'
  | 'interior'
  | 'landscaping'
  | 'pool'
  | 'security'
  | 'other';

export type SystemCondition = 'excellent' | 'good' | 'fair' | 'poor' | 'unknown';

export interface HomeSystem {
  id: string;
  home_id: string;
  name: string;
  system_type: SystemType;
  manufacturer: string | null;
  model: string | null;
  install_date: string | null;
  last_service_date: string | null;
  lifespan_years: number | null;
  condition: SystemCondition;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type TaskStatus = 'pending' | 'upcoming' | 'overdue' | 'completed' | 'skipped';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface MaintenanceTask {
  id: string;
  home_id: string;
  system_id: string | null;
  title: string;
  description: string | null;
  frequency_months: number | null;
  due_date: string | null;
  completed_date: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  is_auto_generated: boolean;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  home_id: string;
  system_id: string | null;
  name: string;
  file_url: string;
  file_type: string | null;
  tags: string[];
  notes: string | null;
  created_at: string;
}

export interface Vendor {
  id: string;
  home_id: string;
  name: string;
  specialty: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  rating: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}
