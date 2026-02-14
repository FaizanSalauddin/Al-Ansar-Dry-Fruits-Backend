// import nodemailer from "nodemailer";

// const sendEmail = async ({ to, subject, html }) => {
//   const transporter = nodemailer.createTransport({
//     service: "gmail",
//     auth: {
//       user: process.env.EMAIL_USER,
//       pass: process.env.EMAIL_PASS,
//     },
//   });

//   const mailOptions = {
//     from: `"Al-Ansar Stores" <${process.env.EMAIL_USER}>`,
//     to,
//     subject,
//     html,
//   };

//   await transporter.sendMail(mailOptions);
// };

// export default sendEmail;
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async ({ to, subject, html }) => {
  try {
    await resend.emails.send({
      from: "Al-Ansar Stores <onboarding@resend.dev>",
      to,
      subject,
      html,
    });
  } catch (error) {
    console.error("Email error:", error);
  }
};

export default sendEmail;
