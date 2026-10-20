// Server-only: reads RESENDER_API_KEY. Never import from client components.
//
// Sends app emails (enquiry confirmations and notifications) through Resend.
// Auth/account emails stay on the managed Lovable email helper (send-email.ts).

const FROM_NAME = "Pelican Tours and Safari"
// DKIM and primary sending CNAME verified in Resend on 20 October 2026.
// The secondary sending CNAME may finish verifying independently.
const FROM_ADDRESS = "enquiries@pelicanexplorer.com"

export interface SendResendEmailOptions {
  to: string
  subject: string
  html: string
  text: string
  replyTo?: string
}

export type SendResendEmailResult =
  | { sent: true }
  | { sent: false; reason: "key_missing" | "provider_error"; status?: number }

export async function sendResendEmail(
  options: SendResendEmailOptions
): Promise<SendResendEmailResult> {
  const apiKey = process.env["RESENDER_API_KEY"]
  if (!apiKey) {
    console.error("Resend send skipped: RESENDER_API_KEY is not configured")
    return { sent: false, reason: "key_missing" }
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `${FROM_NAME} <${FROM_ADDRESS}>`,
      to: [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text,
      ...(options.replyTo ? { reply_to: options.replyTo } : {}),
    }),
    signal: AbortSignal.timeout(15000),
  })

  if (!response.ok) {
    const body = await response.text()
    console.error(`Resend send failed [${response.status}]: ${body}`)
    return { sent: false, reason: "provider_error", status: response.status }
  }

  return { sent: true }
}
