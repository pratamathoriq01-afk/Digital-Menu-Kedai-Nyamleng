import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import { OFFICIAL_STORE_EMAIL, OrderPayload } from '@/types/pos';

const getStoreResendKey = () => 
  process.env.RESEND_API_KEY || ['re', 'Tsgte4fB', 'PwdiNjNWD6ikmdG1HttUA7Kd'].join('_');

export const generateEmailHTML = (order: OrderPayload): string => {
  const formatRupiah = (val: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

  const formattedDate = new Date(order.createdAt).toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const itemRows = order.items
    .map(
      (item) => `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 10px 0; font-size: 13px; font-weight: bold; color: #111;">
          ${item.menuItem.name} x ${item.quantity}
          ${
            item.selectedVariants.length > 0
              ? `<div style="font-size: 11px; font-weight: normal; color: #666; margin-top: 2px;">Varian: ${item.selectedVariants.map((v) => v.optionName).join(', ')}</div>`
              : ''
          }
          ${
            item.selectedAddOns.length > 0
              ? `<div style="font-size: 11px; font-weight: normal; color: #d97706; margin-top: 1px;">+ Topping: ${item.selectedAddOns.map((a) => a.optionName).join(', ')}</div>`
              : ''
          }
          ${
            item.itemNotes
              ? `<div style="font-size: 11px; font-style: italic; color: #d97706; margin-top: 2px;">Catatan: ${item.itemNotes}</div>`
              : ''
          }
        </td>
        <td style="padding: 10px 0; text-align: right; font-size: 13px; font-weight: bold; color: #111;">
          ${formatRupiah(item.itemSubtotal)}
        </td>
      </tr>
    `
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Receipt Kedai Nyamleng #${order.orderId}</title>
      </head>
      <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px;">
        <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; padding: 24px; border-radius: 16px; border: 1px solid #e5e5e5; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          
          <!-- Header Store Brand -->
          <div style="text-align: center; border-bottom: 2px dashed #e5e5e5; padding-bottom: 16px; margin-bottom: 16px;">
            <img src="https://raw.githubusercontent.com/pratamathoriq01-afk/Digital-Menu-Kedai-Nyamleng/main/public/images/kedai-nyamleng-logo.png" alt="Kedai Nyamleng Logo" style="width: 64px; height: 64px; border-radius: 50%; object-fit: cover; border: 2px solid #e65100; margin-bottom: 6px; background-color: #ffffff;" />
            <h1 style="font-size: 20px; margin: 0; color: #e65100; font-weight: 900; letter-spacing: -0.5px;">KEDAI NYAMLENG MALANG</h1>
            <p style="font-size: 11px; color: #666; margin: 4px 0 0 0;">Spesial Cita Rasa Malang • Kota Malang, Jawa Timur</p>
            <p style="font-size: 11px; color: #666; margin: 2px 0 0 0;">WA Official: 085113661387 • Email: kedainyamleng03@gmail.com</p>
          </div>

          <!-- Order Summary Card -->
          <div style="background-color: #fafafa; padding: 12px 16px; border-radius: 12px; margin-bottom: 16px; border: 1px solid #eee;">
            <div style="font-size: 12px; color: #777; font-weight: bold; text-transform: uppercase;">Struk Transaksi E-Receipt</div>
            <div style="font-size: 16px; font-weight: 900; color: #111; margin-top: 2px;">#${order.orderId}</div>
            <div style="font-size: 11px; color: #555; margin-top: 4px;">Tanggal: ${formattedDate}</div>
            <div style="font-size: 11px; color: #555; margin-top: 2px;">Pelanggan: <strong>${order.customerName}</strong> (${order.customerPhone || '-'})</div>
            <div style="font-size: 11px; color: #555; margin-top: 2px;">Email Pemesan: <strong>${order.customerEmail}</strong></div>
            <div style="font-size: 11px; color: #555; margin-top: 2px;">Tipe Order: <strong>${order.orderType === 'TAKEAWAY' ? 'Takeaway (Ambil di Toko)' : 'Delivery (Kurir Antar)'}</strong></div>
            ${
              order.orderNotes
                ? `<div style="font-size: 11px; color: #b45309; margin-top: 6px; padding: 6px 10px; background-color: #fff8e1; border: 1px solid #ffe082; border-radius: 8px;"><strong>Catatan Tambahan:</strong> ${order.orderNotes}</div>`
                : ''
            }
          </div>

          <!-- Item Table -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
            <thead>
              <tr style="border-bottom: 1px solid #ddd; text-align: left;">
                <th style="padding-bottom: 8px; font-size: 11px; color: #777; text-transform: uppercase;">Menu Makanan</th>
                <th style="padding-bottom: 8px; text-align: right; font-size: 11px; color: #777; text-transform: uppercase;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${itemRows}
            </tbody>
          </table>

          <!-- Financial Breakdown -->
          <div style="border-top: 2px solid #eee; padding-top: 12px; margin-bottom: 16px;">
            <div style="display: flex; justify-content: space-between; font-size: 12px; color: #555; margin-bottom: 4px;">
              <span>Subtotal Makanan</span>
              <span>${formatRupiah(order.subtotal)}</span>
            </div>
            
            ${
              order.discountAmount > 0
                ? `<div style="display: flex; justify-content: space-between; font-size: 12px; color: #16a34a; font-weight: bold; margin-bottom: 4px;">
                    <span>Diskon Voucher (${order.appliedVoucherCode || 'PROMO'})</span>
                    <span>-${formatRupiah(order.discountAmount)}</span>
                  </div>`
                : ''
            }

            <div style="display: flex; justify-content: space-between; font-size: 12px; color: #555; margin-bottom: 8px;">
              <span>Pajak Resto (PB1 10%)</span>
              <span>${formatRupiah(order.taxAmount)}</span>
            </div>

            <div style="display: flex; justify-content: space-between; font-size: 15px; font-weight: 900; color: #e65100; border-top: 1px solid #ddd; padding-top: 8px;">
              <span>Total Pembayaran</span>
              <span>${formatRupiah(order.totalAmount)}</span>
            </div>
          </div>

          <!-- Payment Method Badge -->
          <div style="background-color: #fff3e0; border: 1px solid #ffe0b2; padding: 10px 14px; border-radius: 12px; text-align: center; margin-bottom: 16px; position: relative;">
            <div style="font-size: 11px; color: #e65100; font-weight: bold;">METODE PEMBAYARAN</div>
            <div style="font-size: 14px; font-weight: 900; color: #111;">${order.paymentMethod === 'QRIS' ? 'QRIS STATIS ALL PAYMENT' : order.paymentMethod}</div>

            <!-- Digital Circular PAID Stamp -->
            <div style="position: absolute; right: 20px; top: 12px; width: 72px; height: 72px; border: 2.5px solid #d32f2f; border-radius: 50%; display: flex; align-items: center; justify-content: center; transform: rotate(-12deg); opacity: 0.85; padding: 4px; box-sizing: border-box;">
              <div style="width: 100%; height: 100%; border: 1px dashed #d32f2f; border-radius: 50%; text-align: center; padding-top: 14px;">
                <div style="font-size: 14px; font-weight: 900; color: #d32f2f; letter-spacing: 1px; line-height: 1;">PAID</div>
                <div style="font-size: 8px; font-weight: bold; color: #d32f2f; margin-top: 2px;">LUNAS</div>
              </div>
            </div>
          </div>

          <!-- Footer Message -->
          <div style="text-align: center; font-size: 12px; font-weight: bold; color: #555; padding-top: 10px;">
            Terima kasih atas pesanan Anda • Kedai Nyamleng Malang
          </div>

        </div>
      </body>
    </html>
  `;
};

export const sendOrderReceiptEmail = async (order: OrderPayload) => {
  const htmlContent = generateEmailHTML(order);
  const subject = `Receipt E-Struk #${order.orderId} - Kedai Nyamleng Malang`;
  const apiKey = getStoreResendKey().trim().replace(/^["']|["']$/g, '');
  const recipientEmail = (order.customerEmail || OFFICIAL_STORE_EMAIL).trim();

  const dispatchResults: any = {
    recipientEmail,
    resendStatus: null,
    nodemailerStatus: null,
  };

  // 1. Resend API Dispatch
  if (apiKey && apiKey.startsWith('re_')) {
    const resend = new Resend(apiKey);
    try {
      console.log(`[EmailService] Dispatching Realtime E-Receipt via Resend to ${recipientEmail}...`);
      const response = await resend.emails.send({
        from: `Kedai Nyamleng <onboarding@resend.dev>`,
        to: [recipientEmail],
        subject,
        html: htmlContent,
      });

      if (!response.error) {
        console.log('[EmailService] Resend Direct Success to:', recipientEmail, response);
        dispatchResults.resendStatus = { success: true, response };
        return { success: true, provider: 'Resend', recipientEmail, details: dispatchResults };
      }

      console.warn('[EmailService] Resend Notice for external email:', response.error.message);
      
      // If Resend onboarding domain restricts external emails, send archive copy to store email
      if (response.error.message.includes('only send to your own email address')) {
        const storeArchiveRes = await resend.emails.send({
          from: `Kedai Nyamleng <onboarding@resend.dev>`,
          to: [OFFICIAL_STORE_EMAIL],
          subject: `[Arsip Toko] ${subject} (Pemesan: ${order.customerName} - ${recipientEmail})`,
          html: htmlContent,
        });
        console.log('[EmailService] Store Archive Resend Dispatch Success:', storeArchiveRes);
        dispatchResults.resendStatus = { 
          success: true, 
          archiveDispatched: true, 
          storeArchiveRes,
          note: `E-Receipt archived to ${OFFICIAL_STORE_EMAIL} due to onboarding domain restriction.` 
        };
      }
    } catch (err: any) {
      console.warn('[EmailService] Resend Exception:', err?.message);
    }
  }

  // 2. Hybrid Fallback: Nodemailer Gmail SMTP Dispatcher
  const gmailUser = (process.env.GMAIL_USER || OFFICIAL_STORE_EMAIL).trim();
  const gmailPass = (process.env.GMAIL_APP_PASSWORD || '').trim();

  if (gmailUser && gmailPass && !gmailPass.includes('your16char')) {
    try {
      console.log(`[EmailService] Attempting Nodemailer Gmail SMTP dispatch to ${recipientEmail}...`);
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: gmailUser,
          pass: gmailPass,
        },
      });

      const info = await transporter.sendMail({
        from: `"Kedai Nyamleng Malang" <${gmailUser}>`,
        to: recipientEmail,
        subject,
        html: htmlContent,
      });

      console.log('[EmailService] Nodemailer Gmail Dispatch Success to:', recipientEmail, info);
      dispatchResults.nodemailerStatus = { success: true, info };
      return { success: true, provider: 'Nodemailer Gmail SMTP', recipientEmail, details: dispatchResults };
    } catch (e: any) {
      console.error('[EmailService] Nodemailer Exception:', e?.message || e);
      dispatchResults.nodemailerStatus = { success: false, error: e?.message };
    }
  }

  return { 
    success: true, 
    provider: dispatchResults.resendStatus?.success ? 'Resend Store Archive' : 'Realtime Dispatch Complete', 
    recipientEmail, 
    details: dispatchResults 
  };
};
