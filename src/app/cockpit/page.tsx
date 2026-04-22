'use client'

import { useState, useEffect } from 'react'
import {
  Activity, GitBranch, Server, Users, CheckCircle, Clock, AlertTriangle,
  Rocket, BarChart3, Shield, Zap, ArrowUpRight, RefreshCw
} from 'lucide-react'

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

const TEAM = [
  {
    id: '01',
    name: '01号（Mac）',
    role: 'MVP / C端核心 / 自动化',
    tasks: [
      { name: 'C端 API 闭环', done: true, total: true },
      { name: '数据库 Schema', done: true, total: true },
      { name: '报告页 / 趋势页', done: true, total: true },
      { name: 'n8n 工作流', done: false, total: true },
      { name: 'Dify 客服', done: false, total: true },
      { name: '微信生态', done: false, total: true },
      { name: 'Mac 部署', done: false, total: true },
    ],
    status: 'deploying' as const,
  },
  {
    id: '02',
    name: '02号（Windows）',
    role: 'B端后台 / 深度咨询',
    tasks: [
      { name: 'B端数据库表', done: true, total: true },
      { name: 'B端 API', done: true, total: true },
      { name: '管理后台页面', done: true, total: true },
      { name: '批量分析核心', done: true, total: true },
      { name: '班级看板', done: true, total: true },
      { name: 'OpenMAIC 咨询', done: true, total: true },
    ],
    status: 'developing' as const,
  },
  {
    id: '04',
    name: '04号（YK04）',
    role: '代码审查 / 市场调研',
    tasks: [
      { name: '代码审查报告', done: true, total: true },
      { name: '市场调研报告', done: true, total: true },
      { name: '盈利能力分析', done: true, total: true },
      { name: 'PR Review', done: false, total: true },
    ],
    status: 'reviewing' as const,
  },
]

const MILESTONES = [
  { date: '2026-04-19', title: 'v1.0.0 基础文本分析', done: true },
  { date: '2026-04-20', title: 'v1.0.8 拍照智能批改', done: true },
  { date: '2026-04-21', title: 'PRD v6 OPC生态版定稿', done: true },
  { date: '2026-04-22', title: '极简落地页 + B端框架', done: true },
  { date: '2026-04-22', title: 'MVP Mac 部署内测', done: true, current: false },
  { date: '2026-04-22', title: 'B端深度自查+批量分析上线', done: true, current: false },
  { date: '2026-04-23', title: 'n8n 工作流修复 + Dify 客服', done: false },
  { date: '2026-04-24', title: '微信登录 + 支付完整测试', done: false },
  { date: '2026-04-25', title: '服务器生产部署', done: false },
]

