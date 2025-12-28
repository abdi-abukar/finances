import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from') || 'USD';
    const to = searchParams.get('to') || 'CAD';
    const amount = parseFloat(searchParams.get('amount')) || 1;

    // Using exchangerate-api.com (free tier: 1500 requests/month)
    const response = await fetch(
      `https://api.exchangerate-api.com/v4/latest/${from}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch exchange rates');
    }

    const data = await response.json();
    const rate = data.rates[to];

    if (!rate) {
      throw new Error(`Exchange rate not found for ${from} to ${to}`);
    }

    const convertedAmount = amount * rate;

    return NextResponse.json({
      success: true,
      from,
      to,
      rate,
      amount,
      convertedAmount: Math.round(convertedAmount * 100) / 100,
      lastUpdated: data.date
    });

  } catch (error) {
    console.error('Currency conversion error:', error);
    return NextResponse.json(
      { error: 'Failed to convert currency', details: error.message },
      { status: 500 }
    );
  }
}