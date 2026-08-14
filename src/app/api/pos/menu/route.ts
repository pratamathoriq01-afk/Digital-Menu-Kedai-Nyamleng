import { NextResponse } from 'next/server';
import { MOCK_MENU_ITEMS, MOCK_CATEGORIES } from '@/data/mockMenu';

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: {
        categories: MOCK_CATEGORIES,
        items: MOCK_MENU_ITEMS,
      },
      message: 'POS menu items retrieved successfully',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve POS menu' },
      { status: 500 }
    );
  }
}
