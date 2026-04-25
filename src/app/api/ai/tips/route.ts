// ============================================================
// AI Maintenance Tips API
// GET /api/ai/tips?homeId=xxx
// Returns personalized maintenance tips for a specific home.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getMaintenanceTips } from '@/lib/ai';

export async function GET(request: NextRequest) {
  const homeId = request.nextUrl.searchParams.get('homeId');
  if (!homeId) {
    return NextResponse.json({ error: 'homeId is required' }, { status: 400 });
  }

  try {
    const supabase = await createClient();

    // Verify user owns this home (RLS handles this, but explicit check is clearer)
    const { data: home, error: homeError } = await supabase
      .from('homes')
      .select('*')
      .eq('id', homeId)
      .single();

    if (homeError || !home) {
      return NextResponse.json({ error: 'Home not found' }, { status: 404 });
    }

    const [systemsRes, tasksRes] = await Promise.all([
      supabase.from('systems').select('*').eq('home_id', homeId),
      supabase.from('maintenance_tasks').select('*').eq('home_id', homeId),
    ]);

    const tips = await getMaintenanceTips(
      home,
      systemsRes.data || [],
      tasksRes.data || []
    );

    return NextResponse.json({ tips });
  } catch (error) {
    console.error('AI tips error:', error);
    return NextResponse.json(
      { error: 'Failed to generate tips' },
      { status: 500 }
    );
  }
}
