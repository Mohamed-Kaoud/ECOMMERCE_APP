import nodemailer from "nodemailer";

import Mail from "nodemailer/lib/mailer";

export const sendEmail = async (mailOptions: Mail.Options) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.PASSWORD
    },
  });

  const info = await transporter.sendMail({
    from: `"Mohamed Elsayed" <${process.env.EMAIL}>`, 
    ...mailOptions
  });

  console.log("Message sent: %s", info.messageId);

  return info.accepted.length > 0 ? true : false
};

export const generateOtp = async () => {
  return Math.floor(Math.random() * 900000 + 100000)
}
