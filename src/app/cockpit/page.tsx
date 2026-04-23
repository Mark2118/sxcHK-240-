'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Activity, TrendingUp, TrendingDown, Users, FileText,
  CreditCard, Building2, AlertCircle, CheckCircle2, XCircle,
  RefreshCw, Clock, Zap, Server, Bot, Brain, Shield,
  ChevronRight, BarChart3, PieChart, AlertTriangle, Flag, ListChecks
} from 'lucide-react'

interface DashboardData {
  realtime: {
    todayUploads: number
    yesterdayUploads: number
    todayPayments: number
    yesterdayPayments: number
    todayNewUsers: number
    yesterdayNewUsers: number
    bLeads: number
    conversionRate: number
    uploadsChange: number
    paymentsChange: number
    usersChange: number
  }
  trends: Array<{ date: string; uploads: number; newUsers: number; payments: number }>
  overview: {
    totalUsers: number
    totalReports: number
    totalOrders: number
    totalRevenue: number
    institutionCount: number
    memberDistribution: Array<{ type: string; count: number }>
  }
  todos: {
    pendingApplications: Array<{
      id: string; company: string; contactName: string; phone: string; email?: string; problem?: string; status: string; createdAt: string
    }>
    exhaustedUsers: number
  }
  services: {
    xsc: { status: 'online' | 'offline'; responseTime: number }
    n8n: { status: 'online' | 'offline'; responseTime: number }
    openmaic: { status: 'online' | 'offline'; responseTime: number }
    dify: { status: 'online' | 'offline'; responseTime: number }
  }
  updatedAt: string
}

interface Commit {
  sha: string
  message: string
  author: string
  date: string
}

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'down'
  responseTime?: number
}

const MASTER_KEY = 'xsc-admin-2026'

/** PRD-v6 项目里程碑 */
const MILESTONES = [
  {
    phase: 'Phase 1',
    title: 'C端 MVP + 基础自动化',
    period: '现在 ~ 2周',
    target: 'C端闭环跑通，80%推送自动化',
    items: [
      { name: 'XSC 落地页', status: 'partial' as const },
      { name: '行动清单', status: 'done' as const },
      { name: '薄弱点追踪', status: 'done' as const },
      { name: 'n8n 报告推送工作流', status: 'done' as const },
      { name: 'n8n 付费转化工作流', status: 'partial' as const },
      { name: 'Dify 知识库 50+', status: 'pending' as const },
    ],
  },
  {
    phase: 'Phase 2',
    title: 'C端补齐 + 营销自动化',
    period: '1 ~ 2个月',
    target: 'C端完全自动化，一人运营1000+用户',
    items: [
      { name: '月度总结 / 年度PDF', status: 'pending' as const },
      { name: '分享裂变', status: 'pending' as const },
      { name: 'n8n 月度/续费/唤醒工作流', status: 'pending' as const },
      { name: 'Dify 知识库 100+', status: 'pending' as const },
      { name: 'OpenMAIC C端深度咨询', status: 'pending' as const },
    ],
  },
  {
    phase: 'Phase 3',
    title: 'B端 MVP + 销售自动化',
    period: '2 ~ 3个月',
    target: 'B端销售自动化，一人运营50+机构',
    items: [
      { name: 'B端管理后台', status: 'done' as const },
      { name: '批量分析', status: 'done' as const },
      { name: '班级看板', status: 'partial' as const },
      { name: 'n8n B端线索跟进', status: 'pending' as const },
      { name: 'OpenMAIC B端自动演示', status: 'pending' as const },
      { name: 'Dify B端咨询知识库', status: 'pending' as const },
    ],
  },
  {
    phase: 'Phase 4',
    title: '生态完善 + 智能化升级',
    period: '3 ~ 6个月',
    target: '完整生态闭环，OPC规模化运营',
    items: [
      { name: 'n8n 全量工作流优化', status: 'pending' as const },
      { name: 'Dify AI客服满意度90%+', status: 'pending' as const },
      { name: 'OpenMAIC 个性化学习规划', status: 'pending' as const },
      { name: 'XSC 国际版 + 微信小程序', status: 'pending' as const },
    ],
  },
]