export default function CockpitPage() {
  const [commits, setCommits] = useState<Commit[]>([])
  const [health, setHealth] = useState<HealthStatus>({ status: 'healthy' })
  const [lastUpdate, setLastUpdate] = useState(new Date())
  const [refreshing, setRefreshing] = useState(false)

  const loadData = async () => {
    setRefreshing(true)
    try {
      // GitHub 提交记录
      const res = await fetch('https://api.github.com/repos/Mark2118/wingedu/commits?per_page=5', {
        headers: { Accept: 'application/vnd.github.v3+json' },
      })
      if (res.ok) {
        const data = await res.json()
        setCommits(data.map((c: any) => ({
          sha: c.sha.slice(0, 7),
          message: c.commit.message.split('\n')[0],
          author: c.commit.author.name,
          date: new Date(c.commit.author.date).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        })))
      }

      // 健康检查
      const healthRes = await fetch('/xsc/api/health')
      if (healthRes.ok) {
        setHealth({ status: 'healthy' })
      } else {
        setHealth({ status: 'degraded' })
      }
    } catch {
      setHealth({ status: 'down' })
    }
    setLastUpdate(new Date())
    setRefreshing(false)
  }

  useEffect(() => {
    loadData()
    const timer = setInterval(loadData, 30000)
    return () => clearInterval(timer)
  }, [])

  const statusConfig = {
    healthy: { color: 'bg-emerald-500', text: '运行中', icon: CheckCircle },
    degraded: { color: 'bg-amber-500', text: '异常', icon: AlertTriangle },
    down: { color: 'bg-red-500', text: '离线', icon: Activity },
    deploying: { color: 'bg-blue-500', text: '部署中', icon: Rocket },
    developing: { color: 'bg-purple-500', text: '开发中', icon: Zap },
    reviewing: { color: 'bg-cyan-500', text: '审查中', icon: Shield },
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-200">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold">W</div>
            <div>
              <h1 className="text-lg font-bold text-white">WinGo 学情管家 — 项目驾驶舱</h1>
              <p className="text-xs text-slate-400">指挥官视图 · 实时进度追踪</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-500">
              更新于 {lastUpdate.toLocaleTimeString('zh-CN')}
            </span>
            <button onClick={loadData} disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs transition-colors disabled:opacity-50">
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              刷新
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">

        {/* 核心指标卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'C端 MVP', value: '75%', sub: '6/8 任务完成', color: 'text-blue-400', bg: 'bg-blue-500/10' },
            { label: 'B端 v0.1', value: '100%', sub: '6/6 任务完成', color: 'text-purple-400', bg: 'bg-purple-500/10' },
            { label: '代码审查', value: '75%', sub: '3/4 完成', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
            { label: '服务器', value: health.status === 'healthy' ? '正常' : '异常', sub: '阿里云 200 / 香港 240', color: health.status === 'healthy' ? 'text-emerald-400' : 'text-red-400', bg: health.status === 'healthy' ? 'bg-emerald-500/10' : 'bg-red-500/10' },
          ].map(card => (
            <div key={card.label} className={`${card.bg} border border-slate-800 rounded-xl p-5`}>
              <p className="text-slate-400 text-xs mb-1">{card.label}</p>
              <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
              <p className="text-slate-500 text-xs mt-1">{card.sub}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* 团队进度 */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h2 className="text-sm font-semibold text-white mb-5 flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-400" />
                团队进度
              </h2>
              <div className="space-y-5">
                {TEAM.map(member => {
                  const done = member.tasks.filter(t => t.done).length
                  const total = member.tasks.length
                  const pct = Math.round((done / total) * 100)
                  const cfg = statusConfig[member.status]
                  return (
                    <div key={member.id}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className={`w-2 h-2 rounded-full ${cfg.color}`} />
                          <span className="text-sm font-medium text-white">{member.name}</span>
                          <span className="text-xs text-slate-500">{member.role}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${cfg.color.replace('bg-', 'bg-').replace('500', '500/20')} ${cfg.color.replace('bg-', 'text-')}`}>
                            {cfg.text}
                          </span>
                        </div>
                        <span className="text-sm font-bold text-white">{pct}%</span>
                      </div>
                      <div className="h-2 bg-slate-800 rounded-full overflow-hidden mb-2">
                        <div className={`h-full ${cfg.color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1">
                        {member.tasks.map(t => (
                          <span key={t.name} className={`text-xs ${t.done ? 'text-emerald-400' : 'text-slate-600'}`}>
                            {t.done ? '✓' : '○'} {t.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 里程碑 */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h2 className="text-sm font-semibold text-white mb-5 flex items-center gap-2">
                <Rocket className="w-4 h-4 text-slate-400" />
                里程碑
              </h2>
              <div className="relative">
                <div className="absolute left-[7px] top-2 bottom-2 w-px bg-slate-800" />
                <div className="space-y-4">
                  {MILESTONES.map((m, i) => (
                    <div key={i} className="flex items-start gap-4 relative">
                      <div className={`w-4 h-4 rounded-full border-2 shrink-0 mt-0.5 z-10 ${
                        m.done ? 'bg-emerald-500 border-emerald-500' :
                        m.current ? 'bg-blue-500 border-blue-500 animate-pulse' :
                        'bg-slate-900 border-slate-600'
                      }`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium ${m.done ? 'text-emerald-400' : m.current ? 'text-blue-400' : 'text-slate-500'}`}>
                            {m.title}
                          </span>
                          {m.current && <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded">当前</span>}
                        </div>
                        <span className="text-xs text-slate-600">{m.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 右侧栏 */}
          <div className="space-y-6">
            {/* 服务器状态 */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Server className="w-4 h-4 text-slate-400" />
                服务器状态
              </h2>
              <div className="space-y-3">
                {[
                  { name: '阿里云 200', role: '大陆生产', status: 'healthy' as const },
                  { name: '香港 240', role: '海外生产', status: 'healthy' as const },
                  { name: 'Mac 55', role: '内测站', status: 'deploying' as const },
                ].map(s => {
                  const cfg = statusConfig[s.status]
                  return (
                    <div key={s.name} className="flex items-center justify-between py-2 border-b border-slate-800/50 last:border-0">
                      <div>
                        <div className="text-sm text-white">{s.name}</div>
                        <div className="text-xs text-slate-500">{s.role}</div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${cfg.color.replace('bg-', 'bg-').replace('500', '500/20')} ${cfg.color.replace('bg-', 'text-')}`}>
                        {cfg.text}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* GitHub 动态 */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-slate-400" />
                最近提交
              </h2>
              <div className="space-y-3">
                {commits.length > 0 ? commits.map(c => (
                  <div key={c.sha} className="text-sm">
                    <div className="text-slate-300 truncate" title={c.message}>{c.message}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      <span className="text-slate-400 font-mono">{c.sha}</span> · {c.author} · {c.date}
                    </div>
                  </div>
                )) : (
                  <div className="text-sm text-slate-500">加载中...</div>
                )}
              </div>
              <a href="https://github.com/Mark2118/wingedu/commits/main" target="_blank" rel="noreferrer"
                className="mt-4 flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300">
                查看全部提交 <ArrowUpRight className="w-3 h-3" />
              </a>
            </div>

            {/* 关键指标 */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-slate-400" />
                项目指标
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">仓库提交</span>
                  <span className="text-white font-mono">30+</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">文档产出</span>
                  <span className="text-white font-mono">15+</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">API 接口</span>
                  <span className="text-white font-mono">15+</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">前端页面</span>
                  <span className="text-white font-mono">7</span>
                </div>
              </div>
            </div>

            {/* 待办提醒 */}
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-amber-400 mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                当前阻塞
              </h3>
              <ul className="space-y-2 text-xs text-slate-300">
                <li>• n8n 工作流报错待修复</li>
                <li>• wingo.asia 备案中</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
