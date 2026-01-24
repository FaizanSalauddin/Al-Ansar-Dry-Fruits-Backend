export const orderStatusUpdateEmail = (name, order) => {
  const itemsHtml = order.orderItems
    .map(
      (item) => `
        <tr>
          <td style="padding:8px;border:1px solid #ddd;">${item.name}</td>
          <td style="padding:8px;border:1px solid #ddd;">${item.quantity}</td>
          <td style="padding:8px;border:1px solid #ddd;">₹${item.price}</td>
        </tr>
      `
    )
    .join("");

  const deliveryDate = order.estimatedDeliveryDate
    ? new Date(order.estimatedDeliveryDate).toDateString()
    : "Will be updated soon";

  return `
    <div style="font-family:Arial,sans-serif;">
      <h2>📦 Order Status Update</h2>

      <p>Hi <b>${name}</b>,</p>

      <p>Your order <b>#${order._id}</b> status has been updated.</p>

      <h3>🔄 Current Status: <span style="color:green;">${order.orderStatus.toUpperCase()}</span></h3>

      <h3>🛒 Order Details</h3>
      <table style="border-collapse:collapse;width:100%;">
        <thead>
          <tr>
            <th style="padding:8px;border:1px solid #ddd;">Product</th>
            <th style="padding:8px;border:1px solid #ddd;">Qty</th>
            <th style="padding:8px;border:1px solid #ddd;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <p><b>Total Amount:</b> ₹${order.totalPrice}</p>
      <p><b>Expected Delivery:</b> ${deliveryDate}</p>

      <br/>
      <p>Thank you for shopping with <b>Al-Ansar Dry Fruits</b> 🌿</p>
    </div>
  `;
};
