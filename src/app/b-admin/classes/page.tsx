'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  School, Users, BarChart3, ChevronRight, Loader2,
  TrendingUp, Calendar
} from 'lucide-react'

interface ClassItem {
  id: string
  name: string
  grade: number
  subject: string
}

interface ClassAnalytics {
  classId: string
  className: string
  studentCount: number
  avgScore: number
  analysisCount: number
  trend: Array<{ date: string; avgScore: number }>
  weakPointTop5: Array<{ name: string; count: number }>
}

export default function ClassesPage() {
  const router = useRouter()
  const [apiKey, setApiKey] = useState('')
  const [apiSecret, setApiSecret] = useState('')
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [analytics, setAnalytics] = useState<Record<string, ClassAnalytics>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedKey = localStorage.getItem('b_api_key')
    const savedSecret = localStorage.getItem('b_api_secret')
    if (savedKey && savedSecret) {
      setApiKey(savedKey)
      setApiSecret(savedSecret)
      loadData(savedKey, savedSecret)
    } else {
      setLoading(false)
    }
  }, [])

  const authHeaders = (key: string, secret: string) => ({ 'x-api-key': key, 'x-api-secret': secret })

  const loadData = async (key: string, secret: string) => {
    setLoading(true)
    try {
      const res = await fetch('/xsc/api/b/class', { headers: authHeaders(key, secret) })
      const data = await res.json()
      if (data.success) {
        setClasses(data.data)
        // 并行加载每个班级的分析数据
        const analyticsMap: Record<string, ClassAnalytics> = {}
        await Promise.all(
          (data.data as ClassItem[]).map(async (cls: ClassItem) => {
            try {
              const aRes = await fetch(`/xsc/api/b-admin/classes/${cls.id}/analytics`, {
                headers: authHeaders(key, secret),
              })
              const aData = await aRes.json()
              if (aData.success) {
                analyticsMap[cls.id] = aData.data
              }
            } catch {}
          })
        )
        setAnalytics(analyticsMap)
      }
    } catch {}
    setLoading(false)
  }

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

  const getSubjectLabel = (s: string) =>
    s === 'math' ? '数学' : s === 'chinese' ? '语文' : s === 'english' ? '英语' : s

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-900 rounded-lg flex items-center justify-center text-white font-bold text-sm">W</div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">班级看板</h1>
              <p className="text-xs text-gray-400">WinGo 学情引擎 · B端管理</p>
            </div>
          </div>
          <button
            onClick={() => router.push('/xsc/b-admin')}
            className="text-sm text-gray-500 hover:text-gray-900"
          >
            返回总览
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-blue-900" />
            <span className="ml-2 text-gray-500 text-sm">加载中...</span>
          </div>
        ) : classes.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <School className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400">暂无班级数据</p>
            <p className="text-xs text-gray-300 mt-1">请在总览页面添加班级</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.map((cls) => {
              const a = analytics[cls.id]
              return (
                <button
                  key={cls.id}
                  onClick={() => router.push(`/xsc/b-admin/classes/${cls.id}`)}
                  className="bg-white rounded-xl border border-gray-100 p-5 text-left hover:shadow-md transition-shadow group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                      <School className="w-5 h-5 text-blue-700" />
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-900 transition-colors" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{cls.name}</h3>
                  <p className="text-xs text-gray-400 mb-4">{cls.grade}年级 · {getSubjectLabel(cls.subject)}</p>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Users className="w-3 h-3 text-gray-400" />
                      </div>
                      <div className="text-lg font-bold text-gray-900">{a?.studentCount ?? 0}</div>
                      <div className="text-[10px] text-gray-400">学生</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <BarChart3 className="w-3 h-3 text-gray-400" />
                      </div>
                      <div className="text-lg font-bold text-gray-900">{a?.avgScore ?? '-'}</div>
                      <div className="text-[10px] text-gray-400">均分</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <TrendingUp className="w-3 h-3 text-gray-400" />
                      </div>
                      <div className="text-lg font-bold text-gray-900">{a?.analysisCount ?? 0}</div>
                      <div className="text-[10px] text-gray-400">分析</div>
                    </div>
                  </div>

                  {a && a.weakPointTop5.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-gray-50">
                      <p className="text-[10px] text-gray-400 mb-1.5">薄弱点 TOP3</p>
                      <div className="flex flex-wrap gap-1.5">
                        {a.weakPointTop5.slice(0, 3).map((wp) => (
                          <span key={wp.name} className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded text-[10px]">
                            {wp.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
