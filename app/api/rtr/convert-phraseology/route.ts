import { NextRequest, NextResponse } from 'next/server';
import { convertToRTPhraseology } from '@/lib/icao-rt-converter';

/**
 * Convert aviation text to ICAO RT phraseology
 * POST /api/rtr/convert-phraseology
 *
 * Request body:
 * {
 *   "text": "Contact Delhi Tower on 121.5, descend to FL80"
 * }
 *
 * Response:
 * {
 *   "original": "Contact Delhi Tower on 121.5, descend to FL80",
 *   "converted": "Contact Delhi Tower on One Two One Decimal Fife, descend to Flight Level Eight Zero"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Invalid input. Please provide "text" as a string.' },
        { status: 400 }
      );
    }

    const converted = convertToRTPhraseology(text);

    return NextResponse.json({
      original: text,
      converted,
      success: true
    });
  } catch (error) {
    console.error('RT Phraseology Conversion Error:', error);
    return NextResponse.json(
      { error: 'Failed to convert text. Please try again.' },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for simple conversions (for browser-based usage)
 * GET /api/rtr/convert-phraseology?text=Contact%20Tower
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const text = searchParams.get('text');

    if (!text) {
      return NextResponse.json(
        { error: 'Missing "text" query parameter.' },
        { status: 400 }
      );
    }

    const converted = convertToRTPhraseology(text);

    return NextResponse.json({
      original: text,
      converted,
      success: true
    });
  } catch (error) {
    console.error('RT Phraseology Conversion Error:', error);
    return NextResponse.json(
      { error: 'Failed to convert text. Please try again.' },
      { status: 500 }
    );
  }
}
