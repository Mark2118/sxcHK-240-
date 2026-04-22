'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, BarChart3, FileText, ChevronRight, GraduationCap } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

interface GradeOption {
  key: string
  label: string
  subtitle: string
  emoji: string
}

const GRADES: GradeOption[] = [
  { key: 'kindergarten', label: '幼升小', subtitle: '入学准备评估', emoji: '🎒' },
  { key: 'primary', label: '小升初', subtitle: '升学冲刺分析', emoji: '📚' },
  { key: 'general', label: '通用', subtitle: '全年级自适应', emoji: '🎯' },
]

const STEPS = [
  { icon: Camera, label: '拍照上传', desc: '作业/试卷随手拍' },
  { icon: BarChart3, label: 'AI 分析', desc: '学情引擎深度解析' },
  { icon: FileText, label: '学情报告', desc: '掌握度与薄弱点' },
]

export default function LandingPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [selectedGrade, setSelectedGrade] = useState<string>('general')
  const [isNavigating, setIsNavigating] = useState(false)

  const handleStart = async () => {
    if (isNavigating) return
    setIsNavigating(true)

    // 已登录直接跳转
    if (user) {
      router.push(`/xsc/analyze?grade=${selectedGrade}`)
      return
    }

    // 未登录：模拟微信登录（同 analyze 页面逻辑）
    try {
      const mockCode = 'mock_wx_code_' + Date.now()
      const res = await fetch('/xsc/api/auth/wechat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: mockCode }),
      })
      const data = await res.json()
      if (data.success && data.token) {
        localStorage.setItem('xsc_token', data.token)
        window.location.href = `/xsc/analyze?grade=${selectedGrade}`
      } else {
        alert('登录失败: ' + (data.error || '请稍后重试'))
        setIsNavigating(false)
      }
    } catch (e) {
      alert('网络错误，请稍后重试')
      setIsNavigating(false)
    }
  }

  return (
    <main className="min-h-screen bg-white flex flex-col">
      {/* 顶部导航 */}
      <header className="absolute top-0 left-0 right-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-900 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              W
            </div>
            <span className="text-sm font-semibold text-gray-900">WinGo 学情管家</span>
          </div>
          {user && (
            <span className="text-xs text-gray-400">
              剩余 {user.freeUsesLeft ?? 0} 次免费分析
            </span>
          )}
        </div>
      </header>

      {/* 主体内容 -- 1屏 */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-20">
        <div className="w-full max-w-lg">
          {/* 品牌区 */}
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-blue-900 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-blue-900/20">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight">
              WinGo 学情管家
            </h1>
            <p className="text-gray-500 text-base leading-relaxed">
              基于 WinGo 学情引擎，为家庭提供科学的学情分析参考
            </p>
          </div>

          {/* 学段选择 */}
          <div className="mb-8">
            <p className="text-sm text-gray-400 text-center mb-3">选择孩子当前阶段</p>
            <div className="grid grid-cols-3 gap-3">
              {GRADES.map((g) => (
                <button
                  key={g.key}
                  onClick={() => setSelectedGrade(g.key)}
                  className={`relative py-4 px-2 rounded-xl border-2 text-center transition-all ${
                    selectedGrade === g.key
                      ? 'border-blue-900 bg-blue-50 text-blue-900'
                      : 'border-gray-100 bg-white text-gray-600 hover:border-gray-200'
                  }`}
                >
                  <div className="text-xl mb-1">{g.emoji}</div>
                  <div className="text-sm font-semibold">{g.label}</div>
                  <div className={`text-[11px] mt-0.5 ${
                    selectedGrade === g.key ? 'text-blue-700' : 'text-gray-400'
                  }`}>
                    {g.subtitle}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 三步流程 */}
          <div className="flex items-center justify-center gap-2 mb-10">
            {STEPS.map((step, i) => (
              <div key={step.label} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center mb-1.5">
                    <step.icon className="w-5 h-5 text-gray-400" />
                  </div>
                  <span className="text-xs text-gray-500 font-medium">{step.label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <ChevronRight className="w-4 h-4 text-gray-300 mx-1 mt-[-14px]" />
                )}
              </div>
            ))}
          </div>

          {/* CTA 按钮 */}
          <button
            onClick={handleStart}
            disabled={isNavigating || authLoading}
            className="w-full py-4 bg-blue-900 hover:bg-blue-800 disabled:bg-blue-900/50 text-white font-semibold rounded-xl text-lg transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
          >
            {isNavigating ? (
              <span className="flex items-center gap-2">
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                正在进入...
              </span>
            ) : (
              <>
                开始体验
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>

          {/* 底部定价 */}
          <div className="mt-8 flex items-center justify-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
              免费体验 3 次
            </span>
            <span className="text-gray-200">|</span>
            <span>月卡 ¥39</span>
            <span className="text-gray-200">|</span>
            <span>年卡 ¥299</span>
          </div>

          {/* 声明 */}
          <p className="mt-4 text-[11px] text-gray-300 text-center leading-relaxed max-w-xs mx-auto">
            WinGo 学情管家为家庭学情分析软件工具，报告仅供家长参考，不涉及任何教育培训服务
          </p>
        </div>
      </div>
    </main>
  )
}
