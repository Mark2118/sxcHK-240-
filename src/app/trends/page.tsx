'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Loader2, TrendingUp, Target, AlertCircle, BarChart3, ArrowLeft, Calendar, Zap, BookOpen } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

interface TrendsData {
  success: boolean
  trends?: {
    totalReports: number
    scoreHistory: Array<{
      date: string
      score: number
      totalQuestions: number
      correct: number
      wrong: number
      reportId: string
    }>
    weakPointStats: Array<{
      name: string
      count: number
      firstSeen: string
      lastSeen: string
      frequency: number
    }>
    moduleTrends: Record<string, Array<{ date: string; scoreRate: number }>>
    knowledgeTimeline: Array<{
      date: string
      reportId: string
      knowledgePoint: string
      module: string
    }>
  }
  error?: string
}

export default function TrendsPage() {
  const { token } = useAuth()
  const [data, setData] = useState<TrendsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }
    const load = async () => {
      try {
        const res = await fetch('/xsc/api/trends', {
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

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-blue-800 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">加载学情追踪...</p>
        </div>
      </main>
    )
  }

  if (!token) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <Target className="w-12 h-12 text-blue-800 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">请先登录</h2>
          <p className="text-gray-500 mb-6">登录后查看薄弱点追踪</p>
          <button
            onClick={() => {
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
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">加载失败</h2>
          <p className="text-gray-500">{data?.error || '请稍后重试'}</p>
        </div>
      </main>
    )
  }

  const trends = data.trends!
  const hasData = trends.totalReports > 0

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
              <p className="text-xs text-gray-500">薄弱点追踪</p>
            </div>
          </a>
          <a href="/xsc/analyze" className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-blue-800">
            <ArrowLeft size={16} />
            返回分析
          </a>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {!hasData ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-blue-800" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">暂无追踪数据</h2>
            <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
              完成至少 2 次学情分析后，这里会展示薄弱点变化趋势和模块得分曲线
            </p>
            <a href="/xsc/analyze" className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-900 text-white rounded-xl text-sm font-medium">
              <Zap size={16} />
              开始首次分析
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 统计卡片 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 text-center">
                <div className="text-2xl font-bold text-blue-800">{trends.totalReports}</div>
                <div className="text-xs text-gray-500 mt-1">分析次数</div>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {trends.scoreHistory[trends.scoreHistory.length - 1]?.score ?? 0}
                </div>
                <div className="text-xs text-gray-500 mt-1">最新掌握度</div>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 text-center">
                <div className="text-2xl font-bold text-red-600">
                  {trends.weakPointStats.length}
                </div>
                <div className="text-xs text-gray-500 mt-1">薄弱点种类</div>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 text-center">
                <div className="text-2xl font-bold text-amber-600">
                  {trends.knowledgeTimeline.length}
                </div>
                <div className="text-xs text-gray-500 mt-1">待巩固知识点</div>
              </div>
            </div>

            {/* 分数趋势 */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp size={18} className="text-blue-800" />
                掌握度变化趋势
              </h3>
              <div className="flex items-end gap-2 h-40">
                {trends.scoreHistory.map((s, i) => {
                  const h = Math.max(20, (s.score / 100) * 140)
                  const color = s.score >= 85 ? 'bg-green-500' : s.score >= 70 ? 'bg-amber-500' : 'bg-red-500'
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div className="text-xs text-gray-500 font-medium">{s.score}</div>
                      <div
                        className={`w-full max-w-[40px] rounded-t-lg ${color} opacity-80`}
                        style={{ height: `${h}px` }}
                      />
                      <div className="text-[10px] text-gray-400">{s.date.slice(5)}</div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 薄弱点排行榜 */}
            {trends.weakPointStats.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Target size={18} className="text-red-500" />
                  薄弱点追踪排行
                </h3>
                <div className="space-y-3">
                  {trends.weakPointStats.map((wp, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                      <div className="w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-sm font-bold">
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{wp.name}</div>
                        <div className="text-xs text-gray-500">
                          出现 {wp.count} 次 · 频率 {wp.frequency}% · 首次 {wp.firstSeen}
                        </div>
                      </div>
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-red-500 rounded-full"
                          style={{ width: `${wp.frequency}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 模块趋势 */}
            {Object.keys(trends.moduleTrends).length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <BarChart3 size={18} className="text-blue-800" />
                  模块得分趋势
                </h3>
                <div className="space-y-4">
                  {Object.entries(trends.moduleTrends).map(([module, points]) => {
                    const latest = points[points.length - 1]?.scoreRate ?? 0
                    const prev = points[points.length - 2]?.scoreRate ?? latest
                    const change = latest - prev
                    return (
                      <div key={module} className="p-4 border border-gray-100 rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900">{module}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-gray-900">{latest}%</span>
                            {change !== 0 && (
                              <span className={`text-xs ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {change > 0 ? '+' : ''}{change}%
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {points.map((p, i) => (
                            <div
                              key={i}
                              className={`flex-1 h-2 rounded-full ${
                                p.scoreRate >= 80
                                  ? 'bg-green-400'
                                  : p.scoreRate >= 60
                                  ? 'bg-amber-400'
                                  : 'bg-red-400'
                              }`}
                              title={`${p.date}: ${p.scoreRate}%`}
                            />
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* 知识点时间线 */}
            {trends.knowledgeTimeline.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <BookOpen size={18} className="text-amber-600" />
                  待巩固知识点时间线
                </h3>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {trends.knowledgeTimeline.slice(0, 30).map((k, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                      <Calendar size={14} className="text-red-400 shrink-0" />
                      <span className="text-xs text-gray-500 w-16 shrink-0">{k.date.slice(5)}</span>
                      <span className="text-sm text-gray-800 flex-1">{k.knowledgePoint}</span>
                      <span className="text-xs text-gray-400">{k.module}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CTA */}
            <div className="flex gap-3">
              <a
                href="/xsc/analyze"
                className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-blue-900 text-white rounded-xl font-medium hover:bg-blue-800 transition-colors"
              >
                <Zap size={18} />
                再次分析
              </a>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
