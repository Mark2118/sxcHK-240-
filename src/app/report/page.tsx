'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Loader2, CheckCircle, AlertCircle, BarChart3, ArrowLeft, Share2, Clock, Target, Lightbulb, ChevronRight, FileDown } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

interface ReportData {
  success: boolean
  id?: string
  subject?: string
  score?: number
  totalQuestions?: number
  correct?: number
  wrong?: number
  report?: {
    score: number
    totalQuestions: number
    correct: number
    wrong: number
    moduleScores: Array<{
      module: string
      scoreRate: number
      weight: string
      status: string
    }>
    weakPoints: string[]
    suggestions: string[]
    examStrategy: string
    questions: Array<{
      no: number
      content: string
      studentAnswer: string
      correctAnswer: string
      isCorrect: boolean
      analysis: string
      knowledgePoint: string
    }>
  }
  html?: string
  exercises?: {
    title: string
    description: string
    summary: string
    exercises: Array<{
      no: number
      type: string
      content: string
      answer: string
      analysis: string
      difficulty: string
      knowledgePoint: string
    }>
  }
  createdAt?: string
  isPreview?: boolean
  needPurchase?: boolean
  freeCount?: number
  error?: string
}

function ReportContent() {
  const searchParams = useSearchParams()
  const reportId = searchParams.get('id')
  const { token, user } = useAuth()

  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'action' | 'detail' | 'exercises' | 'html'>('overview')
  const [shareToast, setShareToast] = useState(false)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    if (!reportId) {
      setData({ success: false, error: '缺少报告ID' })
      setLoading(false)
      return
    }

    const load = async () => {
      try {
        const headers: Record<string, string> = {}
        if (token) headers['Authorization'] = `Bearer ${token}`
        const res = await fetch(`/xsc/api/report?id=${reportId}`, { headers })
        const json = await res.json()
        setData(json)
      } catch (e) {
        setData({ success: false, error: '加载失败，请重试' })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [reportId, token])

  const handleShare = async () => {
    const url = window.location.href
    try {
      await navigator.clipboard.writeText(url)
      setShareToast(true)
      setTimeout(() => setShareToast(false), 2000)
    } catch {
      // fallback
    }
  }

  const handleExportPDF = async () => {
    if (!reportId || !token) return
    setExporting(true)
    try {
      const res = await fetch('/xsc/api/report/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ reportId, type: 'report' }),
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
      const filename = res.headers.get('content-disposition')?.match(/filename="([^"]+)"/)?.[1] || 'WinGo学情分析报告.pdf'
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

  // 生成「今晚行动清单」
  const actionList = (() => {
    if (!data?.report) return []
    const list: string[] = []
    // 1. 薄弱点 → 具体行动
    ;(data.report.weakPoints || []).forEach((wp) => {
      list.push(`重点巩固：${wp}`)
    })
    // 2. 错题知识点 → 针对性练习
    const wrongQuestions = (data.report.questions || []).filter((q) => !q.isCorrect)
    wrongQuestions.slice(0, 3).forEach((q) => {
      list.push(`重做第${q.no}题：${q.knowledgePoint || '相关知识点'}`)
    })
    // 3. 建议 → 家庭行动
    ;(data.report.suggestions || []).slice(0, 2).forEach((sg) => {
      list.push(sg)
    })
    // 4. 通用行动
    list.push('建议 2 周后再次分析，对比本次数据观察进步情况')
    return list
  })()

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-blue-800 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">加载报告中...</p>
        </div>
      </main>
    )
  }

  if (!data?.success || data.error) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">报告加载失败</h2>
          <p className="text-gray-500 mb-6">{data?.error || '报告不存在或已过期'}</p>
          <a href="/analyze" className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-900 text-white rounded-xl text-sm font-medium">
            <ArrowLeft size={16} />
            返回分析
          </a>
        </div>
      </main>
    )
  }

  const report = data.report!
  const score = report.score
  const scoreColor = score >= 85 ? 'text-green-600' : score >= 70 ? 'text-amber-600' : 'text-red-600'
  const scoreBg = score >= 85 ? 'bg-green-50' : score >= 70 ? 'bg-amber-50' : 'bg-red-50'

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
              <p className="text-xs text-gray-500">学情分析报告</p>
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
        {/* 报告头部卡片 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">学情分析报告</h2>
              <p className="text-xs text-gray-500 mt-1">
                {data.id} · {data.createdAt ? new Date(data.createdAt).toLocaleString('zh-CN') : ''}
              </p>
            </div>
            {user && (
              <span className="text-xs text-gray-400">
                {user?.nickname || '用户'} · 剩余 {user?.freeUsesLeft ?? 0} 次免费
              </span>
            )}
          </div>

          {/* 分数大卡片 */}
          <div className="flex items-center gap-6 mb-6">
            <div className={`w-28 h-28 rounded-2xl ${scoreBg} flex flex-col items-center justify-center`}>
              <div className={`text-4xl font-bold ${scoreColor}`}>{score}</div>
              <div className="text-xs text-gray-500 mt-1">掌握度</div>
            </div>
            <div className="flex-1 grid grid-cols-3 gap-3">
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <div className="text-xl font-bold text-gray-900">{report.totalQuestions}</div>
                <div className="text-[11px] text-gray-500">总题数</div>
              </div>
              <div className="bg-green-50 rounded-xl p-3 text-center">
                <div className="text-xl font-bold text-green-600">{report.correct}</div>
                <div className="text-[11px] text-green-700">已掌握</div>
              </div>
              <div className="bg-red-50 rounded-xl p-3 text-center">
                <div className="text-xl font-bold text-red-600">{report.wrong}</div>
                <div className="text-[11px] text-red-700">待巩固</div>
              </div>
            </div>
          </div>

          {/* Tab */}
          <div className="flex gap-2 border-b border-gray-100 overflow-x-auto">
            {[
              { key: 'overview', label: '总览', icon: BarChart3 },
              { key: 'action', label: '今晚行动', icon: Target },
              { key: 'detail', label: '逐题解析', icon: AlertCircle },
              { key: 'exercises', label: '专项练习', icon: Lightbulb },
              ...(data.html ? [{ key: 'html' as const, label: '完整报告', icon: Share2 }] : []),
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'border-blue-800 text-blue-800'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon size={15} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 总览 */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* 模块得分 */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">五大模块掌握情况</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {report.moduleScores.map((m) => (
                  <div
                    key={m.module}
                    className={`p-4 rounded-xl text-center ${
                      m.status === '扎实'
                        ? 'bg-green-50'
                        : m.status === '提升中'
                        ? 'bg-amber-50'
                        : 'bg-red-50'
                    }`}
                  >
                    <div
                      className={`text-2xl font-bold ${
                        m.status === '扎实'
                          ? 'text-green-600'
                          : m.status === '提升中'
                          ? 'text-amber-600'
                          : 'text-red-600'
                      }`}
                    >
                      {m.scoreRate}%
                    </div>
                    <div className="text-xs text-gray-700 mt-1 font-medium">{m.module}</div>
                    <div className="text-[10px] text-gray-500 mt-0.5">{m.status}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 薄弱点 */}
            {report.weakPoints.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-900 mb-3">重点提升方向</h3>
                <div className="flex flex-wrap gap-2">
                  {report.weakPoints.map((wp, i) => (
                    <span key={i} className="px-3 py-1.5 bg-amber-100 text-amber-800 rounded-full text-sm">
                      {wp}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 学习建议 */}
            <div className="bg-blue-50 rounded-xl p-5 border-l-4 border-blue-800">
              <h3 className="font-semibold text-blue-900 mb-2">阶段性学习建议</h3>
              <p className="text-sm text-blue-800 leading-relaxed">{report.examStrategy}</p>
            </div>
          </div>
        )}

        {/* 今晚行动清单 */}
        {activeTab === 'action' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-amber-900">今晚行动清单</h3>
                  <p className="text-xs text-amber-700">基于本次学情分析，今晚就可以开始</p>
                </div>
              </div>

              <div className="space-y-3">
                {actionList.map((action, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-4 bg-white rounded-xl border border-amber-100 shadow-sm"
                  >
                    <div className="w-7 h-7 bg-amber-500 text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                      {i + 1}
                    </div>
                    <div className="text-sm text-gray-800 leading-relaxed pt-0.5">{action}</div>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-3 bg-amber-100/50 rounded-lg">
                <p className="text-xs text-amber-800 text-center">
                  💡 完成以上行动后，建议 2 周后再次分析，观察薄弱点改善情况
                </p>
              </div>
            </div>

            {/* 薄弱点高频统计 */}
            {report.weakPoints.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-900 mb-3">本次薄弱点</h3>
                <div className="space-y-2">
                  {report.weakPoints.map((wp, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                      <Target className="w-4 h-4 text-red-500 shrink-0" />
                      <span className="text-sm text-red-800">{wp}</span>
                      <ChevronRight className="w-4 h-4 text-red-400 ml-auto" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 逐题解析 */}
        {activeTab === 'detail' && (
          <div className="space-y-4">
            {report.questions.map((q) => (
              <div
                key={q.no}
                className={`bg-white rounded-2xl shadow-sm border-l-4 p-5 ${
                  q.isCorrect ? 'border-green-500' : 'border-red-500'
                }`}
              >
                <div className="flex items-center gap-2 mb-3">
                  {q.isCorrect ? (
                    <CheckCircle size={18} className="text-green-600" />
                  ) : (
                    <AlertCircle size={18} className="text-red-600" />
                  )}
                  <span className="font-semibold text-gray-900">第{q.no}题</span>
                  <span
                    className={`ml-auto text-xs px-2.5 py-1 rounded-full font-medium ${
                      q.isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {q.isCorrect ? '已掌握' : '待巩固'}
                  </span>
                </div>
                <div className="text-sm text-gray-700 space-y-2">
                  <p><span className="font-medium">题目：</span>{q.content}</p>
                  <p><span className="font-medium">孩子答案：</span>{q.studentAnswer}</p>
                  <p><span className="font-medium">参考解析：</span>{q.correctAnswer}</p>
                </div>
                <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm text-gray-700">
                  <span className="font-medium">知识分析：</span>
                  {q.analysis}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 专项练习 */}
        {activeTab === 'exercises' && (
          <div className="space-y-6">
            {data.exercises && data.exercises.exercises.length > 0 ? (
              <>
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
                  <h3 className="font-semibold text-blue-900 text-lg mb-1">{data.exercises.title}</h3>
                  <p className="text-sm text-blue-700">{data.exercises.description}</p>
                </div>
                <div className="space-y-4">
                  {data.exercises.exercises.map((ex) => {
                    const diffColor =
                      ex.difficulty === '基础'
                        ? 'bg-green-100 text-green-800'
                        : ex.difficulty === '提高'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-purple-100 text-purple-800'
                    return (
                      <div key={ex.no} className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="w-7 h-7 bg-blue-900 text-white rounded-full flex items-center justify-center text-sm font-bold">
                              {ex.no}
                            </span>
                            <span className="text-sm text-gray-500">{ex.type}</span>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${diffColor}`}>
                            {ex.difficulty}
                          </span>
                        </div>
                        <div className="text-gray-900 font-medium mb-3 text-base leading-relaxed">{ex.content}</div>
                        <div className="bg-gray-50 rounded-lg p-3 mb-2">
                          <p className="text-sm text-gray-700">
                            <span className="font-semibold text-green-700">答案：</span>
                            {ex.answer}
                          </p>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-3">
                          <p className="text-sm text-blue-800">
                            <span className="font-semibold">解析：</span>
                            {ex.analysis}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            ) : (
              <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                <div className="text-3xl mb-3">📝</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">练习生成中</h3>
                <p className="text-sm text-gray-500">练习题由 AI 根据薄弱点实时生成</p>
              </div>
            )}
          </div>
        )}

        {/* 完整报告 HTML */}
        {activeTab === 'html' && data.html && (
          <div>
            <a
              href={`data:text/html;charset=utf-8,${encodeURIComponent(data.html)}`}
              download="WinGo学情分析报告.html"
              className="mb-4 inline-block px-4 py-2 bg-blue-900 text-white rounded-lg text-sm hover:bg-blue-800 transition-colors"
            >
              下载完整报告
            </a>
            <div
              className="border border-gray-200 rounded-xl overflow-hidden bg-white"
              dangerouslySetInnerHTML={{ __html: data.html }}
            />
          </div>
        )}

        {/* 底部 CTA */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <a
            href="/analyze"
            className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-blue-900 text-white rounded-xl font-medium hover:bg-blue-800 transition-colors"
          >
            <BarChart3 size={18} />
            再次分析
          </a>
          <a
            href="/trends"
            className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-white border border-gray-200 text-gray-800 rounded-xl font-medium hover:bg-gray-50 transition-colors"
          >
            <Target size={18} />
            薄弱点追踪
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

        {/* 免责声明 */}
        <div className="mt-6 bg-amber-50 border border-amber-100 rounded-xl p-4">
          <p className="text-xs text-amber-800 text-center leading-relaxed">
            WinGo 学情洞察是一款家庭学情分析软件工具，报告仅供家长参考，不涉及任何教育培训服务
          </p>
        </div>
      </div>
    </main>
  )
}


export default function ReportPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-blue-800 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">加载报告中...</p>
        </div>
      </main>
    }>
      <ReportContent />
    </Suspense>
  )
}
