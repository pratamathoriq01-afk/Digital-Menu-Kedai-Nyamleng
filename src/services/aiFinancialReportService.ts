import { supabase } from '@/lib/supabaseClient';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface FinancialReportSummary {
  period: string;
  totalGrossRevenue: number;
  totalDiscountGiven: number;
  totalNetRevenue: number;
  totalTaxCollected: number;
  totalTransactionsCount: number;
  takeawayCount: number;
  deliveryCount: number;
  topSellingItems: Array<{ name: string; qty: number; totalRevenue: number }>;
  aiExecutiveInsight: string;
  generatedAt: string;
}

export const generateAIFinancialReport = async (period: 'today' | 'week' | 'month' | 'all' = 'today'): Promise<FinancialReportSummary> => {
  try {
    // 1. Determine Date Filter
    let dateFilter = new Date();
    if (period === 'today') {
      dateFilter.setHours(0, 0, 0, 0);
    } else if (period === 'week') {
      dateFilter.setDate(dateFilter.getDate() - 7);
    } else if (period === 'month') {
      dateFilter.setMonth(dateFilter.getMonth() - 1);
    } else {
      dateFilter = new Date(0); // All time
    }

    // 2. Fetch Transactions from Supabase DB
    const { data: transactions, error } = await supabase
      .from('Transaction')
      .select('*, items:TransactionItem(*)')
      .gte('createdAt', dateFilter.toISOString())
      .order('createdAt', { ascending: false });

    if (error || !transactions) {
      console.warn('[AI Financial Report] Supabase Fetch Notice:', error?.message);
    }

    const txList = transactions || [];

    // 3. Compute Core Financial Metrics
    let totalGrossRevenue = 0;
    let totalDiscountGiven = 0;
    let totalNetRevenue = 0;
    let totalTaxCollected = 0;
    let takeawayCount = 0;
    let deliveryCount = 0;
    const itemMap: Record<string, { name: string; qty: number; totalRevenue: number }> = {};

    txList.forEach((tx: any) => {
      totalNetRevenue += Number(tx.total || 0);
      totalDiscountGiven += Number(tx.discountAmount || 0);
      totalTaxCollected += Number(tx.taxAmount || 0);
      totalGrossRevenue += Number(tx.subtotal || tx.total || 0);

      if (tx.orderType === 'TAKEAWAY') takeawayCount++;
      if (tx.orderType === 'DELIVERY') deliveryCount++;

      if (tx.items && Array.isArray(tx.items)) {
        tx.items.forEach((item: any) => {
          const name = item.nameSnapshot || 'Item';
          const qty = Number(item.qty || 1);
          const price = Number(item.priceSnapshot || 0);
          const itemRev = price * qty;

          if (!itemMap[name]) {
            itemMap[name] = { name, qty: 0, totalRevenue: 0 };
          }
          itemMap[name].qty += qty;
          itemMap[name].totalRevenue += itemRev;
        });
      }
    });

    const topSellingItems = Object.values(itemMap)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    // 4. Generate AI Agent Financial Executive Analysis via OpenAI / Gemini
    const openaiKey = (process.env.OPENAI_API_KEY || '').trim().replace(/^["']|["']$/g, '');
    const geminiKey = (process.env.GEMINI_API_KEY || '').trim().replace(/^["']|["']$/g, '');

    const promptContext =
      `DOKUMEN LAPORAN KEUANGAN KEDAI NYAMLENG MALANG\n` +
      `Periode: ${period.toUpperCase()}\n` +
      `Total Omzet Kotor: Rp ${totalGrossRevenue.toLocaleString('id-ID')}\n` +
      `Total Diskon Promo: Rp ${totalDiscountGiven.toLocaleString('id-ID')}\n` +
      `Total Omzet Bersih (Net): Rp ${totalNetRevenue.toLocaleString('id-ID')}\n` +
      `Total Pajak Resto (PB1 10%): Rp ${totalTaxCollected.toLocaleString('id-ID')}\n` +
      `Total Transaksi: ${txList.length} transaksi (Takeaway: ${takeawayCount}, Delivery: ${deliveryCount})\n` +
      `Top Menu Terlaris:\n` +
      topSellingItems.map((i, idx) => `${idx + 1}. ${i.name} - ${i.qty} porsi (Rp ${i.totalRevenue.toLocaleString('id-ID')})`).join('\n') +
      `\n\nTugas AI Agent: Berikan analisis eksekutif laporan keuangan yang profesional, ramah, dan tajam (3-4 paragraf) mengenai performa penjualan, margin keuntungan, rekomendasi stok bahan baku, dan strategi promo selanjutnya.`;

    let aiExecutiveInsight = '';

    // Primary: OpenAI GPT-4o-mini
    if (openaiKey && openaiKey.startsWith('sk-proj-')) {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: 'Kamu adalah Financial Director & AI Business Intelligence Advisor Kedai Nyamleng Malang.' },
              { role: 'user', content: promptContext },
            ],
            temperature: 0.7,
          }),
        });

        const data = await response.json();
        if (data?.choices?.[0]?.message?.content) {
          aiExecutiveInsight = data.choices[0].message.content.trim();
        }
      } catch (err) {
        console.warn('[AI Financial Agent OpenAI Warning]:', err);
      }
    }

    // Fallback: Gemini 1.5 Pro
    if (!aiExecutiveInsight && geminiKey && geminiKey.startsWith('AIzaSy')) {
      try {
        const genAI = new GoogleGenerativeAI(geminiKey);
        const model = genAI.getGenerativeModel({
          model: 'gemini-1.5-pro',
          systemInstruction: 'Kamu adalah Financial Director & AI Business Intelligence Advisor Kedai Nyamleng Malang.',
        });
        const result = await model.generateContent(promptContext);
        aiExecutiveInsight = (await result.response).text().trim();
      } catch (err) {
        console.warn('[AI Financial Agent Gemini Warning]:', err);
      }
    }

    if (!aiExecutiveInsight) {
      aiExecutiveInsight =
        `Performa Penjualan Kedai Nyamleng pada periode ${period.toUpperCase()} tercatat sangat stabil dengan total omzet bersih mencapai Rp ${totalNetRevenue.toLocaleString('id-ID')} dari total ${txList.length} transaksi.\n` +
        `Menu terlaris utama didominasi oleh ${topSellingItems[0]?.name || 'Nasi Goreng Nyamleng'}. Rekomendasi: Pertahankan ketersediaan stok bahan utama untuk menjaga kontinuitas operasional kedai.`;
    }

    return {
      period,
      totalGrossRevenue,
      totalDiscountGiven,
      totalNetRevenue,
      totalTaxCollected,
      totalTransactionsCount: txList.length,
      takeawayCount,
      deliveryCount,
      topSellingItems,
      aiExecutiveInsight,
      generatedAt: new Date().toISOString(),
    };
  } catch (err: any) {
    console.error('[AI Financial Report Error]:', err);
    throw err;
  }
};
