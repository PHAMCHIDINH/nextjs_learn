import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/providers/auth-provider'
import './globals.css'

const inter = Inter({ 
  subsets: ["latin", "vietnamese"],
  variable: '--font-inter'
});

export const metadata: Metadata = {
  title: 'Chợ Sinh Viên - Mua bán nội bộ sinh viên đại học',
  description: 'Nền tảng mua bán đồ cũ dành cho sinh viên cùng trường. Giáo trình, đồ điện tử, đồ phòng trọ với giá tốt nhất.',
  generator: 'v0.app',
  keywords: ['chợ sinh viên', 'mua bán sinh viên', 'đồ cũ sinh viên', 'giáo trình cũ', 'marketplace đại học'],
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#22c55e',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="vi">
      <body suppressHydrationWarning className={`${inter.variable} font-sans antialiased`}>
        <AuthProvider>{children}</AuthProvider>
        <Toaster position="top-center" richColors />
        <Analytics />
      </body>
    </html>
  )
}
