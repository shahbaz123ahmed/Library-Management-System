const nodemailer = require("nodemailer");

const createTransport = () => {
  if (!process.env.SMTP_HOST) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const sendReminder = async ({ to, subject, html }) => {
  const transport = createTransport();
  if (!transport) {
    return false;
  }
  await transport.sendMail({
    from: process.env.SMTP_FROM || "no-reply@library.local",
    to,
    subject,
    html,
  });
  return true;
};

module.exports = { sendReminder };
