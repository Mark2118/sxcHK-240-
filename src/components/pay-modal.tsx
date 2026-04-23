'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { X, Check, Crown, Zap, Star, Loader2 } from 'lucide-react'

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
    desc: '30天无限次 + 微信推送 + 历史回看',
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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!open) return null

  const handlePay = async () => {
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

      // Mock 模式下直接模拟支付成功
      if (data.mock) {
        // 模拟回调
        await fetch('/api/orders/callback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: data.orderId }),
        })
        await refreshUser()
        onSuccess?.()
        onClose()
        setLoading(false)
        return
      }

      // 真实微信支付：调起 JSAPI
      const payParams = data.payParams
      if (typeof window !== 'undefined' && (window as any).WeixinJSBridge) {
        ;(window as any).WeixinJSBridge.invoke(
          'getBrandWCPayRequest',
          {
            appId: payParams.appId,
            timeStamp: payParams.timeStamp,
            nonceStr: payParams.nonceStr,
            package: payParams.package,
            signType: payParams.signType,
            paySign: payParams.paySign,
          },
          async (res: any) => {
            if (res.err_msg === 'get_brand_wcpay_request:ok') {
              await refreshUser()
              onSuccess?.()
              onClose()
            } else {
              setError('支付已取消或失败')
            }
            setLoading(false)
          }
        )
      } else {
        setError('请在微信内打开以完成支付')
        setLoading(false)
      }
    } catch (e: any) {
      setError(e.message || '支付出错')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">升级会员</h2>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
              <X size={20} className="text-gray-500" />
            </button>
          </div>

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
            onClick={handlePay}
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

          <p className="text-xs text-gray-400 text-center mt-4">
            支付即表示同意《WinGo 学情洞察服务条款》
          </p>
        </div>
      </div>
    </div>
  )
}
