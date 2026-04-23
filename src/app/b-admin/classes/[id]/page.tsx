'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  ArrowLeft, Users, BarChart3, TrendingUp, AlertTriangle,
  Download, Loader2, School, FileText
} from 'lucide-react'

interface Student {
  id: string
  name: string
  latestScore: number | null
  weakPoints: string[]
  analysisCount: number
  createdAt: string
}

interface AnalyticsData {
  classId: string
  className: string
  grade: number
  subject: string
  studentCount: number
  avgScore: number
  analysisCount: number
  trend: Array<{ date: string; avgScore: number }>
  weakPointTop5: Array<{ name: string; count: number }>
}

function BarChart({ data }: { data: Array<{ date: string; avgScore: number }> }) {
  if (data.length === 0) return <div className="text-center text-gray-400 py-8 text-sm">暂无趋势数据</div>

  const maxScore = 100
  const minScore = 0
  const chartHeight = 160
  const barWidth = Math.max(20, Math.min(60, 400 / data.length))
  const gap = 8
  const totalWidth = data.length * (barWidth + gap) + 40

  return (
    <div className="overflow-x-auto">
      <svg width={totalWidth} height={chartHeight + 40} className="mx-auto">
        {/* Y轴刻度 */}
        {[0, 25, 50, 75, 100].map((score) => {
          const y = chartHeight - (score / maxScore) * chartHeight + 10
          return (
            <g key={score}>
              <line x1={30} y1={y} x2={totalWidth - 10} y2={y} stroke="#f3f4f6" strokeWidth={1} />
              <text x={25} y={y + 4} textAnchor="end" fontSize={10} fill="#9ca3af">{score}</text>
            </g>
          )
        })}

        {/* 柱状图 */}
        {data.map((item, i) => {
          const barHeight = (item.avgScore / maxScore) * chartHeight
          const x = 40 + i * (barWidth + gap)
          const y = chartHeight - barHeight + 10
          return (
            <g key={item.date + i}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx={4}
                fill="#1e3a8a"
                opacity={0.8 + i * 0.02}
              />
              <text
                x={x + barWidth / 2}
                y={y - 6}
                textAnchor="middle"
                fontSize={10}
                fill="#374151"
                fontWeight={600}
              >
                {item.avgScore}
              </text>
              <text
                x={x + barWidth / 2}
                y={chartHeight + 28}
                textAnchor="middle"
                fontSize={10}
                fill="#6b7280"
              >
                {item.date.slice(5)}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

export default function ClassDetailPage() {
  const router = useRouter()
  const params = useParams()
  const classId = params.id as string

  const [apiKey, setApiKey] = useState('')
  const [apiSecret, setApiSecret] = useState('')
  const [students, setStudents] = useState<Student[]>([])
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedKey = localStorage.getItem('b_api_key')
    const savedSecret = localStorage.getItem('b_api_secret')
    if (savedKey && savedSecret && classId) {
      setApiKey(savedKey)
      setApiSecret(savedSecret)
      loadData(savedKey, savedSecret, classId)
    } else {
      setLoading(false)
    }
  }, [classId])

  const authHeaders = (key: string, secret: string) => ({ 'x-api-key': key, 'x-api-secret': secret })

  const loadData = async (key: string, secret: string, id: string) => {
    setLoading(true)
    try {
      const [sRes, aRes] = await Promise.all([
        fetch(`/xsc/api/b-admin/classes/${id}/students`, { headers: authHeaders(key, secret) }),
        fetch(`/xsc/api/b-admin/classes/${id}/analytics`, { headers: authHeaders(key, secret) }),
      ])
      const sData = await sRes.json()
      const aData = await aRes.json()
      if (sData.success) setStudents(sData.data)
      if (aData.success) setAnalytics(aData.data)
    } catch {}
    setLoading(false)
  }

  const exportReport = () => {
    if (!analytics) return
    const lines: string[] = []
    lines.push(`班级报告: ${analytics.className}`)
    lines.push(`生成时间: ${new Date().toLocaleString('zh-CN')}`)
    lines.push(`年级: ${analytics.grade} | 学科: ${analytics.subject}`)
    lines.push(`学生数: ${analytics.studentCount} | 平均分: ${analytics.avgScore} | 分析次数: ${analytics.analysisCount}`)
    lines.push('')
    lines.push('--- 学生名单 ---')
    students.forEach((s, i) => {
      lines.push(`${i + 1}. ${s.name} | 最新分数: ${s.latestScore ?? '-'} | 分析次数: ${s.analysisCount} | 薄弱点: ${s.weakPoints.join(', ') || '-'}`)
    })
    lines.push('')
    lines.push('--- 薄弱点 TOP5 ---')
    analytics.weakPointTop5.forEach((wp, i) => {
      lines.push(`${i + 1}. ${wp.name} | 出现次数: ${wp.count}`)
    })
    lines.push('')
    lines.push('--- 分数趋势 ---')
    analytics.trend.forEach((t) => {
      lines.push(`${t.date}: ${t.avgScore}分`)
    })

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `班级报告_${analytics.className}_${new Date().toISOString().slice(0, 10)}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getSubjectLabel = (s: string) =>
    s === 'math' ? '数学' : s === 'chinese' ? '语文' : s === 'english' ? '英语' : s

  if (!apiKey || !apiSecret) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <School className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">请先登录 B端管理后台</p>
          <button
            onClick={() => router.push('/xsc/b-admin')}
            className="mt-4 px-6 py-2 bg-blue-900 text-white rounded-xl text-sm hover:bg-blue-800"
          >
            前往登录
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/xsc/b-admin/classes')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900">
                {analytics?.className || '班级详情'}
              </h1>
              <p className="text-xs text-gray-400">
                {analytics ? `${analytics.grade}年级 · ${getSubjectLabel(analytics.subject)}` : '加载中...'}
              </p>
            </div>
          </div>
          <button
            onClick={exportReport}
            disabled={!analytics || loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-900 text-white rounded-xl text-sm hover:bg-blue-800 disabled:opacity-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            导出报告
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-blue-900" />
            <span className="ml-2 text-gray-500 text-sm">加载中...</span>
          </div>
        ) : (
          <>
            {/* 统计卡片 */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: '学生人数', value: analytics?.studentCount ?? 0, icon: Users, color: 'bg-blue-50 text-blue-700' },
                { label: '班级均分', value: analytics?.avgScore ?? '-', icon: BarChart3, color: 'bg-green-50 text-green-700' },
                { label: '分析次数', value: analytics?.analysisCount ?? 0, icon: TrendingUp, color: 'bg-amber-50 text-amber-700' },
                { label: '薄弱点数', value: analytics?.weakPointTop5.length ?? 0, icon: AlertTriangle, color: 'bg-red-50 text-red-700' },
              ].map((s) => (
                <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-5">
                  <div className={`w-10 h-10 ${s.color} rounded-lg flex items-center justify-center mb-3`}>
                    <s.icon className="w-5 h-5" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{s.value}</div>
                  <div className="text-xs text-gray-400 mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            {/* 分数趋势 */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-700" />
                班级平均分趋势
              </h2>
              <BarChart data={analytics?.trend || []} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 学生列表 */}
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-700" />
                  学生列表
                </h2>
                {students.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">暂无学生数据</div>
                ) : (
                  <div className="space-y-2">
                    {students.map((s) => (
                      <div key={s.id} className="flex items-center justify-between py-3 px-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-xs">
                            {s.name.charAt(0)}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{s.name}</div>
                            <div className="text-[11px] text-gray-400">
                              分析 {s.analysisCount} 次
                              {s.weakPoints.length > 0 && ` · 薄弱: ${s.weakPoints.join(', ')}`}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-gray-900">{s.latestScore ?? '-'}</div>
                          <div className="text-[10px] text-gray-400">最新分数</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 薄弱点 TOP5 */}
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  班级薄弱点 TOP5
                </h2>
                {(!analytics || analytics.weakPointTop5.length === 0) ? (
                  <div className="text-center py-8 text-gray-400 text-sm">暂无薄弱点数据</div>
                ) : (
                  <div className="space-y-3">
                    {analytics.weakPointTop5.map((wp, i) => {
                      const maxCount = analytics.weakPointTop5[0].count
                      const pct = maxCount > 0 ? (wp.count / maxCount) * 100 : 0
                      return (
                        <div key={wp.name}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-700">
                              <span className="inline-block w-5 text-xs text-gray-400 font-medium">{i + 1}</span>
                              {wp.name}
                            </span>
                            <span className="text-gray-900 font-medium">{wp.count}次</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-amber-500 rounded-full transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  )
}
