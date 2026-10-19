import * as React from 'react'
import { Img, Text } from '@react-email/components'

export const emailStyles = {
  main: { backgroundColor: '#ffffff', fontFamily: 'Sora, Arial, sans-serif' },
  container: { maxWidth: '560px', padding: '40px 24px' },
  h1: { fontSize: '24px', fontWeight: '600' as const, color: '#29211b', margin: '28px 0 20px' },
  text: { fontSize: '15px', color: '#665b50', lineHeight: '1.7', margin: '0 0 24px' },
  link: { color: '#286b5d', textDecoration: 'underline' },
  button: { backgroundColor: '#286b5d', color: '#ffffff', fontSize: '14px', border: '1px solid #286b5d', borderRadius: '4px', padding: '14px 24px', textDecoration: 'none' },
  footer: { fontSize: '12px', color: '#665b50', lineHeight: '1.6', margin: '32px 0 0' },
}

export const EmailBrand = () => <>
  <Img src="https://pelicanexplorer.com/pelican-logo.png" width="56" height="56" alt="Pelican" />
  <Text style={{ ...emailStyles.text, color: emailStyles.h1.color, fontWeight: 600, margin: '12px 0 0' }}>Pelican Tours and Safari</Text>
</>