/** 数字动画卡片 */
function StatCard({
  label,
  value,
  sub,
  change,
  icon: Icon,
  color,
}: {
  label: string
  value: string | number
  sub?: string
  change?: number
  icon: React.ElementType
  color: string
}) {
  const changeUp = change !== undefined && change >= 0
  const changeDown = change !== undefined && change < 0
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <span className="text-slate-400 text-xs font-medium">{label}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
      </div>
      <div className="text-2xl font-bold text-white tracking-tight">{value}</div>
      <div className="flex items-center gap-2 mt-1.5">
        {change !== undefined && (
          <span className={`text-xs font-medium flex items-center gap-0.5 ${changeUp ? 'text-emerald-400' : changeDown ? 'text-red-400' : 'text-slate-500'}`}>
            {changeUp ? <TrendingUp className="w-3 h-3" /> : changeDown ? <TrendingDown className="w-3 h-3" /> : null}
            {change > 0 ? '+' : ''}{change}%
          </span>
        )}
        {sub && <span className="text-xs text-slate-500">{sub}</span>}
      </div>
    </div>
  )
}

/** SVG 柱状图 */
function BarChartSVG({ data, color = '#3B82F6' }: { data: number[]; color?: string }) {
  if (!data.length) return null
  const max = Math.max(...data, 1)
  const w = 280
  const h = 100
  const barW = (w - 20) / data.length - 4
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      {data.map((v, i) => {
        const bh = (v / max) * (h - 20)
        const x = 10 + i * (barW + 4)
        const y = h - bh - 10
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={bh} rx={3} fill={color} opacity={0.85} />
          </g>
        )
      })}
    </svg>
  )
}

