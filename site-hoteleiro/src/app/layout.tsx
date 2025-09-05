import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Site Hoteleiro - Construtor de Sites para Hotéis',
  description: 'Crie sites profissionais para seu hotel de forma simples e rápida. Templates modernos e editor inline para personalização completa.',
  keywords: 'site hotel, construtor site hotel, website hotel, reservas online, booking engine',
  authors: [{ name: 'Site Hoteleiro' }],
  viewport: 'width=device-width, initial-scale=1',
  openGraph: {
    title: 'Site Hoteleiro - Construtor de Sites para Hotéis',
    description: 'Crie sites profissionais para seu hotel de forma simples e rápida.',
    type: 'website',
    locale: 'pt_BR',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}