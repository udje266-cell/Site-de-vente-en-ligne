export type MailMessage = { to: string; subject: string; text: string };

export interface Mailer {
  send(msg: MailMessage): Promise<void>;
}

class ConsoleMailer implements Mailer {
  async send(msg: MailMessage) {
    console.info(`[mail] to=${msg.to} subject="${msg.subject}"\n${msg.text}`);
  }
}

/** Implémentation Resend (https://resend.com) via son API HTTP. */
class ResendMailer implements Mailer {
  constructor(
    private apiKey: string,
    private from: string,
  ) {}
  async send(msg: MailMessage) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: this.from, to: [msg.to], subject: msg.subject, text: msg.text }),
    });
    if (!res.ok) throw new Error(`Resend error ${res.status}`);
  }
}

export function getMailer(): Mailer {
  if (process.env.MAIL_PROVIDER === "resend" && process.env.RESEND_API_KEY) {
    return new ResendMailer(process.env.RESEND_API_KEY, process.env.MAIL_FROM ?? "no-reply@example.com");
  }
  return new ConsoleMailer();
}
