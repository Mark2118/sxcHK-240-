'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  BarChart3,
  Target,
  Award,
  Zap,
  ArrowLeft,
  Share2,
  ChevronRight,
  Star,
  BookOpen,
  FileDown,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

interface MonthlyData {
  success: boolean
  data?: {
    period: { start: string; end: string }
    totalReports: number
    avgScore: number
    weakPointsTop3: Array<{ name: string; count: number }>
    bestImprovementModule: {
      module: string
      currentAvg: number
      prevAvg: number
      improvement: number
    } | null
    monthOverMonth: {
      reportCountChange: number
      avgScoreChange: number
      prevMonthReports: number
      prevMonthAvgScore: number
    }
  }
  error?: string
}

function MonthlyContent() {
  const { token, user } = useAuth()
  const [data, setData] = useState<MonthlyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [shareToast, setShareToast] = useState(false)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }
    const load = async () => {
      try {
        const res = await fetch('/xsc/api/summary/monthly', {
          headers: { Authorization: `Bearer ${token}` },
        })
        const json = await res.json()
        setData(json)
      } catch (e) {
        setData({ success: false, error: '加载失败' })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [token])

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setShareToast(true)
      setTimeout(() => setShareToast(false), 2000)
    } catch {
      // fallback
    }
  }

  const handleExportPDF = async () => {
    if (!token) return
    setExporting(true)
    try {
      const res = await fetch('/xsc/api/report/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ type: 'monthly' }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        alert(json.error || '导出失败')
        return
      }
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const filename = res.headers.get('content-disposition')?.match(/filename="([^"]+)"/)?.[1] || 'WinGo月度学情总结.pdf'
      a.download = decodeURIComponent(filename)
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (e) {
      alert('导出失败，请重试')
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-blue-800 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">加载月度总结...</p>
        </div>
      </main>
    )
  }

  if (!token) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <Calendar className="w-12 h-12 text-blue-800 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">请先登录</h2>
          <p className="text-gray-500 mb-6">登录后查看月度学情总结</p>
          <button
            onClick={() => {
              if (process.env.NODE_ENV === 'development') {
                const mockCode = 'mock_wx_code_' + Date.now()
                fetch('/xsc/api/auth/wechat', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ code: mockCode }),
                })
                  .then((r) => r.json())
                  .then((d) => {
                    if (d.success && d.token) {
                      localStorage.setItem('xsc_token', d.token)
                      window.location.reload()
                    }
                  })
              } else {
                window.location.href = '/xsc/api/auth/wechat?redirect=' + encodeURIComponent(window.location.pathname)
              }
            }}
            className="px-5 py-2.5 bg-blue-900 text-white rounded-xl text-sm font-medium"
          >
            登录
          </button>
        </div>
      </main>
    )
  }

  if (!data?.success || data.error) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <Target className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">加载失败</h2>
          <p className="text-gray-500">{data?.error || '请稍后重试'}</p>
        </div>
      </main>
    )
  }

  const d = data.data!
  const periodLabel = `${d.period.start.slice(0, 7).replace('-', '年')}月`
  const scoreColor = d.avgScore >= 85 ? 'text-green-600' : d.avgScore >= 70 ? 'text-amber-600' : 'text-red-600'
  const scoreBg = d.avgScore >= 85 ? 'bg-green-50' : d.avgScore >= 70 ? 'bg-amber-50' : 'bg-red-50'

  const ReportChangeIcon = d.monthOverMonth.reportCountChange > 0
    ? TrendingUp
    : d.monthOverMonth.reportCountChange < 0
    ? TrendingDown
    : Minus
  const ScoreChangeIcon = d.monthOverMonth.avgScoreChange > 0
    ? TrendingUp
    : d.monthOverMonth.avgScoreChange < 0
    ? TrendingDown
    : Minus

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/xsc" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-900 to-blue-700 rounded-xl flex items-center justify-center text-white font-bold text-lg">
              W
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">WinGo 学情洞察</h1>
              <p className="text-xs text-gray-500">月度学情总结</p>
            </div>
          </a>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <Share2 size={16} />
              <span className="hidden sm:inline">分享</span>
            </button>
          </div>
        </div>
      </header>

      {/* Share Toast */}
      {shareToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg">
          链接已复制到剪贴板
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* 月份标题 */}
        <div className="bg-gradient-to-r from-blue-900 to-blue-700 rounded-2xl p-6 text-white mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Calendar size={18} className="opacity-80" />
                <span className="text-sm opacity-90">{d.period.start} ~ {d.period.end}</span>
              </div>
              <h2 className="text-2xl font-bold">{user?.nickname || '孩子'} 的 {periodLabel}学情总结</h2>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold">{d.totalReports}</div>
              <div className="text-sm opacity-80">次分析</div>
            </div>
          </div>
        </div>

        {/* 核心指标 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* 平均掌握度 */}
          <div className={`${scoreBg} rounded-2xl p-6 border border-gray-100`}>
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 size={18} className={scoreColor} />
              <span className="text-sm font-medium text-gray-700">平均掌握度</span>
            </div>
            <div className={`text-4xl font-bold ${scoreColor}`}>{d.avgScore}</div>
            <div className="text-xs text-gray-500 mt-1">%</div>
            <div className="flex items-center gap-1 mt-2">
              <ScoreChangeIcon size={14} className={d.monthOverMonth.avgScoreChange >= 0 ? 'text-green-600' : 'text-red-600'} />
              <span className={`text-xs font-medium ${d.monthOverMonth.avgScoreChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {d.monthOverMonth.avgScoreChange >= 0 ? '+' : ''}{d.monthOverMonth.avgScoreChange}%
              </span>
              <span className="text-xs text-gray-400">环比</span>
            </div>
          </div>

          {/* 分析次数 */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <Zap size={18} className="text-blue-800" />
              <span className="text-sm font-medium text-gray-700">分析次数</span>
            </div>
            <div className="text-4xl font-bold text-gray-900">{d.totalReports}</div>
            <div className="text-xs text-gray-500 mt-1">次</div>
            <div className="flex items-center gap-1 mt-2">
              <ReportChangeIcon size={14} className={d.monthOverMonth.reportCountChange >= 0 ? 'text-green-600' : 'text-red-600'} />
              <span className={`text-xs font-medium ${d.monthOverMonth.reportCountChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {d.monthOverMonth.reportCountChange >= 0 ? '+' : ''}{d.monthOverMonth.reportCountChange}
              </span>
              <span className="text-xs text-gray-400">环比</span>
            </div>
          </div>

          {/* 进步最大模块 */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <Award size={18} className="text-amber-600" />
              <span className="text-sm font-medium text-gray-700">进步最大模块</span>
            </div>
            {d.bestImprovementModule ? (
              <>
                <div className="text-xl font-bold text-gray-900">{d.bestImprovementModule.module}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {d.bestImprovementModule.prevAvg}% → {d.bestImprovementModule.currentAvg}%
                </div>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp size={14} className="text-green-600" />
                  <span className="text-xs font-medium text-green-600">+{d.bestImprovementModule.improvement}%</span>
                </div>
              </>
            ) : (
              <div className="text-sm text-gray-400">数据不足，继续分析以获取趋势</div>
            )}
          </div>
        </div>

        {/* 薄弱点 TOP3 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Target size={18} className="text-red-500" />
            <h3 className="font-semibold text-gray-900">本月重点薄弱点 TOP3</h3>
          </div>
          {d.weakPointsTop3.length > 0 ? (
            <div className="space-y-3">
              {d.weakPointsTop3.map((wp, i) => (
                <div key={i} className="flex items-center gap-4 p-4 bg-red-50 rounded-xl">
                  <div className="w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-sm font-bold">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{wp.name}</div>
                    <div className="text-xs text-gray-500">出现 {wp.count} 次</div>
                  </div>
                  <ChevronRight size={16} className="text-gray-400" />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Star className="w-10 h-10 text-amber-400 mx-auto mb-3" />
              <p className="text-sm text-gray-500">本月暂无薄弱点记录，继续上传作业获取分析</p>
            </div>
          )}
        </div>

        {/* 建议卡片 */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-6 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen size={18} className="text-blue-800" />
            <h3 className="font-semibold text-blue-900">下月学习建议</h3>
          </div>
          {d.weakPointsTop3.length > 0 ? (
            <ul className="space-y-2">
              <li className="text-sm text-blue-800 flex items-start gap-2">
                <span className="w-5 h-5 bg-blue-200 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</span>
                重点攻克：{d.weakPointsTop3[0]?.name || '薄弱点'}，建议每周专项练习 3 次
              </li>
              {d.bestImprovementModule && (
                <li className="text-sm text-blue-800 flex items-start gap-2">
                  <span className="w-5 h-5 bg-blue-200 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</span>
                  保持优势：{d.bestImprovementModule.module} 已有进步，继续保持当前学习方法
                </li>
              )}
              <li className="text-sm text-blue-800 flex items-start gap-2">
                <span className="w-5 h-5 bg-blue-200 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</span>
                定期分析：建议每 2 周使用 WinGo 分析一次，持续追踪薄弱点改善情况
              </li>
            </ul>
          ) : (
            <p className="text-sm text-blue-700">上传作业获取学情分析后，这里会为您生成个性化的下月学习建议。</p>
          )}
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href="/analyze"
            className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-blue-900 text-white rounded-xl font-medium hover:bg-blue-800 transition-colors"
          >
            <Zap size={18} />
            开始新分析
          </a>
          <a
            href="/trends"
            className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-white border border-gray-200 text-gray-800 rounded-xl font-medium hover:bg-gray-50 transition-colors"
          >
            <TrendingUp size={18} />
            查看薄弱点追踪
          </a>
          <button
            onClick={handleExportPDF}
            disabled={exporting}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-white border border-gray-200 text-gray-800 rounded-xl font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exporting ? <Loader2 size={18} className="animate-spin" /> : <FileDown size={18} />}
            {exporting ? '导出中...' : '导出 PDF'}
          </button>
        </div>
      </div>
    </main>
  )
}

export default function MonthlySummaryPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-blue-800 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">加载月度总结...</p>
        </div>
      </main>
    }>
      <MonthlyContent />
    </Suspense>
  )
}
