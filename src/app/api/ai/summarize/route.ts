// ============================================================
// AI Document Summarization API
// POST /api/ai/summarize
// Body: { documentText, documentName }
// Summarizes uploaded documents and extracts key info.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { summarizeDocument } from '@/lib/ai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { documentText, documentName } = body;

    if (!documentText || !documentName) {
      return NextResponse.json(
        { error: 'documentText and documentName are required' },
        { status: 400 }
      );
    }

    // Limit input size to prevent abuse
    if (documentText.length > 50000) {
      return NextResponse.json(
        { error: 'Document too large. Maximum 50,000 characters.' },
        { status: 400 }
      );
    }

    const summary = await summarizeDocument(documentText, documentName);

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('AI summarize error:', error);
    return NextResponse.json(
      { error: 'Failed to summarize document' },
      { status: 500 }
    );
  }
}
