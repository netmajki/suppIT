import "server-only";
import nodemailer from "nodemailer";
import type { EmailConfig } from "./config";

export type EmailMessage = { to: string; subject: string; text: string; html: string };

export async function sendEmail(config: EmailConfig, msg: EmailMessage) {
  if (config.provider === "none") throw new Error("E-mail nie jest skonfigurowany");

  if (config.provider === "resend") {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${config.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: config.from, to: [msg.to], subject: msg.subject, text: msg.text, html: msg.html }),
    });
    if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
    return;
  }

  const transport = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.user ? { user: config.user, pass: config.pass } : undefined,
  });
  await transport.sendMail({ from: config.from, ...msg });
}
