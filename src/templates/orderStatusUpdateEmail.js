export const orderStatusUpdateEmail = (name, order) => {
  // Status wise icons and colors
  const statusConfig = {
    "pending": { color: "#FFA500", icon: "⏳" },
    "confirmed": { color: "#2196F3", icon: "✅" },
    "in-transit": { color: "#3F51B5", icon: "🚚" },
    "deliver-today": { color: "#9C27B0", icon: "📦" },
    "delivered": { color: "#2F4F3E", icon: "🎉" },
    "cancelled": { color: "#D32F2F", icon: "❌" },
  };

  const currentStatus = order.orderStatus.toLowerCase();
  const themeColor = statusConfig[currentStatus]?.color || "#2F4F3E";
  const statusIcon = statusConfig[currentStatus]?.icon || "📦";

  const itemsHtml = order.orderItems
    .map(
      (item) => `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 12px 8px; font-size: 14px;">${item.name}</td>
        <td align="center" style="padding: 12px 8px; font-size: 14px;">${item.quantity}</td>
        <td align="right" style="padding: 12px 8px; font-size: 14px; font-weight: bold;">₹${item.price.toLocaleString('en-IN')}</td>
      </tr>
    `
    )
    .join("");

  const deliveryDate = order.estimatedDeliveryDate
    ? new Date(order.estimatedDeliveryDate).toDateString()
    : "Will be updated soon";

  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; color: #333;">
      
      <div style="background-color: ${themeColor}; color: #ffffff; padding: 30px; text-align: center;">
        <div style="font-size: 40px; margin-bottom: 10px;">${statusIcon}</div>
        <h1 style="margin: 0; font-size: 22px; text-transform: uppercase; letter-spacing: 1px;">Order ${order.orderStatus}</h1>
        <p style="margin: 5px 0 0; opacity: 0.9;">Order ID: #${order._id}</p>
      </div>

      <div style="padding: 25px;">
        <p style="font-size: 16px;">Hi <b>${name}</b>,</p>
        <p style="line-height: 1.5; color: #555;">Great news! The status of your order at <b>Al-Ansar Dry Fruits</b> has been updated to <span style="color: ${themeColor}; font-weight: bold;">${order.orderStatus.toUpperCase()}</span>.</p>

        <div style="background-color: #f8f9fa; border-left: 4px solid ${themeColor}; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0; font-size: 14px;"><b>Expected Delivery:</b> ${deliveryDate}</p>
          <p style="margin: 5px 0 0; font-size: 13px; color: #666;">Payment Method: ${order.paymentMethod.toUpperCase()}</p>
        </div>

        <h3 style="font-size: 16px; color: #2F4F3E; border-bottom: 2px solid #f1f1f1; padding-bottom: 8px;">🛒 Order Summary</h3>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <thead>
            <tr style="background-color: #fcfcfc;">
              <th align="left" style="padding: 10px 8px; border-bottom: 2px solid #eee; font-size: 13px;">Product</th>
              <th align="center" style="padding: 10px 8px; border-bottom: 2px solid #eee; font-size: 13px;">Qty</th>
              <th align="right" style="padding: 10px 8px; border-bottom: 2px solid #eee; font-size: 13px;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2" align="right" style="padding: 15px 8px 5px; font-weight: bold;">Total Amount:</td>
              <td align="right" style="padding: 15px 8px 5px; font-weight: bold; color: #2F4F3E; font-size: 16px;">₹${order.totalPrice.toLocaleString('en-IN')}</td>
            </tr>
          </tfoot>
        </table>

        <div style="margin-top: 35px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
          <p style="font-size: 14px; color: #777; margin-bottom: 15px;">Thank you for shopping with us! 🌿</p>
          <div style="font-size: 12px; color: #aaa;">
            <b>Al-Ansar Dry Fruits</b><br/>
            Premium Quality You Can Trust
          </div>
        </div>
      </div>
    </div>
  `;
};