/** SVG 折线图（双线条） */
function LineChartSVG({
  data1,
  data2,
  color1 = '#10B981',
  color2 = '#F59E0B',
}: {
  data1: number[]
  data2: number[]
  color1?: string
  color2?: string
}) {
  if (!data1.length) return null
  const all = [...data1, ...data2]
  const max = Math.max(...all, 1)
  const w = 280
  const h = 100
  const pad = 10

  const points = (arr: number[]) =>
    arr
      .map((v, i) => {
        const x = pad + (i / (arr.length - 1)) * (w - pad * 2)
        const y = h - pad - (v / max) * (h - pad * 2)
        return `${x},${y}`
      })
      .join(' ')

  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <polyline points={points(data1)} fill="none" stroke={color1} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <polyline points={points(data2)} fill="none" stroke={color2} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** 服务状态卡片 */
function ServiceCard({
  name,
  health,
  icon: Icon,
}: {
  name: string
  health: { status: 'online' | 'offline'; responseTime: number }
  icon: React.ElementType
}) {
  const online = health.status === 'online'
  return (
    <div className={`bg-slate-900 border rounded-xl p-4 flex items-center gap-4 transition-colors ${online ? 'border-slate-800' : 'border-red-500/30'}`}>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${online ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
        <Icon className={`w-5 h-5 ${online ? 'text-emerald-400' : 'text-red-400'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white">{name}</span>
          {online ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <XCircle className="w-3.5 h-3.5 text-red-400" />
          )}
        </div>
        <div className="text-xs text-slate-500 mt-0.5">
          {online ? `${health.responseTime}ms` : '无法连接'}
        </div>
      </div>
      <div className={`w-2 h-2 rounded-full shrink-0 ${online ? 'bg-emerald-500' : 'bg-red-500'}`} />
    </div>
  )
}

export default function CockpitPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [commits, setCommits] = useState<Commit[]>([])
  const [health, setHealth] = useState<HealthStatus>({ status: 'healthy' })
  const [lastUpdate, setLastUpdate] = useState(new Date())
  const [activeTab, setActiveTab] = useState<'ops' | 'milestones'>('ops')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      // ops dashboard
      const res = await fetch(`/api/ops/dashboard?key=${MASTER_KEY}`, { cache: 'no-store' })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || '加载失败')
      setData(json.data)

      // GitHub 提交记录
      const ghRes = await fetch('https://api.github.com/repos/Mark2118/wingedu/commits?per_page=5', {
        headers: { Accept: 'application/vnd.github.v3+json' },
      })
      if (ghRes.ok) {
        const ghData = await ghRes.json()
        setCommits(ghData.map((c: any) => ({
          sha: c.sha.slice(0, 7),
          message: c.commit.message.split('\n')[0],
          author: c.commit.author.name,
          date: new Date(c.commit.author.date).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        })))
      }

      // 健康检查
      const healthRes = await fetch('/api/health')
      if (healthRes.ok) {
        setHealth({ status: 'healthy' })
      } else {
        setHealth({ status: 'degraded' })
      }
      setLastUpdate(new Date())
    } catch (e: any) {
      setError(e.message)
      setHealth({ status: 'down' })
    } finally {
      setLoading(false)
    }
    }
  }, [])

  useEffect(() => {
    load()
    const timer = setInterval(load, 30000)
    return () => clearInterval(timer)
  }, [load])

  if (loading && !data) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-sm text-slate-400">加载运营数据中...</p>
        </div>
      </main>
    )
  }

  if (error && !data) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center">
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 max-w-md">
          <div className="flex items-center gap-2 text-red-400 mb-2">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">数据加载失败</span>
          </div>
          <p className="text-sm text-slate-400 mb-4">{error}</p>
          <button onClick={load} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition-colors">
            重试
          </button>
        </div>
      </main>
    )
  }

  const d = data!

  return (
    <main className="min-h-screen bg-slate-950 text-slate-200">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-blue-900/20">
              W
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">WinGo OPC 运营仪表盘</h1>
              <p className="text-xs text-slate-400">一人公司运营监控 · PRD-v6</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-500">
              更新于 {lastUpdate.toLocaleTimeString('zh-CN')}
            </span>
            <button
              onClick={load}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs transition-colors disabled:opacity-50 border border-slate-700"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              刷新
            </button>
          </div>
        </div>
      </header>

      {/* Tab 切换 */}
      <div className="max-w-7xl mx-auto px-6 pt-4">
        <div className="flex items-center gap-1 bg-slate-900/80 border border-slate-800 rounded-lg p-1 w-fit">
          <button
            onClick={() => setActiveTab('ops')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'ops' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            运营监控
          </button>
          <button
            onClick={() => setActiveTab('milestones')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'milestones' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flag className="w-3.5 h-3.5" />
            项目里程碑
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {activeTab === 'ops' && (
          <>
        {/* 实时指标 */}
        <section>
          <h2 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-400" />
            实时指标
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="今日上传"
              value={d.realtime.todayUploads}
              change={d.realtime.uploadsChange}
              sub="份学情报告"
              icon={FileText}
              color="bg-blue-500"
            />
            <StatCard
              label="今日付费"
              value={d.realtime.todayPayments}
              change={d.realtime.paymentsChange}
              sub={`转化率 ${d.realtime.conversionRate}%`}
              icon={CreditCard}
              color="bg-emerald-500"
            />
            <StatCard
              label="今日新增用户"
              value={d.realtime.todayNewUsers}
              change={d.realtime.usersChange}
              sub="位家长注册"
              icon={Users}
              color="bg-violet-500"
            />
            <StatCard
              label="B端待处理线索"
              value={d.realtime.bLeads}
              sub="条试用申请"
              icon={Building2}
              color="bg-amber-500"
            />
          </div>
        </section>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* 左侧：趋势图表 */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h2 className="text-sm font-semibold text-white mb-5 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-slate-400" />
                近7天业务趋势
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs text-slate-500 mb-3">每日上传报告数</p>
                  <BarChartSVG data={d.trends.map(t => t.uploads)} color="#3B82F6" />
                  <div className="flex justify-between mt-2 text-[10px] text-slate-600">
                    {d.trends.map((t, i) => (
                      <span key={i}>{t.date}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-3">新增用户 vs 付费转化</p>
                  <LineChartSVG
                    data1={d.trends.map(t => t.newUsers)}
                    data2={d.trends.map(t => t.payments)}
                  />
                  <div className="flex justify-between mt-2 text-[10px] text-slate-600">
                    {d.trends.map((t, i) => (
                      <span key={i}>{t.date}</span>
                    ))}
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-[10px]">
                    <span className="flex items-center gap-1 text-emerald-400"><span className="w-2 h-0.5 bg-emerald-400 rounded" />新增用户</span>
                    <span className="flex items-center gap-1 text-amber-400"><span className="w-2 h-0.5 bg-amber-400 rounded" />付费转化</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 业务概览 */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h2 className="text-sm font-semibold text-white mb-5 flex items-center gap-2">
                <PieChart className="w-4 h-4 text-slate-400" />
                业务总览
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: '累计用户', value: d.overview.totalUsers, icon: Users },
                  { label: '累计报告', value: d.overview.totalReports, icon: FileText },
                  { label: '累计订单', value: d.overview.totalOrders, icon: CreditCard },
                  { label: '累计营收', value: `¥${(d.overview.totalRevenue / 100).toFixed(0)}`, icon: TrendingUp },
                ].map(item => (
                  <div key={item.label} className="bg-slate-800/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <item.icon className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-xs text-slate-400">{item.label}</span>
                    </div>
                    <div className="text-xl font-bold text-white">{item.value}</div>
                  </div>
                ))}
              </div>

              {/* 会员分布 */}
              <div className="mt-6">
                <p className="text-xs text-slate-500 mb-3">会员类型分布</p>
                <div className="flex items-center gap-6">
                  <div className="flex-1 space-y-2">
                    {d.overview.memberDistribution.map(m => {
                      const total = d.overview.memberDistribution.reduce((s, x) => s + x.count, 0)
                      const pct = total > 0 ? Math.round((m.count / total) * 100) : 0
                      const labelMap: Record<string, string> = { none: '免费用户', month: '月卡会员', year: '年卡会员' }
                      const colorMap: Record<string, string> = { none: 'bg-slate-500', month: 'bg-blue-500', year: 'bg-emerald-500' }
                      return (
                        <div key={m.type} className="flex items-center gap-3">
                          <span className="text-xs text-slate-400 w-20">{labelMap[m.type] || m.type}</span>
                          <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div className={`h-full ${colorMap[m.type] || 'bg-slate-500'} rounded-full`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-slate-300 w-12 text-right">{m.count}人</span>
                        </div>
                      )
                    })}
                  </div>
                  <div className="text-center min-w-[80px]">
                    <div className="text-2xl font-bold text-white">{d.overview.institutionCount}</div>
                    <div className="text-xs text-slate-500">入驻机构</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 右侧栏 */}
          <div className="space-y-6">
            {/* 自动化运行状态 */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4 text-slate-400" />
                自动化运行状态
              </h2>
              <div className="space-y-3">
                <ServiceCard name="XSC 核心引擎" health={d.services.xsc} icon={Server} />
                <ServiceCard name="n8n 工作流" health={d.services.n8n} icon={Bot} />
                <ServiceCard name="OpenMAIC 咨询" health={d.services.openmaic} icon={Brain} />
                <ServiceCard name="Dify AI客服" health={d.services.dify} icon={Shield} />
              </div>
            </div>

            {/* 待处理事项 */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                待处理事项
              </h2>

              {/* 试用申请 */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-400">待处理试用申请</span>
                  <span className="text-xs text-amber-400 font-medium">{d.todos.pendingApplications.length} 条</span>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {d.todos.pendingApplications.length === 0 && (
                    <p className="text-xs text-slate-600 py-2">暂无待处理申请</p>
                  )}
                  {d.todos.pendingApplications.slice(0, 5).map(app => (
                    <div key={app.id} className="bg-slate-800/50 rounded-lg p-2.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300 font-medium truncate">{app.company}</span>
                        <span className="text-slate-500">{app.contactName}</span>
                      </div>
                      <div className="text-slate-500 mt-1">{app.phone}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 待转化用户 */}
              <div className="bg-amber-500/5 border border-amber-500/10 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-amber-400">免费额度用完待转化</span>
                  <span className="text-sm font-bold text-amber-400">{d.todos.exhaustedUsers} 人</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">n8n 已自动推送转化消息</p>
              </div>
            </div>

            {/* 快捷链接 */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h2 className="text-sm font-semibold text-white mb-4">快捷入口</h2>
              <div className="space-y-2">
                {[
                  { label: 'B端管理后台', href: '/xsc/b-admin', icon: Building2 },
                  { label: '学情趋势分析', href: '/xsc/trends', icon: TrendingUp },
                  { label: 'n8n 工作流', href: 'http://localhost:5678', icon: Bot, external: true },
                  { label: 'OpenMAIC', href: 'http://localhost:3001', icon: Brain, external: true },
                ].map(link => (
                  <a
                    key={link.label}
                    href={link.href}
                    target={link.external ? '_blank' : undefined}
                    rel={link.external ? 'noreferrer' : undefined}
                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-800 transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      <link.icon className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors" />
                      <span className="text-xs text-slate-300 group-hover:text-white transition-colors">{link.label}</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 transition-colors" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
        </>
        )}

        {activeTab === 'milestones' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <ListChecks className="w-4 h-4 text-blue-400" />
                PRD-v6 项目里程碑
              </h2>
              <span className="text-xs text-slate-500">最后更新：2026-04-23</span>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {MILESTONES.map((m, idx) => {
                const done = m.items.filter(i => i.status === 'done').length
                const partial = m.items.filter(i => i.status === 'partial').length
                const total = m.items.length
                const pct = Math.round(((done + partial * 0.5) / total) * 100)
                const statusColor = pct >= 80 ? 'border-emerald-500/30' : pct >= 40 ? 'border-amber-500/30' : 'border-slate-800'
                const barColor = pct >= 80 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-500' : 'bg-blue-500'

                return (
                  <div key={idx} className={`bg-slate-900 border ${statusColor} rounded-xl p-6`}>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-blue-400">{m.phase}</span>
                          <span className="text-xs text-slate-500">{m.period}</span>
                        </div>
                        <h3 className="text-sm font-semibold text-white">{m.title}</h3>
                        <p className="text-xs text-slate-500 mt-1">{m.target}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-white">{pct}%</div>
                        <div className="text-[10px] text-slate-500">{done}/{total} 完成</div>
                      </div>
                    </div>

                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mb-4">
                      <div className={`h-full ${barColor} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                    </div>

                    <div className="space-y-2">
                      {m.items.map((item, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          {item.status === 'done' ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          ) : item.status === 'partial' ? (
                            <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          ) : (
                            <div className="w-3.5 h-3.5 rounded-full border border-slate-600 shrink-0" />
                          )}
                          <span className={item.status === 'done' ? 'text-emerald-400' : item.status === 'partial' ? 'text-amber-400' : 'text-slate-500'}>
                            {item.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* 总览 */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-white mb-4">总体进度</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: '已完成任务', value: MILESTONES.reduce((s, m) => s + m.items.filter(i => i.status === 'done').length, 0), color: 'text-emerald-400' },
                  { label: '进行中任务', value: MILESTONES.reduce((s, m) => s + m.items.filter(i => i.status === 'partial').length, 0), color: 'text-amber-400' },
                  { label: '待开始任务', value: MILESTONES.reduce((s, m) => s + m.items.filter(i => i.status === 'pending').length, 0), color: 'text-slate-500' },
                  { label: '总任务数', value: MILESTONES.reduce((s, m) => s + m.items.length, 0), color: 'text-white' },
                ].map(stat => (
                  <div key={stat.label} className="bg-slate-800/50 rounded-lg p-4 text-center">
                    <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                    <div className="text-xs text-slate-500 mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
