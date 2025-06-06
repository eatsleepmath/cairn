import { NextResponse } from 'next/server';

const CAIRN_API_BASE = 'http://0.0.0.0:8000';

export async function GET() {
  try {
    const response = await fetch(`${CAIRN_API_BASE}/health`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Health API proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch health status' },
      { status: 500 }
    );
  }
} 