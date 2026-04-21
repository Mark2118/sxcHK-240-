'use client'

import { useState, useCallback, useRef } from 'react'
import { Upload, FileText, Camera, Loader2, CheckCircle, AlertCircle, BarChart3, Shield, Sparkles, ImageIcon, User, Lock, History, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import UserMenu from '@/components/user-menu'
import PayModal from '@/components/pay-modal'
import HistoryModal from '@/components/history-modal'

interface AnalysisResult {
  success: boolean
  report?: {
    score: number
    totalQuestions: number
    correct: number
    wrong: number
    questions: Array<{
      no: number
      content: string
      studentAnswer: string
      correctAnswer: string
      isCorrect: boolean
      analysis: string
    }>
    moduleScores: Array<{
      module: string
      scoreRate: number
      weight: string
      status: string
    }>
    weakPoints: string[]
    suggestions: string[]
    examStrategy: string
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
  correctResult?: {
    subject: string
    isAllFinished: boolean
    questions: Array<{
      sequence: number
      typeName: string
      correctResult: number
      question: string
      cropUrl: string
      slots: Array<{
        sequence: number
        correctResult: number
        reason: string
      }>
    }>
    stat: { all: number; corrected: number; correcting: number }
  }
  id?: string
  subject?: string
  score?: number
  totalQuestions?: number
  correct?: number
  wrong?: number
  createdAt?: string
  isPreview?: boolean
  needPurchase?: boolean
  freeCount?: number
  memberType?: string
  previewMessage?: string
  error?: string
}

export default function AnalyzePage() {
  const { user, token, loading: authLoading } = useAuth()
  const [payModalOpen, setPayModalOpen] = useState(false)
  const [historyModalOpen, setHistoryModalOpen] = useState(false)

  const [text, setText] = useState('')
  const [subject, setSubject] = useState('math')
  const [loading, setLoading] = useState(false)
  const [correcting, setCorrecting] = useState(false)
  const [correctProgress, setCorrectProgress] = useState('')
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'detail' | 'exercises' | 'html' | 'correct'>('overview')
  const [ocrLoading, setOcrLoading] = useState(false)
  const [ocrResult, setOcrResult] = useState(false)
  const [ocrText, setOcrText] = useState('')
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = useCallback(async (file: File) => {
    setOcrLoading(true)
    setOcrResult(false)
    try {
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64 = (reader.result as string)
        const base64Data = base64.split(',')[1]
        setUploadedImage(base64Data)
        const res = await fetch('/xsc/api/ocr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64Data }),
        })
        const data = await res.json()
        if (data.success && data.text) {
          setText(data.text)
          setOcrText(data.text)
          setOcrResult(true)
        } else {
          alert('图片识别失败: ' + (data.error || '未知错误'))
        }
        setOcrLoading(false)
      }
      reader.readAsDataURL(file)
    } catch (e) {
      alert('上传失败')
      setOcrLoading(false)
    }
  }, [])

  const handleCorrect = useCallback(async () => {
    if (!uploadedImage) {
      alert('请先上传作业图片')
      fileInputRef.current?.click()
      return
    }
    setCorrecting(true)
    setCorrectProgress('正在切题识别...')
    setActiveTab('overview')
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`
      const res = await fetch('/xsc/api/correct', {
        method: 'POST',
        headers,
        body: JSON.stringify({ imageBase64: uploadedImage, subject, generateExerciseSet: true }),
      })
      const data = await res.json()
      setResult(data)
      setActiveTab('correct')
    } catch (e) {
      setResult({ success: false, error: '网络错误，请重试' })
    } finally {
      setCorrecting(false)
      setCorrectProgress('')
    }
  }, [uploadedImage, subject, token])

  const handleSubmit = useCallback(async () => {
    if (!text.trim()) return
    setLoading(true)
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`
      const res = await fetch('/xsc/api/check', {
        method: 'POST',
        headers,
        body: JSON.stringify({ text, subject, generateExerciseSet: true, ocrText }),
      })
      const data = await res.json()
      setResult(data)
      setActiveTab('overview')
    } catch (e) {
      setResult({ success: false, error: '网络错误，请重试' })
    } finally {
      setLoading(false)
    }
  }, [text, subject, ocrText, token])

  // 支付成功后自动解锁当前预览报告
  const handlePaySuccess = useCallback(async () => {
    if (result?.isPreview && result?.id) {
      const headers: Record<string, string> = {}
      if (token) headers['Authorization'] = `Bearer ${token}`
      const res = await fetch(`/xsc/api/report?id=${result.id}`, { headers })
      const data = await res.json()
      if (data.success) {
        setResult({
          success: true,
          report: data.report,
          html: data.html,
          exercises: data.exercises,
          ...data,
        } as AnalysisResult)
        setActiveTab('overview')
      }
    }
  }, [result, token])

  const sampleMath = `1. 计算：125 x 32 x 25 = ?
学生答案：100000

2. 解方程：3x + 5 = 20
学生答案：x = 5

3. 长方形长8cm，宽5cm，求面积。
学生答案：40cm²

4. 甲乙相距360km，A车60km/h，B车40km/h，相向而行，几小时相遇？
学生答案：3.6小时

5. 正方形边长4cm，内有直径4cm的圆，求阴影面积。(π=3.14)
学生答案：3.44cm²`

  const resultMap: Record<number, string> = { 0: '未批', 1: '正确', 2: '错误', 3: '未作答' }
  const resultColor: Record<number, string> = { 0: 'text-gray-500', 1: 'text-green-600', 2: 'text-red-600', 3: 'text-amber-600' }
  const resultBg: Record<number, string> = { 0: 'bg-gray-50', 1: 'bg-green-50', 2: 'bg-red-50', 3: 'bg-amber-50' }
  const resultBorder: Record<number, string> = { 0: 'border-gray-200', 1: 'border-green-200', 2: 'border-red-200', 3: 'border-amber-200' }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/xsc" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-900 to-blue-700 rounded-xl flex items-center justify-center text-white font-bold text-lg group-hover:shadow-lg transition-shadow">
              W
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">WinGo 学情洞察</h1>
              <p className="text-xs text-gray-500">AI 驱动的家庭学情分析工具</p>
            </div>
          </a>
          <div className="flex items-center gap-3">
            {user && (
              <button
                onClick={() => setHistoryModalOpen(true)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <History size={16} />
                <span className="hidden sm:inline">我的报告</span>
              </button>
            )}
            {user ? (
              <UserMenu onOpenPay={() => setPayModalOpen(true)} />
            ) : (
              <button
                onClick={() => {
                  const mockLogin = async () => {
                    const mockCode = 'mock_wx_code_' + Date.now()
                    const res = await fetch('/xsc/api/auth/wechat', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ code: mockCode }),
                    })
                    const data = await res.json()
                    if (data.success && data.token) {
                      localStorage.setItem('xsc_token', data.token)
                      window.location.reload()
                    } else {
                      alert('登录失败: ' + (data.error || '未知错误'))
                    }
                  }
                  mockLogin()
                }}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-xl text-sm font-medium hover:bg-green-600 transition-colors"
              >
                <User size={16} />
                微信一键登录
              </button>
            )}
            <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400">
              <Shield size={14} />
              <span>edu.wingo.icu/xsc</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {!result?.success ? (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* 左侧：输入区 */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Upload size={20} className="text-blue-800" />
                  作业内容分析
                </h2>

                {/* 科目选择 */}
                <div className="flex gap-2 mb-4">
                  {[
                    { key: 'math', label: '数学' },
                    { key: 'chinese', label: '语文' },
                    { key: 'english', label: '英语' },
                  ].map((s) => (
                    <button
                      key={s.key}
                      onClick={() => setSubject(s.key)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        subject === s.key
                          ? 'bg-blue-900 text-white shadow-md'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

                {/* 图片上传 */}
                <div
                  className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center mb-4 hover:border-blue-800 transition-colors cursor-pointer bg-gray-50/50 relative"
                  onClick={() => fileInputRef.current?.click()}
                  onPaste={(e) => {
                    const items = e.clipboardData?.items
                    if (!items) return
                    for (let i = 0; i < items.length; i++) {
                      if (items[i].type.indexOf('image') !== -1) {
                        const blob = items[i].getAsFile()
                        if (blob) handleImageUpload(blob)
                        break
                      }
                    }
                  }}
                >
                  <input
                    ref={fileInputRef}
                    id="file-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleImageUpload(file)
                    }}
                  />
                  {ocrLoading ? (
                    <>
                      <Loader2 size={32} className="mx-auto text-blue-800 mb-2 animate-spin" />
                      <p className="text-sm text-blue-800">正在识别图片...</p>
                    </>
                  ) : ocrResult ? (
                    <>
                      <CheckCircle size={32} className="mx-auto text-green-600 mb-2" />
                      <p className="text-sm text-green-700">图片识别成功！已填入文本框</p>
                      <p className="text-xs text-gray-400 mt-1">点击或 Ctrl+V 粘贴新图片</p>
                    </>
                  ) : (
                    <>
                      <Camera size={32} className="mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">点击上传 或 截图粘贴作业图片</p>
                      <p className="text-xs text-gray-400 mt-1">支持 JPG、PNG</p>
                    </>
                  )}
                </div>

                {/* 智能批改按钮 */}
                {uploadedImage && (
                  <button
                    onClick={handleCorrect}
                    disabled={correcting}
                    className="w-full mb-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 rounded-xl font-medium hover:shadow-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                  >
                    {correcting ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        {correctProgress || '智能批改中...'}
                      </>
                    ) : (
                      <>
                        <Sparkles size={18} />
                        拍照智能批改（百度客观批改）
                      </>
                    )}
                  </button>
                )}

                {/* 文本输入 */}
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={`请粘贴作业内容，格式示例：\n1. 题目内容\n学生答案：xxx\n\n2. 题目内容\n学生答案：xxx`}
                  className="w-full h-48 p-4 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-800 focus:border-transparent text-sm leading-relaxed"
                />

                <div className="flex gap-3 mt-4">
                  <button
                    onClick={handleSubmit}
                    disabled={loading || !text.trim()}
                    className="flex-1 bg-gradient-to-r from-blue-900 to-blue-700 text-white py-3 rounded-xl font-medium hover:shadow-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        AI 分析中...
                      </>
                    ) : (
                      <>
                        <BarChart3 size={18} />
                        开始分析
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setText(sampleMath)}
                    className="px-4 py-3 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
                  >
                    填入示例
                  </button>
                </div>

                {/* 免责声明 */}
                <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-lg">
                  <p className="text-xs text-amber-800 leading-relaxed">
                    <strong>声明：</strong> WinGo 学情洞察是一款家庭学情分析软件工具，提供的分析报告仅供家长参考，帮助了解孩子的学习情况。本工具不涉及任何教育培训、授课或辅导服务。
                  </p>
                </div>
              </div>
            </div>

            {/* 右侧：说明区 */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">两种分析方式</h3>
                <div className="space-y-4">
                  <div className="flex gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
                    <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center text-sm font-bold shrink-0">1</div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">拍照智能批改（推荐）</p>
                      <p className="text-xs text-gray-500 mt-1">上传作业照片，百度 AI 自动切题、客观判断对错，精度最高</p>
                    </div>
                  </div>
                  <div className="flex gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                    <div className="w-8 h-8 rounded-full bg-blue-800 text-white flex items-center justify-center text-sm font-bold shrink-0">2</div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">输入文本分析</p>
                      <p className="text-xs text-gray-500 mt-1">粘贴作业文字，AI 分析知识点掌握情况，适合复杂解答题</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-6">
                <h3 className="font-semibold text-blue-900 mb-2">关于 WinGo 学情洞察</h3>
                <p className="text-sm text-blue-800 leading-relaxed mb-3">
                  WinGo 学情洞察由 WinGo 团队开发，底层 AI 引擎采用清华大学 THU-MAIC OpenMAIC 技术架构。
                  通过客观的数据分析，帮助家长清晰了解孩子的知识掌握情况，为家庭学习规划提供科学参考。
                </p>
                <div className="flex items-center gap-2 text-xs text-blue-700 bg-white/60 p-2 rounded-lg">
                  <span className="font-semibold">WinGo</span>
                  <span>×</span>
                  <span className="font-semibold">清华 OpenMAIC</span>
                </div>
              </div>
            </div>
          </div>
        ) : result.error ? (
          <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-sm border border-red-100 p-8 text-center">
            <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">分析出错</h3>
            <p className="text-gray-500 mb-6">{result.error}</p>
            <button
              onClick={() => setResult(null)}
              className="px-6 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors"
            >
              返回重试
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 报告头部 */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-900 to-blue-700 rounded-xl flex items-center justify-center text-white font-bold">
                    W
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">学情分析报告</h2>
                    <p className="text-xs text-gray-500">WinGo 学情洞察 · 客观数据 · 科学建议</p>
                  </div>
                </div>
                <button
                  onClick={() => setResult(null)}
                  className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1 bg-gray-100 rounded-lg"
                >
                  返回上传
                </button>
              </div>

              {/* 分数卡片 */}
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex-1 min-w-[120px] bg-green-50 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-green-600">{result.report?.score ?? result.score ?? 0}</div>
                  <div className="text-xs text-green-700 mt-1">掌握度指数</div>
                </div>
                <div className="flex-1 min-w-[120px] bg-blue-50 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-blue-600">{result.report?.totalQuestions ?? result.totalQuestions ?? 0}</div>
                  <div className="text-xs text-blue-700 mt-1">分析题数</div>
                </div>
                <div className="flex-1 min-w-[120px] bg-emerald-50 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-emerald-600">{result.report?.correct ?? result.correct ?? 0}</div>
                  <div className="text-xs text-emerald-700 mt-1">已掌握</div>
                </div>
                <div className="flex-1 min-w-[120px] bg-amber-50 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-amber-600">{result.report?.wrong ?? result.wrong ?? 0}</div>
                  <div className="text-xs text-amber-700 mt-1">待巩固</div>
                </div>
              </div>

              {/* 预览版提示 */}
              {result.isPreview && (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <Lock size={20} className="text-amber-600 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-amber-900">
                        {result.previewMessage || '登录并解锁后可查看完整学情分析'}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        {result.needPurchase ? (
                          <button
                            onClick={() => setPayModalOpen(true)}
                            className="px-4 py-2 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 transition-colors"
                          >
                            解锁完整报告
                          </button>
                        ) : (
                          <p className="text-xs text-amber-700">
                            免费次数：{result.freeCount ?? 0} 次
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 切换 */}
              {!result.isPreview && (
                <div className="flex gap-2 border-b border-gray-100 mb-4 overflow-x-auto">
                  {[
                    { key: 'overview', label: '总览' },
                    { key: 'detail', label: '逐题解析' },
                    { key: 'exercises', label: '专项练习' },
                    ...(result.correctResult ? [{ key: 'correct', label: '客观批改' }] : []),
                    { key: 'html', label: '完整报告' },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key as any)}
                      className={`px-4 py-2 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                        activeTab === tab.key
                          ? 'border-blue-800 text-blue-800'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              )}

              {/* 预览版占位 */}
              {result.isPreview && (
                <div className="py-12 text-center">
                  <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lock size={28} className="text-amber-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">完整报告已锁定</h3>
                  <p className="text-sm text-gray-500 mb-4 max-w-md mx-auto">
                    {result.previewMessage || '登录并解锁后可查看详细学情分析、薄弱点诊断和专项练习'}
                  </p>
                  {result.needPurchase ? (
                    <button
                      onClick={() => setPayModalOpen(true)}
                      className="px-6 py-2.5 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600 transition-colors"
                    >
                      立即解锁
                    </button>
                  ) : (
                    <p className="text-sm text-gray-400">新用户注册即送 3 次免费解锁机会</p>
                  )}
                </div>
              )}

              {/* 总览 */}
              {!result.isPreview && activeTab === 'overview' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">五大模块掌握情况</h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      {result.report!.moduleScores.map((m) => (
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

                  {result.report!.weakPoints.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">重点提升方向</h3>
                      <div className="flex flex-wrap gap-2">
                        {result.report!.weakPoints.map((wp, i) => (
                          <span key={i} className="px-3 py-1.5 bg-amber-100 text-amber-800 rounded-full text-sm">
                            {wp}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="bg-blue-50 rounded-xl p-5 border-l-4 border-blue-800">
                    <h3 className="font-semibold text-blue-900 mb-2">阶段性学习建议</h3>
                    <p className="text-sm text-blue-800 leading-relaxed">{result.report!.examStrategy}</p>
                  </div>
                </div>
              )}

              {/* 逐题解析 */}
              {!result.isPreview && activeTab === 'detail' && (
                <div className="space-y-4">
                  {result.report!.questions.map((q) => (
                    <div
                      key={q.no}
                      className={`p-4 rounded-xl border-l-4 ${
                        q.isCorrect ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {q.isCorrect ? (
                          <CheckCircle size={18} className="text-green-600" />
                        ) : (
                          <AlertCircle size={18} className="text-red-600" />
                        )}
                        <span className="font-semibold text-gray-900">第{q.no}题</span>
                        <span
                          className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
                            q.isCorrect ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                          }`}
                        >
                          {q.isCorrect ? '已掌握' : '待巩固'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-700 space-y-1">
                        <p><span className="font-medium">题目：</span>{q.content}</p>
                        <p><span className="font-medium">孩子答案：</span>{q.studentAnswer}</p>
                        <p><span className="font-medium">参考解析：</span>{q.correctAnswer}</p>
                      </div>
                      <div className="mt-3 p-3 bg-white rounded-lg text-sm text-gray-700">
                        <span className="font-medium">知识分析：</span>
                        {q.analysis}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 专项练习 */}
              {!result.isPreview && activeTab === 'exercises' && (
                <div className="space-y-6">
                  {result.exercises && result.exercises.exercises.length > 0 ? (
                    <>
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
                        <h3 className="font-semibold text-blue-900 text-lg mb-1">{result.exercises.title}</h3>
                        <p className="text-sm text-blue-700">{result.exercises.description}</p>
                        <p className="text-xs text-blue-600 mt-2 bg-white/60 p-2 rounded">
                          {result.exercises.summary}
                        </p>
                      </div>

                      <div className="space-y-4">
                        {result.exercises.exercises.map((ex) => {
                          const diffColor = ex.difficulty === '基础' ? 'bg-green-100 text-green-800' : ex.difficulty === '提高' ? 'bg-amber-100 text-amber-800' : 'bg-purple-100 text-purple-800'
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
                              <div className="text-gray-900 font-medium mb-3 text-base leading-relaxed">
                                {ex.content}
                              </div>
                              <div className="bg-gray-50 rounded-lg p-3 mb-2">
                                <p className="text-sm text-gray-700">
                                  <span className="font-semibold text-green-700">答案：</span>{ex.answer}
                                </p>
                              </div>
                              <div className="bg-blue-50 rounded-lg p-3 mb-2">
                                <p className="text-sm text-blue-800">
                                  <span className="font-semibold">解析：</span>{ex.analysis}
                                </p>
                              </div>
                              <div className="text-xs text-gray-500">
                                知识点：{ex.knowledgePoint}
                              </div>
                            </div>
                          )
                        })}
                      </div>

                      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                        <p className="text-xs text-amber-800 text-center leading-relaxed">
                          <strong>说明：</strong> 以上练习由 WinGo 学情洞察软件根据本次分析结果自动生成，仅供家庭自学巩固参考。本工具为学情分析软件，不涉及任何教育培训服务。
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">📝</span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">练习生成中或暂不可用</h3>
                      <p className="text-sm text-gray-500 mb-4 max-w-md mx-auto">
                        练习题由 OpenMAIC 引擎根据孩子的薄弱点实时生成。如果暂时无法显示，可能是网络波动或引擎繁忙，请稍后刷新重试。
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* 客观批改 */}
              {!result.isPreview && activeTab === 'correct' && result.correctResult && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-5 border border-amber-100">
                    <h3 className="font-semibold text-amber-900 text-lg mb-1">WinGo 客观批改结果</h3>
                    <p className="text-sm text-amber-700">
                      学科：{result.correctResult.subject === 'math' ? '数学' : result.correctResult.subject} · 
                      共 {result.correctResult.stat.all} 题 · 
                      已批改 {result.correctResult.stat.corrected} 题
                    </p>
                  </div>

                  <div className="space-y-4">
                    {result.correctResult.questions.map((q) => (
                      <div key={q.sequence} className={`rounded-xl border p-4 ${resultBorder[q.correctResult]} ${resultBg[q.correctResult]}`}>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="w-8 h-8 bg-blue-900 text-white rounded-full flex items-center justify-center text-sm font-bold">
                            {q.sequence + 1}
                          </span>
                          <span className="text-sm text-gray-500">{q.typeName}</span>
                          <span className={`ml-auto px-3 py-1 rounded-full text-xs font-bold ${resultColor[q.correctResult]} bg-white`}>
                            {resultMap[q.correctResult]}
                          </span>
                        </div>

                        {q.question && (
                          <p className="text-sm text-gray-700 mb-2"><span className="font-medium">题目：</span>{q.question}</p>
                        )}

                        {q.slots.map((slot) => (
                          <div key={slot.sequence} className="bg-white/70 rounded-lg p-3 mb-2">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-xs font-bold ${resultColor[slot.correctResult]}`}>
                                作答区{slot.sequence}：{resultMap[slot.correctResult]}
                              </span>
                            </div>
                            {slot.reason && (
                              <p className="text-xs text-gray-600 leading-relaxed">{slot.reason}</p>
                            )}
                          </div>
                        ))}

                        {q.cropUrl && (
                          <div className="mt-2">
                            <img
                              src={q.cropUrl}
                              alt={`第${q.sequence + 1}题批改图`}
                              className="max-w-full rounded-lg border border-gray-200"
                              loading="lazy"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 完整报告 */}
              {!result.isPreview && activeTab === 'html' && result.html && (
                <div>
                  <a
                    href={`data:text/html;charset=utf-8,${encodeURIComponent(result.html)}`}
                    download="WinGo学情分析报告.html"
                    className="mb-4 inline-block px-4 py-2 bg-blue-900 text-white rounded-lg text-sm hover:bg-blue-800 transition-colors"
                  >
                    下载完整报告
                  </a>
                  <div
                    className="border border-gray-200 rounded-xl overflow-hidden"
                    dangerouslySetInnerHTML={{ __html: result.html }}
                  />
                </div>
              )}
            </div>

            {/* 免责声明 */}
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
              <p className="text-xs text-amber-800 leading-relaxed text-center">
                <strong>声明：</strong> WinGo 学情洞察是一款家庭学情分析软件工具，提供的分析报告仅供家长参考，帮助了解孩子的学习情况。本工具不涉及任何教育培训、授课或辅导服务。具体学习规划建议咨询学校教师或教育专业人士。
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 支付弹窗 —— 支付成功后自动解锁当前报告 */}
      <PayModal open={payModalOpen} onClose={() => setPayModalOpen(false)} onSuccess={handlePaySuccess} />

      {/* 历史报告弹窗 */}
      <HistoryModal
        open={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        onSelectReport={async (reportId) => {
          try {
            const headers: Record<string, string> = {}
            if (token) headers['Authorization'] = `Bearer ${token}`
            const res = await fetch(`/xsc/api/report?id=${reportId}`, { headers })
            const data = await res.json()
            if (data.success) {
              setResult({
                success: true,
                report: data.report,
                html: data.html,
                exercises: data.exercises,
                ...data,
              } as AnalysisResult)
              setActiveTab('overview')
            } else {
              alert(data.error || '加载报告失败')
            }
          } catch (e) {
            alert('加载报告失败')
          }
        }}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 mt-12">
        <div className="max-w-5xl mx-auto px-4 py-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-6 h-6 bg-blue-900 rounded-md flex items-center justify-center text-white text-xs font-bold">W</div>
            <span className="text-sm font-semibold text-gray-700">WinGo 学情洞察</span>
          </div>
          <p className="text-xs text-gray-400">AI 驱动的家庭学情分析工具 · edu.wingo.icu/xsc</p>
          <p className="text-xs text-gray-400 mt-1">本工具为家庭学情分析软件，不涉及任何教育培训服务</p>
        </div>
      </footer>
    </main>
  )
}
