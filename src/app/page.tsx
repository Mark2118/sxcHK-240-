'use client'

import { useState } from 'react'
import { Camera, CheckCircle, Loader2 } from 'lucide-react'

type Step = 'form' | 'pay'

export default function LandingPage() {
  const [step, setStep] = useState<Step>('form')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [appId, setAppId] = useState('')

  const [form, setForm] = useState({
    company: '',
    contactName: '',
    phone: '',
    email: '',
    problem: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/xsc/api/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()

      if (!data.success) {
        setError(data.error || '提交失败')
        setLoading(false)
        return
      }

      setAppId(data.applicationId)
      setStep('pay')
      setLoading(false)
    } catch (e: any) {
      setError(e.message || '网络错误')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-900 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Camera className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">WinGo 学情洞察</h1>
          <p className="text-slate-400">拍一下，秒懂孩子学习情况</p>
        </div>

        {step === 'form' && (
          <div className="bg-slate-800 rounded-2xl p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-white mb-4 text-center">
              申请试用名额
            </h2>
            <p className="text-sm text-slate-400 mb-6 text-center">
              首批仅限 50 家企业，审核通过需缴纳 ¥500 押金锁定名额
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  公司名称 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入公司名称"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  联系人姓名 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.contactName}
                  onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入联系人姓名"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  联系电话 <span className="text-red-400">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入手机号"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  邮箱
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入邮箱（选填）"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  想解决什么问题
                </label>
                <textarea
                  value={form.problem}
                  onChange={(e) => setForm({ ...form, problem: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="简单描述您想通过 WinGo 解决的教育场景问题（选填）"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white font-semibold rounded-xl text-lg transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    提交中...
                  </>
                ) : (
                  '提交申请'
                )}
              </button>
            </form>
          </div>
        )}

        {step === 'pay' && (
          <div className="bg-slate-800 rounded-2xl p-6 shadow-xl text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">
              申请已提交
            </h2>
            <p className="text-slate-400 mb-6">
              申请编号：{appId}
            </p>

            <div className="bg-slate-700 rounded-xl p-6 mb-6">
              <h3 className="text-lg font-medium text-white mb-4">
                请支付 ¥500 押金锁定名额
              </h3>
              <div className="w-48 h-48 bg-white rounded-xl mx-auto mb-4 flex items-center justify-center">
                {/* 替换为公司收款码图片 */}
                <img
                  src="/company-qr.png"
                  alt="公司收款码"
                  className="w-44 h-44 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none'
                    const fallback = document.getElementById('qr-fallback')
                    if (fallback) fallback.style.display = 'flex'
                  }}
                />
                <div
                  id="qr-fallback"
                  className="hidden w-44 h-44 bg-slate-200 rounded-lg items-center justify-center text-slate-500 text-sm text-center p-4"
                >
                  请放置公司收款码图片<br />到 public/company-qr.png
                </div>
              </div>
              <p className="text-sm text-slate-400">
                微信支付扫码，备注「{form.company}-{form.contactName}」
              </p>
            </div>

            <div className="text-left text-sm text-slate-400 space-y-2">
              <p>1. 扫码支付 ¥500 押金</p>
              <p>2. 备注公司名称 + 联系人姓名</p>
              <p>3. 我们将在 24 小时内审核并开通账号</p>
              <p>4. 开通后会短信/微信通知您</p>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
