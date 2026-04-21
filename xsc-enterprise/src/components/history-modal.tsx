'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { X, FileText, Loader2, BarChart3 } from 'lucide-react'

interface HistoryRecord {
  id: string
  subject: string
  score: number
  totalQuestions: number
  correct: number
  wrong: number
  createdAt: string
  status?: string
}

interface HistoryModalProps {
  open: boolean
  onClose: () => void
  onSelectReport: (reportId: string) => void
}

export default function HistoryModal({ open, onClose, onSelectReport }: HistoryModalProps) {
  const { token } = useAuth()
  const [reports, setReports] = useState<HistoryRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open || !token) return
    setLoading(true)
    setError('')

    fetch('/xsc/api/report?list=1', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setReports(data.reports || [])
        } else {
          setError(data.error || '获取失败')
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [open, token])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <FileText size={20} className="text-blue-800" />
            我的报告
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {!token ? (
            <div className="text-center py-8">
              <p className="text-gray-500">请先登录查看历史报告</p>
            </div>
          ) : loading ? (
            <div className="text-center py-8">
              <Loader2 size={24} className="animate-spin mx-auto text-blue-800 mb-2" />
              <p className="text-sm text-gray-500">加载中...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500 text-sm">{error}</div>
          ) : reports.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 size={28} className="text-gray-400" />
              </div>
              <p className="text-gray-500 text-sm">暂无历史报告</p>
              <p className="text-xs text-gray-400 mt-1">上传作业后将自动生成报告</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((report) => (
                <button
                  key={report.id}
                  onClick={() => {
                    onSelectReport(report.id)
                    onClose()
                  }}
                  className="w-full p-4 bg-gray-50 rounded-xl text-left hover:bg-blue-50 transition-colors border border-transparent hover:border-blue-200"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        {report.subject === 'math' ? '数学' : report.subject === 'chinese' ? '语文' : '英语'}学情报告
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {new Date(report.createdAt).toLocaleString('zh-CN')}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-blue-800">{report.score}</div>
                      <div className="text-xs text-gray-500">{report.correct}/{report.totalQuestions}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
