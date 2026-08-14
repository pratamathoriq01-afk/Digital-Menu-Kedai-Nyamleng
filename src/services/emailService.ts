import { OrderPayload, OFFICIAL_STORE_EMAIL, STORE_LOCATION } from '@/types/pos';
import { Resend } from 'resend';
import nodemailer from 'nodemailer';

const formatRupiah = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const generateEmailHTML = (order: OrderPayload): string => {
  const orderDateObj = new Date(order.createdAt);
  const formattedDate = orderDateObj.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const formattedTime = orderDateObj.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const totalItemCount = order.items.reduce((acc, item) => acc + item.quantity, 0);

  const itemRowsHtml = order.items
    .map(
      (item) => `
      <tr style="border-bottom: 1px solid #f0f0f0;">
        <td style="padding: 10px 0; font-size: 13px; color: #2D2D2D; font-weight: 600; text-transform: uppercase;">
          ${item.menuItem.name}
          ${
            item.selectedVariants.length > 0
              ? `<div style="font-size: 11px; color: #1976d2; font-weight: normal; margin-top: 2px;">
                  ${item.selectedVariants.map((v) => `+ ${v.optionName.toUpperCase()}`).join('<br/>')}
                 </div>`
              : ''
          }
          ${
            item.selectedAddOns.length > 0
              ? `<div style="font-size: 11px; color: #e64a19; font-weight: normal; margin-top: 2px;">
                  ${item.selectedAddOns.map((a) => `+ TOPPING: ${a.optionName.toUpperCase()}`).join('<br/>')}
                 </div>`
              : ''
          }
          ${
            item.itemNotes
              ? `<div style="font-size: 11px; color: #c04800; font-style: italic; font-weight: normal; margin-top: 2px;">
                  Note: ${item.itemNotes}
                 </div>`
              : ''
          }
        </td>
        <td style="padding: 10px 0; font-size: 13px; color: #555; text-align: center; font-weight: bold; vertical-align: top;">
          ${item.quantity}x
        </td>
        <td style="padding: 10px 0; font-size: 13px; color: #2D2D2D; text-align: right; font-weight: bold; vertical-align: top;">
          ${formatRupiah(item.itemSubtotal).replace('Rp', '').trim()}
        </td>
      </tr>
    `
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>Receipt #${order.orderId}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f5f7; margin: 0; padding: 20px 10px; color: #2D2D2D;">
        
        <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; padding: 24px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #eef0f3;">
          
          <!-- Top Order Bar -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="font-size: 13px; color: #666;">
                <span style="font-size: 11px; text-transform: uppercase; color: #888; font-weight: bold; display: block;">#Order</span>
                <strong style="font-size: 15px; color: #111;">${order.orderId}</strong>
              </td>
              <td style="font-size: 13px; color: #666; text-align: right; font-weight: 500; vertical-align: bottom;">
                ${formattedDate} | ${formattedTime}
              </td>
            </tr>
          </table>

          <!-- Brand Hero Banner Card with Logo Badge -->
          <div style="background-color: #f8f9fa; border-radius: 16px; padding: 20px; text-align: center; margin-bottom: 20px; border: 1px solid #eaeaea;">
            
            <!-- Official Logo Header Badge -->
            <div style="display: inline-block; background: #ffffff; padding: 14px 28px; border-radius: 16px; border: 1px solid #e0e0e0; margin-bottom: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.03);">
              <div style="font-size: 20px; font-weight: 900; color: #006837; letter-spacing: 4px; line-height: 1;">K E D A I</div>
              <div style="font-size: 10px; font-weight: 800; color: #d84315; letter-spacing: 2px; margin: 3px 0;">- EAST 2026 -</div>
              <div style="font-size: 24px; font-weight: 900; color: #d84315; letter-spacing: 1px; line-height: 1;">NYAMLENG</div>
            </div>

            <div style="font-size: 14px; font-weight: bold; color: #2D2D2D; margin-top: 4px;">Kedai Nyamleng Malang</div>

            <table style="width: 100%; max-width: 380px; margin: 12px auto 0 auto; font-size: 12px; color: #555; text-align: left; border-collapse: collapse;">
              <tr>
                <td style="width: 100px; color: #777; padding: 2px 0;">Phone Number</td>
                <td style="padding: 2px 0;">: <strong>085113661387</strong></td>
              </tr>
              <tr>
                <td style="color: #777; padding: 2px 0; vertical-align: top;">Address</td>
                <td style="padding: 2px 0;">: ${STORE_LOCATION} 65139</td>
              </tr>
            </table>
          </div>

          <!-- Total Spent Callout Card -->
          <div style="text-align: center; margin-bottom: 24px; padding: 10px 0;">
            <div style="font-size: 12px; font-weight: bold; text-transform: uppercase; color: #777; letter-spacing: 0.5px; margin-bottom: 6px;">Total Spent</div>
            <div style="font-size: 32px; font-weight: 900; color: #111111; letter-spacing: -0.5px; margin-bottom: 16px;">
              ${formatRupiah(order.totalAmount)},00
            </div>
            
            <a href="http://localhost:3000" target="_blank" style="display: inline-block; background-color: #e64a19; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: bold; padding: 14px 32px; border-radius: 12px; box-shadow: 0 4px 12px rgba(230, 74, 25, 0.25); text-align: center; width: 80%; max-width: 320px;">
              View your order status
            </a>
          </div>

          <!-- Order Information Section -->
          <div style="background-color: #f8f9fa; border-radius: 14px; padding: 16px; margin-bottom: 20px; border: 1px solid #eaeaea;">
            <div style="font-size: 13px; font-weight: bold; color: #111; margin-bottom: 10px;">Order Information</div>
            <table style="width: 100%; font-size: 12px; color: #333; border-collapse: collapse;">
              <tr>
                <td style="width: 120px; color: #666; padding: 3px 0;">Customer Name</td>
                <td style="padding: 3px 0;">: <strong>${order.customerName}</strong></td>
              </tr>
              <tr>
                <td style="color: #666; padding: 3px 0;">Phone Number</td>
                <td style="padding: 3px 0;">: ${order.customerPhone || '-'}</td>
              </tr>
              <tr>
                <td style="color: #666; padding: 3px 0;">Order Mode</td>
                <td style="padding: 3px 0;">: <strong>${order.orderType} ${order.deliveryCourier ? `(${order.deliveryCourier.replace('_', ' ')})` : ''}</strong></td>
              </tr>
            </table>
          </div>

          <!-- Order Details Section (Items Table) -->
          <div style="background-color: #f8f9fa; border-radius: 14px; padding: 16px; margin-bottom: 20px; border: 1px solid #eaeaea;">
            <div style="font-size: 13px; font-weight: bold; color: #111; margin-bottom: 12px;">Order Details</div>
            
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="border-bottom: 1.5px solid #ddd; font-size: 11px; text-transform: uppercase; color: #777;">
                  <th style="text-align: left; padding-bottom: 8px;">Item Name</th>
                  <th style="text-align: center; padding-bottom: 8px; width: 50px;">Qty</th>
                  <th style="text-align: right; padding-bottom: 8px; width: 90px;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${itemRowsHtml}
              </tbody>
            </table>

            <table style="width: 100%; border-collapse: collapse; margin-top: 12px; pt: 8px; border-top: 1px solid #e0e0e0; font-size: 13px; font-weight: bold; color: #111;">
              <tr>
                <td style="padding-top: 8px;">Total Item</td>
                <td style="text-align: center; padding-top: 8px; width: 50px;">${totalItemCount}</td>
                <td style="text-align: right; padding-top: 8px; width: 90px;">${formatRupiah(order.subtotal).replace('Rp', '').trim()}</td>
              </tr>
            </table>
          </div>

          <!-- Total & Tax Breakdown Section -->
          <div style="background-color: #f8f9fa; border-radius: 14px; padding: 16px; margin-bottom: 20px; border: 1px solid #eaeaea;">
            <div style="font-size: 13px; font-weight: bold; color: #111; margin-bottom: 10px;">Total Breakdown</div>
            
            <table style="width: 100%; font-size: 12px; color: #444; border-collapse: collapse;">
              <tr>
                <td style="padding: 3px 0;">Subtotal</td>
                <td style="text-align: right; padding: 3px 0;">${formatRupiah(order.subtotal).replace('Rp', '').trim()}</td>
              </tr>

              ${
                order.discountAmount > 0
                  ? `<tr>
                      <td style="padding: 3px 0; color: #2e7d32; font-weight: bold;">Diskon Voucher (${order.appliedVoucherCode || 'PROMO'})</td>
                      <td style="text-align: right; padding: 3px 0; color: #2e7d32; font-weight: bold;">-${formatRupiah(order.discountAmount).replace('Rp', '').trim()}</td>
                     </tr>`
                  : ''
              }

              <tr>
                <td style="padding: 3px 0;">PB1 (Resto Tax 10%)</td>
                <td style="text-align: right; padding: 3px 0;">${formatRupiah(order.taxAmount).replace('Rp', '').trim()}</td>
              </tr>
              <tr>
                <td style="padding: 3px 0;">Rounding Total</td>
                <td style="text-align: right; padding: 3px 0;">0</td>
              </tr>
              <tr style="border-top: 1.5px solid #ddd; font-weight: bold; font-size: 14px; color: #111;">
                <td style="padding-top: 8px;">Grand Total (Incl. Tax)</td>
                <td style="text-align: right; padding-top: 8px; color: #e64a19;">${formatRupiah(order.totalAmount).replace('Rp', '').trim()}</td>
              </tr>
            </table>
          </div>

          <!-- Payment Method & Circular PAID Stamp -->
          <div style="position: relative; background-color: #ffffff; border-radius: 14px; padding: 16px; border: 1px solid #eaeaea; margin-bottom: 20px;">
            <div style="font-size: 11px; text-transform: uppercase; color: #777; font-weight: bold; margin-bottom: 4px;">Payment Method</div>
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
            Thanks for your payment • Kedai Nyamleng Malang
          </div>

        </div>
      </body>
    </html>
  `;
};

export const sendOrderReceiptEmail = async (order: OrderPayload) => {
  const htmlContent = generateEmailHTML(order);
  const subject = `Receipt #${order.orderId} - Kedai Nyamleng`;

  // Opsi 1: Resend (Jika API Key ada)
  if (process.env.RESEND_API_KEY && !process.env.RESEND_API_KEY.includes('your_resend_api_key')) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const response = await resend.emails.send({
      from: `Kedai Nyamleng <onboarding@resend.dev>`,
      to: [order.customerEmail],
      subject,
      html: htmlContent,
    });
    return { provider: 'Resend', response };
  }

  // Opsi 2: Nodemailer Gmail SMTP
  if (
    process.env.GMAIL_USER &&
    process.env.GMAIL_APP_PASSWORD &&
    !process.env.GMAIL_APP_PASSWORD.includes('your16char')
  ) {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    const info = await transporter.sendMail({
      from: `"Kedai Nyamleng Malang" <${process.env.GMAIL_USER}>`,
      to: order.customerEmail,
      subject,
      html: htmlContent,
    });

    return { provider: 'Nodemailer Gmail SMTP', info };
  }

  console.log(`[SIMULATED EMAIL DISPATCH] Sent receipt for #${order.orderId} to ${order.customerEmail}`);
  return { provider: 'Simulation', status: 'SIMULATED' };
};
