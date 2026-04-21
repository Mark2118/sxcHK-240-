'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import {
  Camera, Brain, BookOpen, TrendingUp, ChevronDown, Check,
  ArrowRight, Sparkles, Zap, Crown, Star, Shield, Clock,
  BarChart3, GraduationCap, Lightbulb, MessageCircle, User
} from 'lucide-react'

const PLANS = [
  {
    type: 'single',
    title: '单次解锁',
    price: '9.9',
    unit: '元/次',
    desc: '解锁一份完整学情报告+专项练习',
    features: ['完整学情分析报告', '薄弱点诊断', '专项练习生成', '报告下载'],
    icon: Zap,
    color: 'blue',
    popular: false,
  },
  {
    type: 'month',
    title: '月卡',
    price: '39',
    unit: '元/月',
    desc: '30天无限次 + 微信推送 + 历史回看',
    features: ['30天无限次报告', '薄弱点诊断', '专项练习生成', '报告下载', '微信推送报告', '历史回看'],
    icon: Crown,
    color: 'amber',
    popular: true,
  },
  {
    type: 'year',
    title: '年卡',
    price: '299',
    unit: '元/年',
    desc: '全年无限次 + 成长趋势 + 年度总结',
    features: ['全年无限次报告', '薄弱点诊断', '专项练习生成', '报告下载', '成长趋势追踪', '年度学情总结', '错题本自动归类'],
    icon: Star,
    color: 'purple',
    popular: false,
  },
]

const FAQS = [
  {
    q: 'WinGo 学情洞察是什么？',
    a: 'WinGo 学情洞察是一款 AI 驱动的家庭学情分析软件工具。家长只需拍照上传孩子的作业，系统就能自动分析知识掌握情况、定位薄弱点，并生成针对性的学习建议和专项练习。',
  },
  {
    q: '分析结果准确吗？',
    a: 'WinGo 学情洞察采用自研的 WinGo 学情引擎，结合智能批改技术。对于客观题，批改准确率超过 95%；对于主观题，AI 会提供详细的知识分析和参考解析，帮助家长理解孩子的答题思路。',
  },
  {
    q: '新用户有免费体验吗？',
    a: '有的。新用户注册即送 3 次免费完整报告解锁机会。您可以先免费体验完整功能，满意后再决定是否购买会员。',
  },
  {
    q: '支持哪些学科？',
    a: '目前支持数学、语文、英语三大学科。数学支持拍照智能批改（客观题自动判断对错），语文和英语支持文本输入分析。',
  },
  {
    q: '报告可以下载保存吗？',
    a: '可以。解锁后的完整报告支持下载为 HTML 文件，方便您保存到本地或打印给孩子复习使用。',
  },
]

function FloatingCard({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <div
      className={`absolute animate-float ${className}`}
      style={{ animationDelay: `${delay}s` }}
    >
      {children}
    </div>
  )
}

function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(timer)
  }, [delay])
  return (
    <div className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
      {children}
    </div>
  )
}

