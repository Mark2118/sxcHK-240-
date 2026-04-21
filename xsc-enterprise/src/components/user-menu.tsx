'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { User, LogOut, Crown, Zap } from 'lucide-react'

interface UserMenuProps {
  onOpenPay: () => void
}

export default function UserMenu({ onOpenPay }: UserMenuProps) {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)

  if (!user) return null

  const isMember = user.membershipType && user.membershipType !== 'none'

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors"
      >
        {user.avatar ? (
          <img src={user.avatar} alt="avatar" className="w-8 h-8 rounded-full object-cover" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-blue-900 text-white flex items-center justify-center text-sm font-bold">
            {user.nickname?.[0] || 'U'}
          </div>
        )}
        <span className="text-sm font-medium text-gray-700 hidden sm:inline">
          {user.nickname || '微信用户'}
        </span>
        {isMember && (
          <Crown size={14} className="text-amber-500" />
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 z-50 py-2">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-900">{user.nickname || '微信用户'}</p>
              <p className="text-xs text-gray-500 mt-0.5">{isMember ? '会员用户' : '免费用户'}</p>
            </div>

            <div className="px-4 py-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">剩余免费次数</span>
                <span className="font-medium text-blue-800">{user.freeUsesLeft ?? 0} 次</span>
              </div>
            </div>

            <button
              onClick={() => {
                setOpen(false)
                onOpenPay()
              }}
              className="w-full px-4 py-2.5 text-left text-sm text-amber-700 hover:bg-amber-50 flex items-center gap-2 transition-colors"
            >
              <Zap size={16} />
              升级会员 / 充值
            </button>

            <button
              onClick={() => {
                setOpen(false)
                logout()
              }}
              className="w-full px-4 py-2.5 text-left text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-2 transition-colors border-t border-gray-100"
            >
              <LogOut size={16} />
              退出登录
            </button>
          </div>
        </>
      )}
    </div>
  )
}
