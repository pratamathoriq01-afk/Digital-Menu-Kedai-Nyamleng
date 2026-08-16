import { NextRequest, NextResponse } from 'next/server';
import { generateAIFinancialReport } from '@/services/aiFinancialReportService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const periodParam = (searchParams.get('period') || 'today') as 'today' | 'week' | 'month' | 'all';

    const report = await generateAIFinancialReport(periodParam);

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error: any) {
    console.error('API Financial Report Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to generate AI financial report', error: error?.message },
      { status: 500 }
    );
  }
}
