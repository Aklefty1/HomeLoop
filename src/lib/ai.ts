// ============================================================
// HomeLoop AI Utility
// Server-side only. Handles all OpenAI interactions.
// Each function builds a context-rich prompt from the user's
// actual home data before sending to GPT.
// ============================================================

import OpenAI from 'openai';
import type { Home, HomeSystem, MaintenanceTask, Vendor } from '@/types/database';
import {
  SYSTEM_TYPE_LABELS,
  getSystemAge,
  isNearingEndOfLife,
  DEFAULT_LIFESPAN,
} from './maintenance-rules';

// Initialize once — reuse across requests
function getClient() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

// ── Build home context string ─────────────────────────────────
// This gives the AI full awareness of the user's specific home.
export function buildHomeContext(
  home: Home,
  systems: HomeSystem[],
  tasks: MaintenanceTask[]
): string {
  const systemDetails = systems
    .map((s) => {
      const age = getSystemAge(s.install_date);
      const lifespan = s.lifespan_years || DEFAULT_LIFESPAN[s.system_type as keyof typeof DEFAULT_LIFESPAN];
      const nearEnd = isNearingEndOfLife(s.install_date, s.lifespan_years, s.system_type as any);
      return [
        `- ${s.name} (${SYSTEM_TYPE_LABELS[s.system_type as keyof typeof SYSTEM_TYPE_LABELS] || s.system_type})`,
        s.manufacturer ? `  Manufacturer: ${s.manufacturer}` : null,
        s.model ? `  Model: ${s.model}` : null,
        age !== null ? `  Age: ${age} years` : null,
        lifespan ? `  Expected lifespan: ${lifespan} years` : null,
        `  Condition: ${s.condition}`,
        nearEnd ? `  ⚠ NEARING END OF LIFE` : null,
        s.last_service_date ? `  Last serviced: ${s.last_service_date}` : null,
      ]
        .filter(Boolean)
        .join('\n');
    })
    .join('\n');

  const pendingTasks = tasks
    .filter((t) => t.status !== 'completed')
    .map((t) => {
      const overdue = t.due_date && new Date(t.due_date) < new Date();
      return `- ${t.title}${t.due_date ? ` (due ${t.due_date})` : ''}${overdue ? ' [OVERDUE]' : ''} [${t.priority}]`;
    })
    .join('\n');

  return `HOME PROFILE:
Name: ${home.name}
Address: ${home.address}, ${home.city}, ${home.state} ${home.zip}
Type: ${home.home_type.replace('_', ' ')}
Year Built: ${home.year_built || 'Unknown'}
Square Feet: ${home.square_feet || 'Unknown'}
Bedrooms: ${home.bedrooms || 'Unknown'} | Bathrooms: ${home.bathrooms || 'Unknown'}

SYSTEMS (${systems.length} total):
${systemDetails || 'No systems added yet.'}

PENDING MAINTENANCE TASKS (${tasks.filter((t) => t.status !== 'completed').length}):
${pendingTasks || 'No pending tasks.'}`;
}

// ── System prompt ─────────────────────────────────────────────
const SYSTEM_PROMPT = `You are HomeLoop AI, a knowledgeable home maintenance assistant. You help homeowners understand, maintain, and manage their homes.

Your personality:
- Clear, practical, and direct
- You give actionable advice, not vague suggestions
- You reference the homeowner's SPECIFIC data when answering
- You flag urgent issues prominently
- You provide cost estimates in ranges when relevant
- You're based in the Atlanta, GA market for cost context

Rules:
- Always base answers on the home data provided in the context
- When estimating costs, give ranges (low/mid/high) and note they're estimates
- If you don't have enough data to answer accurately, say so
- Prioritize safety-critical issues (electrical, gas, structural)
- Use plain language, not technical jargon`;

