// ============================================================
// AI Home Q&A API
// POST /api/ai/chat
// Body: { homeId, question }
// Answers questions about the user's home using their actual data.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { askHomeQuestion } from '@/lib/ai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { homeId, question } = body;

    if (!homeId || !question) {
      return NextResponse.json(
        { error: 'homeId and question are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data: home, error: homeError } = await supabase
      .from('homes')
      .select('*')
      .eq('id', homeId)
      .single();

    if (homeError || !home) {
      return NextResponse.json({ error: 'Home not found' }, { status: 404 });
    }

    const [systemsRes, tasksRes, vendorsRes] = await Promise.all([
      supabase.from('systems').select('*').eq('home_id', homeId),
      supabase.from('maintenance_tasks').select('*').eq('home_id', homeId),
      supabase.from('vendors').select('*').eq('home_id', homeId),
    ]);

    const answer = await askHomeQuestion(
      question,
      home,
      systemsRes.data || [],
      tasksRes.data || [],
      vendorsRes.data || []
    );

    return NextResponse.json({ answer });
  } catch (error) {
    console.error('AI chat error:', error);
    return NextResponse.json(
      { error: 'Failed to get answer' },
      { status: 500 }
    );
  }
}
