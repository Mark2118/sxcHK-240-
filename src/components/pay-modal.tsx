'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { X, Check, Crown, Zap, Star, Loader2, QrCode, Copy, ArrowLeft } from 'lucide-react'

interface PayModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

const PLANS = [
  {
    type: 'single' as const,
    title: '单次解锁',
    price: 9.9,
    unit: '元/次',
    desc: '解锁一份完整学情报告+专项练习',
    icon: Zap,
    color: 'blue',
    popular: false,
  },
  {
    type: 'month' as const,
    title: '月卡',
    price: 39,
    unit: '元/月',
    desc: '30天无限次 + 历史回看',
    icon: Crown,
    color: 'amber',
    popular: true,
  },
  {
    type: 'year' as const,
    title: '年卡',
    price: 299,
    unit: '元/年',
    desc: '全年无限次 + 成长趋势 + 年度总结',
    icon: Star,
    color: 'purple',
    popular: false,
  },
]

export default function PayModal({ open, onClose, onSuccess }: PayModalProps) {
  const { token, refreshUser } = useAuth()
  const [selected, setSelected] = useState<'single' | 'month' | 'year'>('month')
  const [step, setStep] = useState<'select' | 'qr'>('select')
  const [loading, setLoading] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState('')
  const [orderId, setOrderId] = useState('')
  const [copied, setCopied] = useState(false)

  if (!open) return null

  const selectedPlan = PLANS.find(p => p.type === selected)!

  const handleCreateOrder = async () => {
    if (!token) {
      setError('请先登录')
      return
    }
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ type: selected }),
      })
      const data = await res.json()

      if (!data.success) {
        setError(data.error || '创建订单失败')
        setLoading(false)
        return
      }

      setOrderId(data.orderId)
      setStep('qr')
      setLoading(false)
    } catch (e: any) {
      setError(e.message || '创建订单失败')
      setLoading(false)
    }
  }

  const handleConfirmPay = async () => {
    if (!token || !orderId) return
    setConfirming(true)
    setError('')

    try {
      const res = await fetch('/api/orders/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId }),
      })
      const data = await res.json()

      if (!data.success) {
        setError(data.error || '提交确认失败')
        setConfirming(false)
        return
      }

      await refreshUser()
      onSuccess?.()
      onClose()
      setStep('select')
      setConfirming(false)
    } catch (e: any) {
      setError(e.message || '提交确认失败')
      setConfirming(false)
    }
  }

  const copyOrderId = () => {
    navigator.clipboard.writeText(orderId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              {step === 'qr' && (
                <button onClick={() => setStep('select')} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                  <ArrowLeft size={20} className="text-gray-500" />
                </button>
              )}
              <h2 className="text-xl font-bold text-gray-900">
                {step === 'select' ? '升级会员' : '扫码支付'}
              </h2>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          {step === 'select' ? (
            <>
              <p className="text-sm text-gray-500 mb-4">
                新用户注册即送 <strong className="text-blue-800">3 次免费</strong> 完整报告体验
              </p>

              <div className="space-y-3 mb-6">
                {PLANS.map((plan) => {
                  const Icon = plan.icon
                  const isSelected = selected === plan.type
                  const colorMap: Record<string, string> = {
                    blue: 'border-blue-500 bg-blue-50',
                    amber: 'border-amber-500 bg-amber-50',
                    purple: 'border-purple-500 bg-purple-50',
                  }
                  const defaultBorder = 'border-gray-200 hover:border-gray-300'

                  return (
                    <button
                      key={plan.type}
                      onClick={() => setSelected(plan.type)}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all relative ${
                        isSelected ? colorMap[plan.color] : defaultBorder
                      }`}
                    >
                      {plan.popular && (
                        <span className="absolute -top-2 right-4 px-2 py-0.5 bg-amber-500 text-white text-xs font-bold rounded-full">
                          推荐
                        </span>
                      )}
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          plan.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                          plan.color === 'amber' ? 'bg-amber-100 text-amber-600' :
                          'bg-purple-100 text-purple-600'
                        }`}>
                          <Icon size={20} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900">{plan.title}</span>
                            {isSelected && <Check size={16} className="text-green-600" />}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">{plan.desc}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-gray-900">¥{plan.price}</div>
                          <div className="text-xs text-gray-500">{plan.unit}</div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg">
                  {error}
                </div>
              )}

              <button
                onClick={handleCreateOrder}
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-blue-900 to-blue-700 text-white rounded-xl font-medium hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    处理中...
                  </>
                ) : (
                  <>
                    <Zap size={18} />
                    立即支付
                  </>
                )}
              </button>
            </>
          ) : (
            /* QR Code Step */
            <div className="space-y-5">
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 text-sm rounded-full mb-3">
                  <QrCode size={16} />
                  请使用微信或支付宝扫码支付 ¥{selectedPlan.price}
                </div>
              </div>

              {/* QR Code Area */}
              <div className="flex flex-col items-center gap-3">
                <div className="w-56 h-56 bg-gray-100 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300">
                  {/* 二维码图片：部署前替换为真实收款码 */}
                  <img
                    src="/company-qr.png"
                    alt="公司收款二维码"
                    className="w-52 h-52 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                      const placeholder = document.getElementById('qr-placeholder')
                      if (placeholder) placeholder.style.display = 'flex'
                    }}
                  />
                  <div id="qr-placeholder" className="hidden flex-col items-center justify-center text-gray-400">
                    <QrCode size={48} className="mb-2" />
                    <span className="text-sm">请上传收款二维码</span>
                    <span className="text-xs mt-1">public/company-qr.png</span>
                  </div>
                </div>

                {/* Order Info */}
                <div className="w-full bg-gray-50 rounded-lg p-3 text-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-gray-500">订单编号</span>
                    <button onClick={copyOrderId} className="flex items-center gap-1 text-blue-600 hover:text-blue-700">
                      <span className="font-mono">{orderId.slice(0, 16)}...</span>
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">支付金额</span>
                    <span className="font-bold text-gray-900">¥{selectedPlan.price}</span>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-800 space-y-2">
                <p className="font-medium">支付步骤：</p>
                <ol className="list-decimal list-inside space-y-1 text-blue-700">
                  <li>使用微信或支付宝扫描上方二维码</li>
                  <li>转账 <strong>¥{selectedPlan.price}</strong></li>
                  <li>备注中填写您的 <strong>注册手机号</strong> 或订单号</li>
                  <li>点击下方"我已支付"提交确认</li>
                </ol>
                <p className="text-xs text-blue-600 pt-1">
                  我们将在 10 分钟内确认到账并开通会员
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">
                  {error}
                </div>
              )}

              <button
                onClick={handleConfirmPay}
                disabled={confirming}
                className="w-full py-3 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-xl font-medium hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {confirming ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    提交中...
                  </>
                ) : (
                  <>
                    <Check size={18} />
                    我已支付，请确认开通
                  </>
                )}
              </button>

              <p className="text-xs text-gray-400 text-center">
                如有疑问请联系客服微信：WinGoEdu
              </p>
            </div>
          )}

          <p className="text-xs text-gray-400 text-center mt-4">
            支付即表示同意《WinGo 学情洞察服务条款》
          </p>
        </div>
      </div>
    </div>
  )
}
