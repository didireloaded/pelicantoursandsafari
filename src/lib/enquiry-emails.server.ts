// Server-only: renders and sends the enquiry emails. Never import from client
// components — this module reads RESENDER_API_KEY.
import * as React from 'react'
import { render } from '@react-email/render'
import { enquiryInput, type EnquiryInput } from './enquiry-input'
import { sendResendEmail } from './email-templates/resend'
import { EnquiryConfirmationEmail } from './email-templates/enquiry-confirmation'
import { EnquiryNotificationEmail } from './email-templates/enquiry-notification'
import { company, safaris } from './pelican'

const NOTIFICATION_TO = company.email

export interface EnquiryEmailResult {
  traveller: { sent: boolean; reason?: string }
  pelican: { sent: boolean; reason?: string }
}

/**
 * Best-effort: validates the submitted brief again for the email fields, then
 * sends the traveller confirmation and the Pelican notification. Failures are
 * logged and reported per email; they never block the enquiry receipt.
 */
export async function sendEnquiryEmails(
  data: unknown,
  reference: string
): Promise<EnquiryEmailResult> {
  const parsed = enquiryInput.safeParse(data)
  if (!parsed.success) {
    return {
      traveller: { sent: false, reason: "invalid_input" },
      pelican: { sent: false, reason: "invalid_input" },
    }
  }
  const input: EnquiryInput = parsed.data
  const safariName = input.safari_slug
    ? safaris.find((s) => s.slug === input.safari_slug)?.name ?? null
    : null

  const result: EnquiryEmailResult = {
    traveller: { sent: false, reason: "no_email_address" },
    pelican: { sent: false },
  }

  if (input.email) {
    try {
      const element = React.createElement(EnquiryConfirmationEmail, {
        name: input.name,
        reference,
        contactPreference: input.contact_preference,
        safariName,
      })
      const confirmation = await sendResendEmail({
        to: input.email,
        subject: `We received your safari enquiry — ${reference}`,
        html: await render(element),
        text: await render(element, { plainText: true }),
        replyTo: NOTIFICATION_TO,
        idempotencyKey: `enquiry/${reference}/traveller`,
      })
      result.traveller = confirmation.sent
        ? { sent: true }
        : { sent: false, reason: confirmation.reason }
    } catch (error) {
      console.error("Traveller confirmation email failed:", error)
      result.traveller = { sent: false, reason: "exception" }
    }
  }

  try {
    const element = React.createElement(EnquiryNotificationEmail, {
      reference,
      name: input.name,
      email: input.email,
      phone: input.phone,
      residence: input.residence,
      contactPreference: input.contact_preference,
      safariName,
      brief: input.brief,
    })
    const notification = await sendResendEmail({
      to: NOTIFICATION_TO,
      idempotencyKey: `enquiry/${reference}/pelican`,
      ...(input.email ? { replyTo: input.email } : {}),
      subject: `New safari enquiry ${reference} — ${input.name}`,
      html: await render(element),
      text: await render(element, { plainText: true }),
    })
    result.pelican = notification.sent
      ? { sent: true }
      : { sent: false, reason: notification.reason }
  } catch (error) {
    console.error("Pelican notification email failed:", error)
    result.pelican = { sent: false, reason: "exception" }
  }

  return result
}
