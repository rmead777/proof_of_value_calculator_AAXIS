import nodemailer from 'nodemailer';

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

export async function sendReportEmail(params: {
  to: string;
  subject: string;
  html: string;
  text: string;
  pdf?: Uint8Array;
  filename?: string;
}) {
  const host = requireEnv('SMTP_HOST');
  const port = Number(requireEnv('SMTP_PORT'));
  const user = requireEnv('SMTP_USER');
  const pass = requireEnv('SMTP_PASS');
  const from = requireEnv('EMAIL_FROM');

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  await transporter.sendMail({
    from,
    to: params.to,
    subject: params.subject,
    text: params.text,
    html: params.html,
    attachments: params.pdf
      ? [
          {
            filename: params.filename || 'roi-detailed-report.pdf',
            content: Buffer.from(params.pdf),
            contentType: 'application/pdf',
          },
        ]
      : [],
  });
}
