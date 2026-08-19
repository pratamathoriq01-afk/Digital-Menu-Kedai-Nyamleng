import { NextResponse } from 'next/server';
import { MOCK_CATEGORIES } from '@/data/mockMenu';
import { fetchSupabaseMenuItems } from '@/services/supabaseMenuService';

export const dynamic = 'force-dynamic';
export const revalidate = 0;


export async function GET() {
  try {
    const supabaseItems = await fetchSupabaseMenuItems();

    return NextResponse.json({
      success: true,
      data: {
        categories: MOCK_CATEGORIES,
        items: supabaseItems,
      },
      message: 'POS menu items retrieved successfully from Supabase Master Database',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve POS menu' },
      { status: 500 }
    );
  }
}
