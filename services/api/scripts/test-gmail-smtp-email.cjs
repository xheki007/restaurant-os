const nodemailer = require("nodemailer");
require("dotenv/config");

async function main() {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 465),
    secure: String(process.env.SMTP_SECURE || "true") !== "false",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const result = await transporter.sendMail({
    from: `${process.env.SMTP_FROM_NAME} <${process.env.SMTP_FROM_EMAIL}>`,
    to: process.env.SMTP_USER,
    subject: "Restaurant Antica - Gmail SMTP test",
    text: "Ky eshte test real nga Restaurant OS per Gmail SMTP.",
    html: "<p>Ky eshte test real nga <strong>Restaurant OS</strong> per Gmail SMTP.</p>",
  });

  console.log(JSON.stringify({
    ok: true,
    messageId: result.messageId,
    accepted: result.accepted,
    rejected: result.rejected,
    response: result.response,
  }, null, 2));
}

main().catch((error) => {
  console.error(JSON.stringify({
    ok: false,
    message: error.message,
  }, null, 2));
  process.exitCode = 1;
});