export const welcomeEmail = (name) => {
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2 style="color:#2F4F3E;">Welcome to Al-Ansar Dry Fruits 🌿</h2>

      <p>Hi <b>${name}</b>,</p>

      <p>
        Thank you for creating an account with <b>Al-Ansar</b>.
        We are excited to serve you premium quality dry fruits with freshness & trust.
      </p>

      <p>
        🛒 Start shopping now and enjoy healthy goodness delivered to your doorstep.
      </p>

      <p style="margin-top:30px;">
        Regards,<br/>
        <b>Al-Ansar Team</b>
      </p>

      <hr/>
      <p style="font-size:12px;color:gray;">
        This is an automated email. Please do not reply.
      </p>
    </div>
  `;
};
