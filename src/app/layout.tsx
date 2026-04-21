import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/lib/auth-context'

export const metadata: Metadata = {
  title: 'WinGo 学情洞察 - AI家庭学情分析工具',
  description: 'WinGo 学情洞察是一款AI驱动的家庭学情分析软件工具，帮助家长客观了解孩子的学习情况。',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `window.difyChatbotConfig = { token: 'app-WingoXiaoning2026Chatbot', baseUrl: 'http://100.106.90.55:8080' }`,
          }}
        />
        <script src="http://100.106.90.55:8080/embed.min.js" id="x7nLk9mQpR2vW4tY8sZ" />
      </head>
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