export default function LandingPage() {
  const { user, loading: authLoading } = useAuth()
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  // 未登录：显示微信授权引导
  if (!authLoading && !user) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-blue-900 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <User size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">WinGo 学情洞察</h1>
          <p className="text-blue-200 mb-8 text-lg">AI 驱动的家庭学情分析工具</p>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6">
            <p className="text-white/90 mb-4">开始使用前，请先微信授权登录</p>
            <button
              onClick={() => { window.location.href = '/xsc/api/auth/wechat' }}
              className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05a5.79 5.79 0 0 1-.153-1.323c0-3.668 3.617-6.64 8.074-6.64.298 0 .591.015.881.04C17.886 4.95 13.647 2.188 8.691 2.188zM5.785 7.572a.938.938 0 1 1 0 1.876.938.938 0 0 1 0-1.876zm5.812 0a.938.938 0 1 1 0 1.876.938.938 0 0 1 0-1.876zm4.5 5.063c-3.946 0-7.146 2.36-7.146 5.273 0 2.91 3.2 5.272 7.146 5.272a8.86 8.86 0 0 0 2.443-.348.746.746 0 0 1 .617.084l1.638.96a.28.28 0 0 0 .144.046.253.253 0 0 0 .25-.254c0-.062-.025-.123-.042-.184l-.336-1.274a.51.51 0 0 1 .184-.573c1.578-1.162 2.576-2.896 2.576-4.826 0-2.912-3.2-5.272-7.146-5.272zm-2.531 3.094a.703.703 0 1 1 0 1.406.703.703 0 0 1 0-1.406zm5.063 0a.703.703 0 1 1 0 1.406.703.703 0 0 1 0-1.406z"/></svg>
              微信一键登录
            </button>
          </div>
          <p className="text-blue-300/60 text-sm">登录即表示同意服务条款与隐私政策</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-white overflow-x-hidden">
      {/* ====== HERO SECTION ====== */}
      <section className="relative bg-gradient-to-br from-slate-900 via-blue-950 to-blue-900 text-white overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute top-20 -left-20 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 pt-16 pb-24 lg:pt-24 lg:pb-32">
          {/* Nav */}
          <nav className="flex items-center justify-between mb-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/30">
                W
              </div>
              <div>
                <span className="font-bold text-lg tracking-tight">WinGo 学情洞察</span>
              </div>
            </div>
            <a
              href="/xsc/analyze"
              className="px-5 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-xl text-sm font-medium transition-all border border-white/20"
            >
              开始使用
            </a>
          </nav>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* 左侧文案 */}
            <div className="space-y-8">
              <FadeIn>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm border border-white/20">
                  <Sparkles size={14} className="text-amber-400" />
                  <span>WinGo 学情引擎驱动</span>
                </div>
              </FadeIn>

              <FadeIn delay={100}>
                <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight">
                  AI 一眼看穿
                  <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-500">
                    孩子的学习盲区
                  </span>
                </h1>
              </FadeIn>

              <FadeIn delay={200}>
                <p className="text-lg text-blue-100 leading-relaxed max-w-lg">
                  拍照上传作业，3 秒生成学情分析报告。幼升小入学准备、小升初升学冲刺、
                  全年级自适应评估，让每个家庭都有专属的学情管家。
                </p>
              </FadeIn>

              <FadeIn delay={300}>
                <div className="flex flex-wrap gap-4">
                  <a
                    href="/xsc/analyze"
                    className="group inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-2xl font-semibold text-lg hover:shadow-xl hover:shadow-amber-500/25 hover:scale-105 transition-all"
                  >
                    免费体验
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </a>
                  <a
                    href="#pricing"
                    className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-2xl font-semibold text-lg hover:bg-white/20 transition-all border border-white/20"
                  >
                    查看定价
                  </a>
                </div>
              </FadeIn>

              <FadeIn delay={400}>
                <div className="flex items-center gap-6 text-sm text-blue-200">
                  <div className="flex items-center gap-2">
                    <Check size={16} className="text-amber-400" />
                    <span>新用户送 3 次免费</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={16} className="text-amber-400" />
                    <span>一个账号支持多孩</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={16} className="text-amber-400" />
                    <span>幼升小/小升初/通用</span>
                  </div>
                </div>
              </FadeIn>
            </div>

            {/* 右侧浮动卡片 */}
            <div className="relative h-[400px] lg:h-[500px] hidden md:block">
              <FloatingCard className="top-0 left-0" delay={0}>
                <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl shadow-black/20 p-5 w-64">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                      <BarChart3 size={20} className="text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">掌握度指数</p>
                      <p className="text-xs text-gray-500">数学 · 五年级</p>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-green-600">87<span className="text-lg">%</span></div>
                  <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full w-[87%] bg-gradient-to-r from-green-500 to-green-400 rounded-full" />
                  </div>
                </div>
              </FloatingCard>

              <FloatingCard className="top-16 right-0" delay={1.5}>
                <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl shadow-black/20 p-5 w-56">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                      <Lightbulb size={16} className="text-amber-600" />
                    </div>
                    <p className="text-sm font-semibold text-gray-900">薄弱点诊断</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {['分数运算', '几何面积', '方程求解'].map((tag) => (
                      <span key={tag} className="px-2 py-1 bg-amber-50 text-amber-700 text-xs rounded-lg">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </FloatingCard>

              <FloatingCard className="bottom-20 left-8" delay={0.8}>
                <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl shadow-black/20 p-5 w-60">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <BookOpen size={16} className="text-blue-600" />
                    </div>
                    <p className="text-sm font-semibold text-gray-900">专项练习</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <div className="w-5 h-5 bg-blue-900 text-white rounded-full flex items-center justify-center text-[10px] font-bold">1</div>
                      <span>分数加减混合运算</span>
                      <span className="ml-auto px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-[10px]">基础</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <div className="w-5 h-5 bg-blue-900 text-white rounded-full flex items-center justify-center text-[10px] font-bold">2</div>
                      <span>长方形面积计算</span>
                      <span className="ml-auto px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px]">提高</span>
                    </div>
                  </div>
                </div>
              </FloatingCard>

              <FloatingCard className="bottom-0 right-8" delay={2.2}>
                <div className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-2xl shadow-2xl shadow-black/20 p-4 w-48 text-white">
                  <div className="flex items-center gap-2 mb-2">
                    <Camera size={16} />
                    <p className="text-sm font-semibold">拍照批改完成</p>
                  </div>
                  <p className="text-xs text-blue-200">共 12 题 · 已批改 12 题</p>
                  <div className="mt-2 flex gap-1">
                    <div className="flex-1 h-1.5 bg-green-400 rounded-full" />
                    <div className="flex-1 h-1.5 bg-green-400 rounded-full" />
                    <div className="flex-1 h-1.5 bg-red-400 rounded-full" />
                    <div className="flex-1 h-1.5 bg-green-400 rounded-full" />
                  </div>
                </div>
              </FloatingCard>
            </div>
          </div>

          {/* 滚动提示 */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce">
            <ChevronDown size={24} className="text-white/50" />
          </div>
        </div>
      </section>

      {/* ====== 痛点 SECTION ====== */}
      <section className="py-20 lg:py-28 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <FadeIn>
            <div className="text-center mb-16">
              <p className="text-sm font-semibold text-blue-800 uppercase tracking-wider mb-3">家长困境</p>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
                辅导作业，这些困境你是否也经历过？
              </h2>
            </div>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Brain,
                title: '不知道薄弱点在哪',
                desc: '孩子错了题，订正完就忘。同样的知识点反复出错，却找不到根本原因，只能盲目刷题。',
                color: 'red',
              },
              {
                icon: Clock,
                title: '时间精力有限',
                desc: '工作繁忙，无法逐题分析孩子的作业。想辅导却力不从心，看着错题干着急。',
                color: 'amber',
              },
              {
                icon: TrendingUp,
                title: '学习情况难追踪',
                desc: '孩子的进步与否全凭感觉，缺乏客观数据支撑。不知道哪些知识点已经掌握，哪些还需要巩固。',
                color: 'blue',
              },
            ].map((item, i) => {
              const Icon = item.icon
              const colorMap: Record<string, string> = {
                red: 'bg-red-50 text-red-600 border-red-100',
                amber: 'bg-amber-50 text-amber-600 border-amber-100',
                blue: 'bg-blue-50 text-blue-600 border-blue-100',
              }
              return (
                <FadeIn key={item.title} delay={i * 150}>
                  <div className={`rounded-2xl border p-8 ${colorMap[item.color]} bg-white`}>
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${item.color === 'red' ? 'bg-red-100' : item.color === 'amber' ? 'bg-amber-100' : 'bg-blue-100'}`}>
                      <Icon size={28} className={item.color === 'red' ? 'text-red-600' : item.color === 'amber' ? 'text-amber-600' : 'text-blue-600'} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{item.desc}</p>
                  </div>
                </FadeIn>
              )
            })}
          </div>
        </div>
      </section>

      {/* ====== 学段定位 SECTION ====== */}
      <section className="py-20 lg:py-28">
        <div className="max-w-6xl mx-auto px-4">
          <FadeIn>
            <div className="text-center mb-16">
              <p className="text-sm font-semibold text-blue-800 uppercase tracking-wider mb-3">人群定位</p>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
                为不同阶段的孩子量身定制
              </h2>
              <p className="text-gray-600 mt-4 max-w-lg mx-auto">
                一个账号支持多个孩子档案，AI 自适应判断学段，自动生成匹配的分析报告
              </p>
            </div>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: '🎒',
                title: '幼升小入学管家',
                subtitle: '幼儿园大班',
                desc: '入学准备能力评估，基础认知、逻辑思维、语言表达全方位检测，帮助家长了解孩子的入学 readiness。',
                features: ['入学能力评估', '基础认知检测', '逻辑思维训练', '语言表达分析'],
                color: 'green',
              },
              {
                icon: '📚',
                title: '小升初升学管家',
                subtitle: '小学五六年级',
                desc: '升学冲刺阶段的查漏补缺，五大模块掌握度追踪，精准定位知识薄弱点，助力小升初备考。',
                features: ['五大模块追踪', '薄弱点精准定位', '升学冲刺规划', '历年考点分析'],
                color: 'amber',
              },
              {
                icon: '🎯',
                title: '全年级自适应',
                subtitle: 'K12 全学段',
                desc: 'AI 自动判断年级和知识点深度，从幼儿园到初中全覆盖。支持多孩档案切换，一个账号管理全家学习。',
                features: ['AI 年级自适应', '全学段覆盖', '多孩档案切换', '成长趋势追踪'],
                color: 'blue',
              },
            ].map((item, i) => {
              const colorMap: Record<string, { bg: string; border: string; badge: string }> = {
                green: { bg: 'bg-green-50', border: 'border-green-100', badge: 'bg-green-100 text-green-700' },
                amber: { bg: 'bg-amber-50', border: 'border-amber-100', badge: 'bg-amber-100 text-amber-700' },
                blue: { bg: 'bg-blue-50', border: 'border-blue-100', badge: 'bg-blue-100 text-blue-700' },
              }
              const c = colorMap[item.color]
              return (
                <FadeIn key={item.title} delay={i * 150}>
                  <div className={`rounded-2xl border ${c.border} ${c.bg} p-8 h-full flex flex-col`}>
                    <div className="text-4xl mb-4">{item.icon}</div>
                    <span className={`inline-block self-start px-3 py-1 rounded-full text-xs font-semibold ${c.badge} mb-3`}>
                      {item.subtitle}
                    </span>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                    <p className="text-gray-600 leading-relaxed mb-6 flex-1">{item.desc}</p>
                    <ul className="space-y-2">
                      {item.features.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                          <Check size={14} className="text-green-500 shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                </FadeIn>
              )
            })}
          </div>
        </div>
      </section>

      {/* ====== 解决方案 SECTION ====== */}
      <section className="py-20 lg:py-28">
        <div className="max-w-6xl mx-auto px-4">
          <FadeIn>
            <div className="text-center mb-16">
              <p className="text-sm font-semibold text-blue-800 uppercase tracking-wider mb-3">解决方案</p>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
                不只是批改，更是学情诊断
              </h2>
            </div>
          </FadeIn>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Camera,
                title: '拍照智能批改',
                desc: '上传作业照片，WinGo 自动切题、客观题自动判断对错，精度高达 95%',
                step: '01',
              },
              {
                icon: Brain,
                title: 'AI 学情分析',
                desc: '五大模块掌握度评估，生成可视化雷达图，一眼看清孩子的知识版图',
                step: '02',
              },
              {
                icon: Lightbulb,
                title: '薄弱点诊断',
                desc: '逐题分析错误原因，精准定位知识盲区，不再盲目刷题',
                step: '03',
              },
              {
                icon: BookOpen,
                title: '专项练习生成',
                desc: '针对薄弱点自动生成针对性练习题，巩固提升有的放矢',
                step: '04',
              },
            ].map((item, i) => {
              const Icon = item.icon
              return (
                <FadeIn key={item.title} delay={i * 100}>
                  <div className="group relative bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-xl hover:shadow-blue-900/5 hover:border-blue-200 transition-all">
                    <div className="absolute -top-3 -right-3 w-10 h-10 bg-gray-100 group-hover:bg-blue-900 group-hover:text-white rounded-xl flex items-center justify-center text-xs font-bold text-gray-400 transition-all">
                      {item.step}
                    </div>
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-900 to-blue-700 rounded-2xl flex items-center justify-center text-white mb-5 group-hover:scale-110 transition-transform">
                      <Icon size={28} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
                  </div>
                </FadeIn>
              )
            })}
          </div>
        </div>
      </section>

      {/* ====== 流程 SECTION ====== */}
      <section className="py-20 lg:py-28 bg-gradient-to-br from-blue-900 via-blue-950 to-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-4">
          <FadeIn>
            <div className="text-center mb-16">
              <p className="text-sm font-semibold text-blue-300 uppercase tracking-wider mb-3">使用流程</p>
              <h2 className="text-3xl lg:text-4xl font-bold">
                三步搞定学情分析
              </h2>
            </div>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* 连接线 */}
            <div className="hidden md:block absolute top-16 left-[20%] right-[20%] h-0.5 bg-gradient-to-r from-blue-700 via-amber-500 to-blue-700" />

            {[
              {
                icon: Camera,
                title: '拍照上传',
                desc: '拍下孩子的作业照片，支持直接拍照或从相册选择，也支持截图粘贴',
              },
              {
                icon: Sparkles,
                title: 'AI 分析',
                desc: '3 秒内完成切题、批改、知识点分析，生成客观的数据报告',
              },
              {
                icon: GraduationCap,
                title: '查看报告',
                desc: '查看学情总览、逐题解析、薄弱点诊断和专项练习，下载保存',
              },
            ].map((item, i) => {
              const Icon = item.icon
              return (
                <FadeIn key={item.title} delay={i * 200}>
                  <div className="text-center relative">
                    <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-6 shadow-lg shadow-amber-500/30 relative z-10">
                      <Icon size={32} />
                    </div>
                    <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                    <p className="text-blue-200 leading-relaxed max-w-xs mx-auto">{item.desc}</p>
                  </div>
                </FadeIn>
              )
            })}
          </div>
        </div>
      </section>

      {/* ====== 定价 SECTION ====== */}
      <section id="pricing" className="py-20 lg:py-28 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <FadeIn>
            <div className="text-center mb-16">
              <p className="text-sm font-semibold text-blue-800 uppercase tracking-wider mb-3">定价方案</p>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
                简单透明的定价
              </h2>
              <p className="text-gray-600 mt-4 max-w-lg mx-auto">
                新用户注册即送 3 次免费完整报告，先体验再决定
              </p>
            </div>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {PLANS.map((plan, i) => {
              const Icon = plan.icon
              const isPopular = plan.popular
              return (
                <FadeIn key={plan.type} delay={i * 150}>
                  <div className={`relative rounded-2xl p-8 transition-all hover:shadow-xl ${
                    isPopular
                      ? 'bg-white border-2 border-amber-400 shadow-lg shadow-amber-500/10 scale-105'
                      : 'bg-white border border-gray-200 hover:border-gray-300'
                  }`}>
                    {isPopular && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-sm font-bold rounded-full shadow-lg">
                        最受欢迎
                      </div>
                    )}

                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${
                      plan.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                      plan.color === 'amber' ? 'bg-amber-100 text-amber-600' :
                      'bg-purple-100 text-purple-600'
                    }`}>
                      <Icon size={28} />
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 mb-1">{plan.title}</h3>
                    <p className="text-sm text-gray-500 mb-6">{plan.desc}</p>

                    <div className="flex items-baseline gap-1 mb-6">
                      <span className="text-sm text-gray-500">¥</span>
                      <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                      <span className="text-sm text-gray-500">{plan.unit}</span>
                    </div>

                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-3 text-sm text-gray-600">
                          <Check size={16} className="text-green-500 shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    <a
                      href="/xsc/analyze"
                      className={`block w-full text-center py-3.5 rounded-xl font-semibold transition-all ${
                        isPopular
                          ? 'bg-gradient-to-r from-blue-900 to-blue-700 text-white hover:shadow-lg hover:shadow-blue-900/25'
                          : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                      }`}
                    >
                      {isPopular ? '选择此方案' : '选择此方案'}
                    </a>
                  </div>
                </FadeIn>
              )
            })}
          </div>
        </div>
      </section>

      {/* ====== 信任背书 SECTION ====== */}
      <section className="py-20 lg:py-28">
        <div className="max-w-6xl mx-auto px-4">
          <FadeIn>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-8 lg:p-12 border border-blue-100">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div>
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full text-sm font-semibold text-blue-800 mb-6 shadow-sm">
                    <Shield size={16} />
                    技术背书
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    WinGo 技术，值得信赖
                  </h2>
                  <p className="text-gray-600 leading-relaxed mb-6">
                    WinGo 学情洞察由 WinGo 团队自主研发，底层采用 WinGo 学情引擎技术。
                    通过客观的数据分析，帮助家长清晰了解孩子的知识掌握情况，为家庭学习规划提供科学参考。
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm">
                      <GraduationCap size={20} className="text-blue-800" />
                      <span className="text-sm font-semibold text-gray-900">WinGo 学情引擎</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm">
                      <Brain size={20} className="text-blue-800" />
                      <span className="text-sm font-semibold text-gray-900">WinGo 智能批改</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
                    <div className="text-3xl font-bold text-blue-900 mb-1">95%+</div>
                    <div className="text-sm text-gray-500">客观题批改准确率</div>
                  </div>
                  <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
                    <div className="text-3xl font-bold text-blue-900 mb-1">&lt;3s</div>
                    <div className="text-sm text-gray-500">平均分析响应时间</div>
                  </div>
                  <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
                    <div className="text-3xl font-bold text-blue-900 mb-1">5</div>
                    <div className="text-sm text-gray-500">大模块知识评估</div>
                  </div>
                  <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
                    <div className="text-3xl font-bold text-blue-900 mb-1">3</div>
                    <div className="text-sm text-gray-500">次新用户免费体验</div>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ====== FAQ SECTION ====== */}
      <section className="py-20 lg:py-28 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4">
          <FadeIn>
            <div className="text-center mb-12">
              <p className="text-sm font-semibold text-blue-800 uppercase tracking-wider mb-3">常见问题</p>
              <h2 className="text-3xl font-bold text-gray-900">
                还有疑问？
              </h2>
            </div>
          </FadeIn>

          <div className="space-y-4">
            {FAQS.map((faq, i) => (
              <FadeIn key={i} delay={i * 80}>
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-semibold text-gray-900 pr-4">{faq.q}</span>
                    <ChevronDown
                      size={20}
                      className={`text-gray-400 shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`}
                    />
                  </button>
                  <div className={`overflow-hidden transition-all ${openFaq === i ? 'max-h-96' : 'max-h-0'}`}>
                    <p className="px-6 pb-6 text-gray-600 leading-relaxed">{faq.a}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ====== CTA SECTION ====== */}
      <section className="py-20 lg:py-28 bg-gradient-to-br from-blue-900 via-blue-950 to-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <FadeIn>
            <h2 className="text-3xl lg:text-5xl font-bold mb-6">
              开始了解孩子的学习情况
            </h2>
          </FadeIn>
          <FadeIn delay={100}>
            <p className="text-lg text-blue-200 mb-4">
              新用户注册即送 3 次免费完整报告
            </p>
            <p className="text-sm text-blue-300 mb-10">
              无需绑定信用卡，体验满意后再付费
            </p>
          </FadeIn>
          <FadeIn delay={200}>
            <a
              href="/xsc/analyze"
              className="group inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-2xl font-bold text-xl hover:shadow-2xl hover:shadow-amber-500/25 hover:scale-105 transition-all"
            >
              立即免费体验
              <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
            </a>
          </FadeIn>
        </div>
      </section>

      {/* ====== FOOTER ====== */}
      <footer className="bg-white border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-900 to-blue-700 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                  W
                </div>
                <span className="font-bold text-lg text-gray-900">WinGo 学情洞察</span>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed max-w-sm">
                AI 驱动的家庭学情分析软件工具，帮助家长客观了解孩子的学习情况，为家庭学习规划提供科学参考。
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">产品</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><a href="/xsc/analyze" className="hover:text-blue-800 transition-colors">开始使用</a></li>
                <li><a href="#pricing" className="hover:text-blue-800 transition-colors">定价方案</a></li>
                <li><span className="hover:text-blue-800 transition-colors">功能介绍</span></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">支持</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><span className="hover:text-blue-800 transition-colors">常见问题</span></li>
                <li><span className="hover:text-blue-800 transition-colors">服务条款</span></li>
                <li><span className="hover:text-blue-800 transition-colors">隐私政策</span></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-100 pt-8 text-center">
            <p className="text-sm text-gray-400">
              WinGo 学情洞察 · edu.wingo.icu/xsc · 本工具为家庭学情分析软件，不涉及任何教育培训服务
            </p>
          </div>
        </div>
      </footer>

      {/* 全局动画样式 */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </main>
  )
}
