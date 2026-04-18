"use server";

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export type SendEmailState =
  | { status: "idle" }
  | { status: "sent" }
  | { status: "error"; message: string };

export async function sendEmail(
  _prev: SendEmailState,
  formData: FormData,
): Promise<SendEmailState> {
  const name = formData.get("name")?.toString().trim() ?? "";
  const email = formData.get("email")?.toString().trim() ?? "";
  const subject = formData.get("subject")?.toString().trim() ?? "(no subject)";
  const message = formData.get("message")?.toString().trim() ?? "";

  if (!name || !email || !message) {
    return { status: "error", message: "Please fill in all required fields." };
  }

  const { error } = await resend.emails.send({
    from: "Reach Out Form <onboarding@resend.dev>",
    to: "alksud@gmail.com",
    replyTo: email,
    subject: `[Portfolio] ${subject}`,
    text: `From: ${name} <${email}>\n\n${message}`,
    html: `
      <p><strong>From:</strong> ${name} &lt;${email}&gt;</p>
      <p><strong>Subject:</strong> ${subject}</p>
      <hr />
      <p style="white-space:pre-wrap">${message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
    `,
  });

  if (error) {
    return { status: "error", message: error.message };
  }

  return { status: "sent" };
}