// ── Smart Maintenance Tips ────────────────────────────────────
export async function getMaintenanceTips(
  home: Home,
  systems: HomeSystem[],
  tasks: MaintenanceTask[]
): Promise<string> {
  const client = getClient();
  const context = buildHomeContext(home, systems, tasks);

  const now = new Date();
  const month = now.toLocaleString('en-US', { month: 'long' });
  const season =
    now.getMonth() >= 2 && now.getMonth() <= 4
      ? 'spring'
      : now.getMonth() >= 5 && now.getMonth() <= 7
      ? 'summer'
      : now.getMonth() >= 8 && now.getMonth() <= 10
      ? 'fall'
      : 'winter';

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `${context}

Based on this home's specific data, current month (${month}), and season (${season}), provide 3-5 personalized maintenance tips. Focus on:
1. Any overdue or urgent items
2. Seasonal tasks relevant to this home's systems
3. Systems nearing end of life that need planning
4. Proactive steps to prevent costly repairs

Format each tip as a short, actionable recommendation. Be specific to THIS home.`,
      },
    ],
    temperature: 0.7,
    max_tokens: 600,
  });

  return response.choices[0]?.message?.content || 'Unable to generate tips at this time.';
}

// ── Document Summarization ────────────────────────────────────
export async function summarizeDocument(
  documentText: string,
  documentName: string
): Promise<string> {
  const client = getClient();

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Summarize this home document titled "${documentName}". Extract and clearly present:

1. **Key Dates**: warranty start/end, service dates, expiration dates
2. **Coverage/Scope**: what's covered, what's excluded
3. **Action Items**: anything the homeowner needs to do
4. **Important Details**: model numbers, serial numbers, contact info, claim procedures
5. **Cost Information**: any amounts, deductibles, or limits mentioned

Document content:
---
${documentText}
---

Provide a clear, structured summary a homeowner can quickly scan.`,
      },
    ],
    temperature: 0.3,
    max_tokens: 800,
  });

  return response.choices[0]?.message?.content || 'Unable to summarize this document.';
}

// ── Home Q&A ──────────────────────────────────────────────────
export async function askHomeQuestion(
  question: string,
  home: Home,
  systems: HomeSystem[],
  tasks: MaintenanceTask[],
  vendors: Vendor[]
): Promise<string> {
  const client = getClient();
  const context = buildHomeContext(home, systems, tasks);

  const vendorInfo = vendors.length > 0
    ? `\nSAVED VENDORS:\n${vendors.map((v) => `- ${v.name}${v.specialty ? ` (${v.specialty})` : ''}${v.phone ? ` — ${v.phone}` : ''}${v.rating ? ` — ${v.rating}/5 stars` : ''}`).join('\n')}`
    : '';

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `${context}${vendorInfo}

Homeowner's question: ${question}

Answer based on this specific home's data. If the question relates to a system they have, reference its actual age, condition, and maintenance history. If they ask about costs, give Atlanta-area estimates.`,
      },
    ],
    temperature: 0.7,
    max_tokens: 600,
  });

  return response.choices[0]?.message?.content || 'Unable to answer at this time.';
}

// ── Cost Estimates ────────────────────────────────────────────
export async function getCostEstimate(
  system: HomeSystem,
  estimateType: 'repair' | 'replace' | 'service'
): Promise<string> {
  const client = getClient();
  const age = getSystemAge(system.install_date);

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Estimate the cost to ${estimateType} this home system in the Atlanta, GA metro area:

System: ${system.name}
Type: ${SYSTEM_TYPE_LABELS[system.system_type as keyof typeof SYSTEM_TYPE_LABELS] || system.system_type}
Manufacturer: ${system.manufacturer || 'Unknown'}
Model: ${system.model || 'Unknown'}
Age: ${age !== null ? `${age} years` : 'Unknown'}
Condition: ${system.condition}

Provide:
1. Cost range (low / mid / high)
2. Key factors that affect the price
3. Whether it makes more sense to repair or replace given the age/condition
4. Estimated timeline for the work
5. Any tips for getting the best price

Be specific and practical. These are estimates — note that clearly.`,
      },
    ],
    temperature: 0.5,
    max_tokens: 600,
  });

  return response.choices[0]?.message?.content || 'Unable to estimate costs at this time.';
}
