'use client'

import { Camera } from 'lucide-react'

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-slate-900 flex flex-col items-center justify-center px-4 text-center">
      <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mb-6">
        <Camera className="w-8 h-8 text-white" />
      </div>
      <h1 className="text-3xl font-bold text-white mb-2">WinGo 学情洞察</h1>
      <p className="text-slate-400 mb-8">拍一下，秒懂孩子学习情况</p>
      <a
        href="/xsc/analyze"
        className="px-8 py-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl text-lg transition-colors"
      >
        立即体验
      </a>
    </main>
  )
}
