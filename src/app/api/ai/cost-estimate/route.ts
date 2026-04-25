// ============================================================
// AI Cost Estimate API
// POST /api/ai/cost-estimate
// Body: { systemId, estimateType: 'repair' | 'replace' | 'service' }
// Returns cost estimates for a specific system.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCostEstimate } from '@/lib/ai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { systemId, estimateType } = body;

    if (!systemId || !estimateType) {
      return NextResponse.json(
        { error: 'systemId and estimateType are required' },
        { status: 400 }
      );
    }

    if (!['repair', 'replace', 'service'].includes(estimateType)) {
      return NextResponse.json(
        { error: 'estimateType must be repair, replace, or service' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data: system, error: sysError } = await supabase
      .from('systems')
      .select('*')
      .eq('id', systemId)
      .single();

    if (sysError || !system) {
      return NextResponse.json({ error: 'System not found' }, { status: 404 });
    }

    const estimate = await getCostEstimate(system, estimateType);

    return NextResponse.json({ estimate });
  } catch (error) {
    console.error('AI cost estimate error:', error);
    return NextResponse.json(
      { error: 'Failed to generate estimate' },
      { status: 500 }
    );
  }
}
