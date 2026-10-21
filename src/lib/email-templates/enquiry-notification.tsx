import * as React from 'react'
import { Html, Link, Text } from '@react-email/components'
import { EmailBrand, emailStyles } from './brand'

export interface EnquiryNotificationProps {
  reference: string
  name: string
  email: string | null
  phone: string | null
  residence: string | null
  contactPreference: string
  safariName: string | null
  brief: string
}

/** Sent to Pelican's info@ inbox when a new Safari Brief arrives. */
export const EnquiryNotificationEmail = ({
  reference,
  name,
  email,
  phone,
  residence,
  contactPreference,
  safariName,
  brief,
}: EnquiryNotificationProps) => (
  <Html>
    <EmailBrand />
    <Text style={emailStyles.h1}>New safari enquiry — {reference}</Text>
    <Text style={emailStyles.text}>
      <strong>{name}</strong> sent a Safari Brief through the website.
    </Text>
    <Text style={emailStyles.text}>
      Email: {email ?? "—"}
      <br />
      Phone: {phone ?? "—"}
      <br />
      Residence: {residence ?? "—"}
      <br />
      Prefers to be contacted via: {contactPreference}
      <br />
      Inspired by: {safariName ?? "—"}
    </Text>
    <Text style={{ ...emailStyles.text, whiteSpace: 'pre-wrap' }}>{brief}</Text>
    <Text style={emailStyles.text}>
      Open the enquiry in your dashboard:{' '}
      <Link style={emailStyles.link} href="https://pelicantoursandsafari.com/dashboard">
        pelicantoursandsafari.com/dashboard
      </Link>
    </Text>
    <Text style={emailStyles.footer}>
      This notification is sent automatically when a traveller submits a Safari Brief on
      pelicantoursandsafari.com.
    </Text>
  </Html>
)
