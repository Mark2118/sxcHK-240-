'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  LayoutDashboard, Users, GraduationCap, Settings, LogOut,
  Plus, Trash2, BarChart3, Palette, Camera, Loader2,
  Building2, School, ChevronRight, X, ImagePlus, TrendingUp, AlertTriangle, CheckCircle2, Zap
} from 'lucide-react'

interface Institution {
  id: string
  name: string
  type: string
  contact: string
  phone: string
  email?: string
  logo?: string
  primaryColor?: string
  plan: string
}

interface ClassItem {
  id: string
  name: string
  grade: number
  subject: string
  studentCount?: number
}

interface Student {
  id: string
  name: string
  classId: string
  parentUserId?: string
}

interface DashboardData {
  stats: { classCount: number; studentCount: number; batchCount: number; completedBatchCount: number }
  classes: ClassItem[]
}

type View = 'dashboard' | 'classes' | 'students' | 'batch' | 'brand'

export default function BAdminPage() {
  const [institution, setInstitution] = useState<Institution | null>(null)
  const [apiKey, setApiKey] = useState('')
  const [apiSecret, setApiSecret] = useState('')
  const [loading, setLoading] = useState(false)
  const [view, setView] = useState<View>('dashboard')
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [toast, setToast] = useState('')

  // 批量分析状态
  const [batchImages, setBatchImages] = useState<string[]>([])
  const [batchClassId, setBatchClassId] = useState('')
  const [batchSubject, setBatchSubject] = useState('math')
  const [batchLoading, setBatchLoading] = useState(false)
  const [batchResult, setBatchResult] = useState<any>(null)
  const [batchHistory, setBatchHistory] = useState<any[]>([])
  const batchFileRef = useRef<HTMLInputElement>(null)

  // 从 localStorage 恢复登录态
  useEffect(() => {
    const savedKey = localStorage.getItem('b_api_key')
    const savedSecret = localStorage.getItem('b_api_secret')
    if (savedKey && savedSecret) {
      setApiKey(savedKey)
      setApiSecret(savedSecret)
      fetchMe(savedKey, savedSecret)
    }
  }, [])

  const fetchMe = async (key: string, secret: string) => {
    try {
      const res = await fetch('/api/b/institution/me', {
        headers: { 'x-api-key': key, 'x-api-secret': secret },
      })
      const data = await res.json()
      if (data.success) {
        setInstitution(data.data)
        localStorage.setItem('b_api_key', key)
        localStorage.setItem('b_api_secret', secret)
      } else {
        logout()
      }
    } catch {
      logout()
    }
  }

  const logout = () => {
    setInstitution(null)
    setApiKey('')
    setApiSecret('')
    localStorage.removeItem('b_api_key')
    localStorage.removeItem('b_api_secret')
  }

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  // ============ 登录/注册 ============
  const handleLogin = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/b/institution/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey, apiSecret }),
      })
      const data = await res.json()
      if (data.success) {
        setInstitution(data.data)
        localStorage.setItem('b_api_key', apiKey)
        localStorage.setItem('b_api_secret', apiSecret)
        showToast('登录成功')
      } else {
        showToast(data.message || '登录失败')
      }
    } catch {
      showToast('网络错误')
    }
    setLoading(false)
  }

  const [regForm, setRegForm] = useState({ name: '', type: 'training', contact: '', phone: '', email: '' })
  const handleRegister = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/b/institution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regForm),
      })
      const data = await res.json()
      if (data.success) {
        setApiKey(data.data.apiKey)
        setApiSecret(data.data.apiSecret)
        setInstitution(data.data)
        localStorage.setItem('b_api_key', data.data.apiKey)
        localStorage.setItem('b_api_secret', data.data.apiSecret)
        showToast('注册成功，请保存好 API Key 和 Secret')
      } else {
        showToast(data.message || '注册失败')
      }
    } catch {
      showToast('网络错误')
    }
    setLoading(false)
  }

  // ============ 数据加载 ============
  const authHeaders = () => ({ 'x-api-key': apiKey, 'x-api-secret': apiSecret })

  const loadDashboard = useCallback(async () => {
    const res = await fetch('/api/b/dashboard', { headers: authHeaders() })
    const data = await res.json()
    if (data.success) setDashboard(data.data)
  }, [apiKey, apiSecret])

  const loadClasses = useCallback(async () => {
    const res = await fetch('/api/b/class', { headers: authHeaders() })
    const data = await res.json()
    if (data.success) setClasses(data.data)
  }, [apiKey, apiSecret])

  const loadStudents = useCallback(async () => {
    const res = await fetch('/api/b/student', { headers: authHeaders() })
    const data = await res.json()
    if (data.success) setStudents(data.data)
  }, [apiKey, apiSecret])

  const loadBatchHistory = useCallback(async () => {
    const res = await fetch('/api/b/batch', { headers: authHeaders() })
    const data = await res.json()
    if (data.success) setBatchHistory(data.data)
  }, [apiKey, apiSecret])

  useEffect(() => {
    if (!institution) return
    if (view === 'dashboard') loadDashboard()
    if (view === 'classes') loadClasses()
    if (view === 'students') { loadClasses(); loadStudents() }
    if (view === 'batch') { loadClasses(); loadBatchHistory() }
  }, [institution, view, loadDashboard, loadClasses, loadStudents, loadBatchHistory])

  // ============ 班级操作 ============
  const [clsForm, setClsForm] = useState({ name: '', grade: 1, subject: 'math' })
  const addClass = async () => {
    if (!clsForm.name) return showToast('请输入班级名称')
    const res = await fetch('/api/b/class', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(clsForm),
    })
    const data = await res.json()
    if (data.success) { showToast('班级添加成功'); loadClasses(); setClsForm({ name: '', grade: 1, subject: 'math' }) }
    else showToast(data.message || '添加失败')
  }
  const delClass = async (id: string) => {
    if (!confirm('确定删除该班级？')) return
    const res = await fetch(`/api/b/class?id=${id}`, { method: 'DELETE', headers: authHeaders() })
    const data = await res.json()
    if (data.success) { showToast('班级已删除'); loadClasses() }
  }

  // ============ 学员操作 ============
  const [stuForm, setStuForm] = useState({ name: '', classId: '' })
  const addStudent = async () => {
    if (!stuForm.name || !stuForm.classId) return showToast('请填写姓名和选择班级')
    const res = await fetch('/api/b/student', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(stuForm),
    })
    const data = await res.json()
    if (data.success) { showToast('学员添加成功'); loadStudents(); setStuForm({ name: '', classId: '' }) }
    else showToast(data.message || '添加失败')
  }
  const delStudent = async (id: string) => {
    if (!confirm('确定删除该学员？')) return
    const res = await fetch(`/api/b/student?id=${id}`, { method: 'DELETE', headers: authHeaders() })
    const data = await res.json()
    if (data.success) { showToast('学员已删除'); loadStudents() }
  }

  // ============ 品牌设置 ============
  const [brandForm, setBrandForm] = useState({ name: '', contact: '', phone: '', email: '', primaryColor: '#3B82F6' })
  useEffect(() => {
    if (institution) {
      setBrandForm({
        name: institution.name,
        contact: institution.contact,
        phone: institution.phone,
        email: institution.email || '',
        primaryColor: institution.primaryColor || '#3B82F6',
      })
    }
  }, [institution])
  const saveBrand = async () => {
    const res = await fetch('/api/b/institution/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(brandForm),
    })
    const data = await res.json()
    if (data.success) { showToast('品牌设置已保存'); fetchMe(apiKey, apiSecret) }
    else showToast('保存失败')
  }

  // ============ 批量分析操作 ============
  const handleBatchImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    const remaining = 3 - batchImages.length
    const toProcess = Math.min(files.length, remaining)
    for (let i = 0; i < toProcess; i++) {
      const file = files[i]
      const reader = new FileReader()
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setBatchImages(prev => [...prev, ev.target!.result as string])
        }
      }
      reader.readAsDataURL(file)
    }
    if (files.length > remaining) {
      showToast(`最多上传3张图片，已自动选取前${remaining}张`)
    }
    e.target.value = ''
  }

  const removeBatchImage = (idx: number) => {
    setBatchImages(prev => prev.filter((_, i) => i !== idx))
  }

  const submitBatchAnalysis = async () => {
    if (!batchClassId) return showToast('请选择班级')
    if (batchImages.length === 0) return showToast('请至少上传1张作业图片')
    setBatchLoading(true)
    setBatchResult(null)
    try {
      const res = await fetch('/api/b/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ classId: batchClassId, images: batchImages, subject: batchSubject }),
      })
      const data = await res.json()
      if (data.success) {
        setBatchResult(data.data)
        setBatchImages([])
        setBatchClassId('')
        showToast('批量分析完成')
        loadBatchHistory()
      } else {
        showToast(data.message || '分析失败')
      }
    } catch {
      showToast('网络错误，请重试')
    }
    setBatchLoading(false)
  }

  // ============ 渲染 ============
  if (!institution) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-blue-900 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">WinGo B端管理后台</h1>
            <p className="text-gray-500 text-sm mt-1">机构学情管理入口</p>
          </div>

          {/* 登录 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
            <h2 className="font-semibold text-gray-900 mb-4">机构登录</h2>
            <div className="space-y-3">
              <input type="text" placeholder="API Key" value={apiKey} onChange={e => setApiKey(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-900" />
              <input type="password" placeholder="API Secret" value={apiSecret} onChange={e => setApiSecret(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-900" />
              <button onClick={handleLogin} disabled={loading}
                className="w-full py-3 bg-blue-900 text-white rounded-xl font-medium hover:bg-blue-800 disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : '登录'}
              </button>
              {process.env.NODE_ENV === 'development' && (
                <button onClick={async () => {
                  setLoading(true)
                  try {
                    const res = await fetch('/xsc/api/b/institution', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ name: '演示机构', type: 'training', contact: '演示', phone: '13800000000' }),
                    })
                    const data = await res.json()
                    if (data.success) {
                      setApiKey(data.data.apiKey)
                      setApiSecret(data.data.apiSecret)
                      setInstitution(data.data)
                      localStorage.setItem('b_api_key', data.data.apiKey)
                      localStorage.setItem('b_api_secret', data.data.apiSecret)
                      showToast('演示登录成功')
                    } else {
                      showToast(data.message || '演示登录失败')
                    }
                  } catch {
                    showToast('网络错误')
                  }
                  setLoading(false)
                }} disabled={loading}
                  className="w-full py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2">
                  <Zap className="w-4 h-4" /> 开发演示登录（免密）
                </button>
              )}
            </div>
          </div>

          {/* 注册 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">新机构注册</h2>
            <div className="space-y-3">
              <input type="text" placeholder="机构名称" value={regForm.name} onChange={e => setRegForm({ ...regForm, name: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-900" />
              <select value={regForm.type} onChange={e => setRegForm({ ...regForm, type: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-900">
                <option value="kindergarten">私立幼儿园</option>
                <option value="tutoring">托管班</option>
                <option value="private_school">私立小学</option>
                <option value="international">国际小学</option>
                <option value="training">培训机构</option>
              </select>
              <input type="text" placeholder="联系人" value={regForm.contact} onChange={e => setRegForm({ ...regForm, contact: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-900" />
              <input type="tel" placeholder="联系电话" value={regForm.phone} onChange={e => setRegForm({ ...regForm, phone: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-900" />
              <input type="email" placeholder="邮箱（选填）" value={regForm.email} onChange={e => setRegForm({ ...regForm, email: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-900" />
              <button onClick={handleRegister} disabled={loading}
                className="w-full py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : '注册机构'}
              </button>
            </div>
          </div>
        </div>

        {toast && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-xl shadow-lg text-sm z-50">
            {toast}
          </div>
        )}
      </main>
    )
  }

  const navItems: { key: View; label: string; icon: any }[] = [
    { key: 'dashboard', label: '数据看板', icon: LayoutDashboard },
    { key: 'classes', label: '班级管理', icon: School },
    { key: 'students', label: '学员管理', icon: Users },
    { key: 'batch', label: '批量分析', icon: Camera },
    { key: 'brand', label: '品牌设置', icon: Palette },
  ]

  return (
    <main className="min-h-screen bg-gray-50 flex">
      {/* 侧边栏 */}
      <aside className="w-60 bg-white border-r border-gray-100 flex flex-col">
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-900 rounded-lg flex items-center justify-center text-white font-bold text-sm">W</div>
            <div>
              <div className="text-sm font-semibold text-gray-900 truncate max-w-[140px]">{institution.name}</div>
              <div className="text-[11px] text-gray-400">{institution.plan === 'trial' ? '试用版' : institution.plan}</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(item => (
            <button key={item.key} onClick={() => setView(item.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                view === item.key ? 'bg-blue-50 text-blue-900' : 'text-gray-600 hover:bg-gray-50'
              }`}>
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-100">
          <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:bg-gray-50 transition-colors">
            <LogOut className="w-4 h-4" />
            退出登录
          </button>
        </div>
      </aside>

      {/* 内容区 */}
      <div className="flex-1 p-8 overflow-auto">
        {/* 数据看板 */}
        {view === 'dashboard' && (
          <div className="space-y-6">
            <h1 className="text-xl font-bold text-gray-900">数据看板</h1>
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: '班级数', value: dashboard?.stats.classCount ?? 0, icon: School, color: 'bg-blue-50 text-blue-700' },
                { label: '学员数', value: dashboard?.stats.studentCount ?? 0, icon: Users, color: 'bg-green-50 text-green-700' },
                { label: '批量任务', value: dashboard?.stats.batchCount ?? 0, icon: Camera, color: 'bg-amber-50 text-amber-700' },
                { label: '已完成', value: dashboard?.stats.completedBatchCount ?? 0, icon: BarChart3, color: 'bg-purple-50 text-purple-700' },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-5">
                  <div className={`w-10 h-10 ${s.color} rounded-lg flex items-center justify-center mb-3`}>
                    <s.icon className="w-5 h-5" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{s.value}</div>
                  <div className="text-xs text-gray-400 mt-1">{s.label}</div>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h2 className="font-semibold text-gray-900 mb-4">班级分布</h2>
              {dashboard?.classes && dashboard.classes.length > 0 ? (
                <div className="space-y-3">
                  {dashboard.classes.map(c => (
                    <div key={c.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-700 font-bold text-xs">{c.name.charAt(0)}</div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{c.name}</div>
                          <div className="text-xs text-gray-400">{c.grade}年级 · {c.subject === 'math' ? '数学' : c.subject === 'chinese' ? '语文' : '英语'}</div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">{c.studentCount ?? 0} 人</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400 text-sm">暂无班级数据，请先添加班级</div>
              )}
            </div>
          </div>
        )}

        {/* 班级管理 */}
        {view === 'classes' && (
          <div className="space-y-6">
            <h1 className="text-xl font-bold text-gray-900">班级管理</h1>
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h2 className="font-semibold text-gray-900 mb-4">添加班级</h2>
              <div className="flex gap-3">
                <input type="text" placeholder="班级名称（如：六年级一班）" value={clsForm.name} onChange={e => setClsForm({ ...clsForm, name: e.target.value })}
                  className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-900" />
                <select value={clsForm.grade} onChange={e => setClsForm({ ...clsForm, grade: Number(e.target.value) })}
                  className="w-28 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-900">
                  {Array.from({ length: 9 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>{i + 1}年级</option>
                  ))}
                </select>
                <select value={clsForm.subject} onChange={e => setClsForm({ ...clsForm, subject: e.target.value })}
                  className="w-28 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-900">
                  <option value="math">数学</option>
                  <option value="chinese">语文</option>
                  <option value="english">英语</option>
                </select>
                <button onClick={addClass} className="px-5 py-3 bg-blue-900 text-white rounded-xl font-medium hover:bg-blue-800 flex items-center gap-2">
                  <Plus className="w-4 h-4" /> 添加
                </button>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-6 py-3 text-gray-500 font-medium">班级名称</th>
                    <th className="text-left px-6 py-3 text-gray-500 font-medium">年级</th>
                    <th className="text-left px-6 py-3 text-gray-500 font-medium">学科</th>
                    <th className="text-right px-6 py-3 text-gray-500 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {classes.map(c => (
                    <tr key={c.id} className="border-t border-gray-50">
                      <td className="px-6 py-3 font-medium text-gray-900">{c.name}</td>
                      <td className="px-6 py-3 text-gray-600">{c.grade}年级</td>
                      <td className="px-6 py-3 text-gray-600">{c.subject === 'math' ? '数学' : c.subject === 'chinese' ? '语文' : '英语'}</td>
                      <td className="px-6 py-3 text-right">
                        <button onClick={() => delClass(c.id)} className="text-red-500 hover:text-red-700">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {classes.length === 0 && (
                    <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-400">暂无班级</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 学员管理 */}
        {view === 'students' && (
          <div className="space-y-6">
            <h1 className="text-xl font-bold text-gray-900">学员管理</h1>
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h2 className="font-semibold text-gray-900 mb-4">添加学员</h2>
              <div className="flex gap-3">
                <input type="text" placeholder="学员姓名" value={stuForm.name} onChange={e => setStuForm({ ...stuForm, name: e.target.value })}
                  className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-900" />
                <select value={stuForm.classId} onChange={e => setStuForm({ ...stuForm, classId: e.target.value })}
                  className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-900">
                  <option value="">选择班级</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <button onClick={addStudent} className="px-5 py-3 bg-blue-900 text-white rounded-xl font-medium hover:bg-blue-800 flex items-center gap-2">
                  <Plus className="w-4 h-4" /> 添加
                </button>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-6 py-3 text-gray-500 font-medium">姓名</th>
                    <th className="text-left px-6 py-3 text-gray-500 font-medium">班级</th>
                    <th className="text-right px-6 py-3 text-gray-500 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(s => {
                    const cls = classes.find(c => c.id === s.classId)
                    return (
                      <tr key={s.id} className="border-t border-gray-50">
                        <td className="px-6 py-3 font-medium text-gray-900">{s.name}</td>
                        <td className="px-6 py-3 text-gray-600">{cls?.name || '-'}</td>
                        <td className="px-6 py-3 text-right">
                          <button onClick={() => delStudent(s.id)} className="text-red-500 hover:text-red-700">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                  {students.length === 0 && (
                    <tr><td colSpan={3} className="px-6 py-12 text-center text-gray-400">暂无学员</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 批量分析 */}
        {view === 'batch' && (
          <div className="space-y-6">
            <h1 className="text-xl font-bold text-gray-900">批量分析</h1>

            {/* 上传区域 */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <div className="grid grid-cols-3 gap-4 mb-4">
                {batchImages.map((img, idx) => (
                  <div key={idx} className="relative group">
                    <img src={img} alt={`作业${idx + 1}`} className="w-full h-32 object-cover rounded-lg border border-gray-200" />
                    <button onClick={() => removeBatchImage(idx)}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs">
                      <X className="w-3 h-3" />
                    </button>
                    <div className="text-xs text-gray-500 mt-1 text-center">作业 {idx + 1}</div>
                  </div>
                ))}
                {batchImages.length < 3 && (
                  <button onClick={() => batchFileRef.current?.click()}
                    className="h-32 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-blue-900 hover:text-blue-900 transition-colors">
                    <ImagePlus className="w-6 h-6 mb-1" />
                    <span className="text-xs">添加图片</span>
                    <span className="text-[10px] text-gray-300">最多3张</span>
                  </button>
                )}
              </div>
              <input ref={batchFileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleBatchImageSelect} />

              <div className="flex gap-3">
                <select value={batchClassId} onChange={e => setBatchClassId(e.target.value)}
                  className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-900">
                  <option value="">选择班级</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <select value={batchSubject} onChange={e => setBatchSubject(e.target.value)}
                  className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-900">
                  <option value="math">数学</option>
                  <option value="chinese">语文</option>
                  <option value="english">英语</option>
                </select>
                <button onClick={submitBatchAnalysis} disabled={batchLoading}
                  className="px-6 py-3 bg-blue-900 text-white rounded-xl font-medium hover:bg-blue-800 disabled:opacity-50 flex items-center gap-2">
                  {batchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                  {batchLoading ? '分析中...' : '开始批量分析'}
                </button>
              </div>
            </div>

            {/* 分析结果 */}
            {batchResult && (
              <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-6">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-semibold">分析完成</span>
                </div>
                {/* 汇总卡片 */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-blue-50 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-blue-900">{batchResult.summary?.avgScore ?? 0}</div>
                    <div className="text-xs text-blue-600 mt-1">班级均分</div>
                  </div>
                  <div className="bg-green-50 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-green-900">{batchResult.completed ?? 0}</div>
                    <div className="text-xs text-green-600 mt-1">已分析</div>
                  </div>
                  <div className="bg-amber-50 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-amber-900">{batchResult.summary?.classWeakPoints?.length ?? 0}</div>
                    <div className="text-xs text-amber-600 mt-1">薄弱点</div>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-purple-900">{batchResult.summary?.moduleAvg?.length ?? 0}</div>
                    <div className="text-xs text-purple-600 mt-1">知识模块</div>
                  </div>
                </div>
                {/* 学生排名 */}
                {batchResult.summary?.studentRank?.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">学生排名</h3>
                    <div className="space-y-2">
                      {batchResult.summary.studentRank.map((s: any) => (
                        <div key={s.rank} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${s.rank === 1 ? 'bg-amber-100 text-amber-700' : s.rank === 2 ? 'bg-gray-200 text-gray-700' : s.rank === 3 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'}`}>{s.rank}</span>
                            <span className="text-sm font-medium">{s.name}</span>
                          </div>
                          <span className="text-sm font-bold text-gray-900">{s.score}分</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* 薄弱点 */}
                {batchResult.summary?.classWeakPoints?.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" /> 班级薄弱点
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {batchResult.summary.classWeakPoints.map((wp: any, i: number) => (
                        <span key={i} className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-sm">
                          {wp.name} <span className="text-amber-400">·</span> {wp.count}次
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {/* 模块分布 */}
                {batchResult.summary?.moduleAvg?.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-blue-500" /> 知识模块掌握度
                    </h3>
                    <div className="space-y-3">
                      {batchResult.summary.moduleAvg.map((m: any) => (
                        <div key={m.module}>
                          <div className="flex justify-between text-sm mb-1">
                            <span>{m.module}</span>
                            <span className="font-medium">{m.avgRate}%</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-900 rounded-full transition-all" style={{ width: `${m.avgRate}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 历史记录 */}
            {batchHistory.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-50 font-semibold text-gray-900">分析历史</div>
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-6 py-3 text-gray-500 font-medium">时间</th>
                      <th className="text-left px-6 py-3 text-gray-500 font-medium">班级</th>
                      <th className="text-left px-6 py-3 text-gray-500 font-medium">状态</th>
                      <th className="text-left px-6 py-3 text-gray-500 font-medium">进度</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batchHistory.map(b => {
                      const cls = classes.find(c => c.id === b.classId)
                      return (
                        <tr key={b.id} className="border-t border-gray-50">
                          <td className="px-6 py-3 text-gray-600">{new Date(b.createdAt).toLocaleString()}</td>
                          <td className="px-6 py-3 font-medium text-gray-900">{cls?.name || '-'}</td>
                          <td className="px-6 py-3">
                            <span className={`px-2 py-0.5 rounded text-xs ${b.status === 'completed' ? 'bg-green-100 text-green-700' : b.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                              {b.status === 'completed' ? '已完成' : b.status === 'failed' ? '失败' : '处理中'}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-gray-600">{b.completed}/{b.total}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 品牌设置 */}
        {view === 'brand' && (
          <div className="space-y-6">
            <h1 className="text-xl font-bold text-gray-900">品牌设置</h1>
            <div className="bg-white rounded-xl border border-gray-100 p-6 max-w-xl">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">机构名称</label>
                  <input type="text" value={brandForm.name} onChange={e => setBrandForm({ ...brandForm, name: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">联系人</label>
                  <input type="text" value={brandForm.contact} onChange={e => setBrandForm({ ...brandForm, contact: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">联系电话</label>
                  <input type="tel" value={brandForm.phone} onChange={e => setBrandForm({ ...brandForm, phone: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
                  <input type="email" value={brandForm.email} onChange={e => setBrandForm({ ...brandForm, email: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">主题色</label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={brandForm.primaryColor} onChange={e => setBrandForm({ ...brandForm, primaryColor: e.target.value })}
                      className="w-12 h-10 rounded-lg border border-gray-200 cursor-pointer" />
                    <span className="text-sm text-gray-500">{brandForm.primaryColor}</span>
                  </div>
                </div>
                <button onClick={saveBrand}
                  className="w-full py-3 bg-blue-900 text-white rounded-xl font-medium hover:bg-blue-800">
                  保存设置
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-xl shadow-lg text-sm z-50">
          {toast}
        </div>
      )}
    </main>
  )
}
