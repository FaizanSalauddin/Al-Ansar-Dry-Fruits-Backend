import dotenv from "dotenv";
dotenv.config();
import { Resend } from "resend";

console.log(process.env.RESEND_API_KEY);
const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async ({ to, subject, html }) => {
  try {
    const data = await resend.emails.send({
      from: "Al-Ansar Stores <noreply@al-ansar.webxprojects.com>",
      to,
      subject,
      html,
    });

    console.log("Email sent Successfully");
  } catch (error) {
    console.error("Email error:", error);
  }
};

export default sendEmail;
