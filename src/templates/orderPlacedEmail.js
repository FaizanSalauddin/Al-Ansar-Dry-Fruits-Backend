export const orderPlacedEmail = (userName, order) => {
  const itemsHtml = order.orderItems
    .map(
      (item) => `
      <tr>
        <td>${item.name} × ${item.quantity}</td>
        <td align="right">₹${item.price * item.quantity}</td>
      </tr>
    `
    )
    .join("");

  return `
  <div style="font-family: Arial, sans-serif; max-width:600px; margin:auto;">
    <h2>Hi ${userName} 👋</h2>

    <p>Thank you for shopping with <b>Al-Ansar Dry Fruits</b>.</p>

    <p><b>Order ID:</b> ${order._id}</p>
    <p><b>Order Status:</b> ${order.orderStatus}</p>
    <p><b>Expected Delivery:</b> ${new Date(
      order.estimatedDeliveryDate
    ).toDateString()}</p>

    <h3>📦 Items</h3>
    <table width="100%">
      ${itemsHtml}
    </table>

    <hr/>

    <p><b>Items Total:</b> ₹${order.itemsPrice}</p>
    <p><b>Delivery:</b> ${
      order.shippingPrice === 0 ? "FREE" : `₹${order.shippingPrice}`
    }</p>
    <h3>Total Payable: ₹${order.totalPrice}</h3>

    <h4>🚚 Delivery Address</h4>
    <p>
      ${order.shippingAddress.name}<br/>
      ${order.shippingAddress.address}, ${order.shippingAddress.city}<br/>
      ${order.shippingAddress.state} - ${order.shippingAddress.pincode}<br/>
      📞 ${order.shippingAddress.phone}
    </p>

    <p>Payment Method: <b>Cash on Delivery</b></p>

    <p style="margin-top:30px;">
      We’ll notify you as your order moves forward 🚀
    </p>

    <p>— Team Al-Ansar</p>
  </div>
  `;
};
