// ============================================================
// Maintenance Rules Engine
// Auto-generates tasks based on system type, age, and condition.
// This is the core logic that makes HomeLoop an "operating system"
// rather than a simple task manager.
// ============================================================

import { SystemType, TaskPriority } from '@/types/database';

export interface MaintenanceRule {
  title: string;
  description: string;
  frequency_months: number;
  priority: TaskPriority;
}

// ── Default maintenance rules by system type ──────────────────
// Source: 05_MAINTENANCE_RULES.md + industry standards
export const MAINTENANCE_RULES: Record<SystemType, MaintenanceRule[]> = {
  hvac: [
    {
      title: 'HVAC service / tune-up',
      description: 'Professional inspection and tune-up. Check refrigerant, clean coils, inspect ductwork.',
      frequency_months: 6,
      priority: 'high',
    },
    {
      title: 'Replace HVAC air filter',
      description: 'Replace or clean the air filter to maintain efficiency and air quality.',
      frequency_months: 3,
      priority: 'medium',
    },
  ],
  roof: [
    {
      title: 'Roof inspection',
      description: 'Visual inspection for damaged shingles, flashing, leaks, and wear. Consider professional every 2 years.',
      frequency_months: 24,
      priority: 'high',
    },
  ],
  plumbing: [
    {
      title: 'Check for plumbing leaks',
      description: 'Inspect under sinks, around toilets, and water heater connections for leaks or moisture.',
      frequency_months: 6,
      priority: 'medium',
    },
  ],
  electrical: [
    {
      title: 'Test smoke & CO detectors',
      description: 'Test all smoke and carbon monoxide detectors. Replace batteries if needed.',
      frequency_months: 6,
      priority: 'high',
    },
    {
      title: 'Test GFCI outlets',
      description: 'Press test/reset buttons on all GFCI outlets in kitchens, bathrooms, and exterior.',
      frequency_months: 6,
      priority: 'medium',
    },
  ],
  water_heater: [
    {
      title: 'Flush water heater',
      description: 'Drain and flush the tank to remove sediment buildup. Extends lifespan significantly.',
      frequency_months: 12,
      priority: 'high',
    },
    {
      title: 'Check water heater anode rod',
      description: 'Inspect anode rod for corrosion. Replace if heavily corroded to prevent tank failure.',
      frequency_months: 24,
      priority: 'medium',
    },
  ],
  gutters: [
    {
      title: 'Clean gutters and downspouts',
      description: 'Remove debris, check for proper drainage, inspect for damage or sagging.',
      frequency_months: 6,
      priority: 'high',
    },
  ],
  appliance: [
    {
      title: 'Clean appliance filters and vents',
      description: 'Clean dryer vent, refrigerator coils, dishwasher filter, range hood filter.',
      frequency_months: 6,
      priority: 'medium',
    },
  ],
  foundation: [
    {
      title: 'Foundation inspection',
      description: 'Check for cracks, settling, moisture intrusion, and drainage issues.',
      frequency_months: 12,
      priority: 'high',
    },
  ],
  exterior: [
    {
      title: 'Exterior paint & siding check',
      description: 'Inspect for peeling paint, damaged siding, gaps, or rot. Touch up as needed.',
      frequency_months: 12,
      priority: 'medium',
    },
  ],
  interior: [
    {
      title: 'Caulking inspection',
      description: 'Check and replace caulking around tubs, showers, sinks, and windows.',
      frequency_months: 12,
      priority: 'low',
    },
  ],
  landscaping: [
    {
      title: 'Irrigation system check',
      description: 'Test sprinkler heads, check for leaks, adjust coverage and timers.',
      frequency_months: 6,
      priority: 'low',
    },
  ],
  pool: [
    {
      title: 'Pool equipment service',
      description: 'Professional inspection of pump, filter, heater, and chemical balance.',
      frequency_months: 6,
      priority: 'high',
    },
  ],
  security: [
    {
      title: 'Security system test',
      description: 'Test all sensors, cameras, and alarm functions. Update firmware if applicable.',
      frequency_months: 6,
      priority: 'medium',
    },
  ],
  other: [],
};

// ── Lifespan defaults (years) ─────────────────────────────────
// Used to show "replacement alerts" when a system nears end-of-life
export const DEFAULT_LIFESPAN: Partial<Record<SystemType, number>> = {
  hvac: 15,
  roof: 25,
  water_heater: 10,
  plumbing: 50,
  electrical: 40,
  gutters: 20,
  appliance: 12,
  foundation: 75,
  pool: 15,
  security: 10,
};

// ── Helpers ───────────────────────────────────────────────────

/**
 * Calculate the next due date for a task based on frequency.
 * If install_date or last_service is available, calculates from that.
 * Otherwise, defaults to today + frequency.
 */
export function calculateNextDueDate(
  frequencyMonths: number,
  lastServiceDate?: string | null,
  installDate?: string | null
): string {
  const baseDate = lastServiceDate
    ? new Date(lastServiceDate)
    : installDate
    ? new Date(installDate)
    : new Date();

  const dueDate = new Date(baseDate);
  dueDate.setMonth(dueDate.getMonth() + frequencyMonths);

  // If calculated due date is in the past, advance from today
  const now = new Date();
  if (dueDate < now) {
    const monthsToAdvance = frequencyMonths;
    dueDate.setTime(now.getTime());
    dueDate.setMonth(dueDate.getMonth() + monthsToAdvance);
  }

  return dueDate.toISOString().split('T')[0];
}

/**
 * Calculate system age in years. Returns null if no install date.
 */
export function getSystemAge(installDate: string | null): number | null {
  if (!installDate) return null;
  const install = new Date(installDate);
  const now = new Date();
  return Math.round((now.getTime() - install.getTime()) / (365.25 * 24 * 60 * 60 * 1000) * 10) / 10;
}

/**
 * Check if a system is nearing end of life (within 80% of lifespan).
 */
export function isNearingEndOfLife(
  installDate: string | null,
  lifespanYears: number | null,
  systemType: SystemType
): boolean {
  const age = getSystemAge(installDate);
  if (age === null) return false;
  const lifespan = lifespanYears || DEFAULT_LIFESPAN[systemType] || null;
  if (!lifespan) return false;
  return age >= lifespan * 0.8;
}

/**
 * Get the rules that apply to a given system type.
 */
export function getRulesForSystem(systemType: SystemType): MaintenanceRule[] {
  return MAINTENANCE_RULES[systemType] || [];
}

/**
 * Human-readable label for system types
 */
export const SYSTEM_TYPE_LABELS: Record<SystemType, string> = {
  hvac: 'HVAC',
  roof: 'Roof',
  plumbing: 'Plumbing',
  electrical: 'Electrical',
  water_heater: 'Water Heater',
  gutters: 'Gutters',
  appliance: 'Appliance',
  foundation: 'Foundation',
  exterior: 'Exterior',
  interior: 'Interior',
  landscaping: 'Landscaping',
  pool: 'Pool / Spa',
  security: 'Security',
  other: 'Other',
};
