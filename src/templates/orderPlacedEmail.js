export const orderPlacedEmail = (userName, order) => {
  const isOnline = order.paymentMethod === "online";
  
  const itemsHtml = order.orderItems
    .map(
      (item) => `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 10px 0;">
          <span style="font-weight: bold; color: #333;">${item.name}</span><br/>
          <span style="font-size: 12px; color: #666;">Qty: ${item.quantity}</span>
        </td>
        <td align="right" style="padding: 10px 0; font-weight: bold; color: #2F4F3E;">
          ₹${(item.price * item.quantity).toLocaleString('en-IN')}
        </td>
      </tr>
    `
    )
    .join("");

  return `
  <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width:600px; margin:auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden; color: #444;">
    
    <div style="background-color: #2F4F3E; color: #ffffff; padding: 25px; text-align: center;">
      <h1 style="margin: 0; font-size: 24px;">Order Confirmed!</h1>
      <p style="margin: 5px 0 0; opacity: 0.8;">Thank you for choosing Al-Ansar Dry Fruits</p>
    </div>

    <div style="padding: 20px;">
      <h2 style="color: #2F4F3E;">Hi ${userName} 👋</h2>
      <p>Your order has been successfully placed and is being processed.</p>

      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin-bottom: 20px; font-size: 14px;">
        <p style="margin: 5px 0;"><b>Order ID:</b> #${order._id}</p>
        <p style="margin: 5px 0;"><b>Expected Delivery:</b> ${new Date(order.estimatedDeliveryDate).toDateString()}</p>
        <p style="margin: 5px 0;"><b>Payment Method:</b> <span style="text-transform: uppercase;">${order.paymentMethod}</span></p>
      </div>

      <h3 style="border-bottom: 2px solid #2F4F3E; padding-bottom: 5px; color: #2F4F3E;">📦 Order Summary</h3>
      <table width="100%" cellpadding="0" cellspacing="0">
        ${itemsHtml}
      </table>

      <div style="margin-top: 20px; border-top: 2px solid #eee; padding-top: 10px;">
        <table width="100%">
          <tr>
            <td style="padding: 5px 0;">Items Total</td>
            <td align="right">₹${order.itemsPrice.toLocaleString('en-IN')}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0;">Delivery Charges</td>
            <td align="right">${order.shippingPrice === 0 ? "<span style='color:green;'>FREE</span>" : `₹${order.shippingPrice}`}</td>
          </tr>
          <tr style="font-size: 18px; font-weight: bold; color: #2F4F3E;">
            <td style="padding: 15px 0;">${isOnline ? "Amount Paid" : "Total Payable"}</td>
            <td align="right" style="padding: 15px 0;">₹${order.totalPrice.toLocaleString('en-IN')}</td>
          </tr>
        </table>
      </div>

      ${isOnline ? `
        <div style="background-color: #e7f4e8; color: #1e4620; padding: 10px; border-radius: 5px; text-align: center; font-size: 13px; margin-top: 10px;">
          ✅ <b>Payment Successful:</b> Your payment has been received via Online Payment.
        </div>
      ` : `
        <div style="background-color: #fff4e5; color: #663c00; padding: 10px; border-radius: 5px; text-align: center; font-size: 13px; margin-top: 10px;">
          🚚 <b>Cash on Delivery:</b> Please keep ₹${order.totalPrice} ready at the time of delivery.
        </div>
      `}

      <h3 style="border-bottom: 2px solid #2F4F3E; padding-bottom: 5px; color: #2F4F3E; margin-top: 25px;">🚚 Delivery Details</h3>
      <p style="font-size: 14px; line-height: 1.6; background-color: #fdfdfd; padding: 15px; border: 1px dashed #ccc;">
        <strong>${order.shippingAddress.name}</strong><br/>
        ${order.shippingAddress.address}, ${order.shippingAddress.city}<br/>
        ${order.shippingAddress.state} - ${order.shippingAddress.pincode}<br/>
        📞 ${order.shippingAddress.phone}
      </p>

      <p style="margin-top: 30px; text-align: center; font-size: 12px; color: #888;">
        If you have any questions, reply to this email or contact our support team.<br/>
        <b>Team Al-Ansar Dry Fruits</b>
      </p>
    </div>
  </div>
  `;
};