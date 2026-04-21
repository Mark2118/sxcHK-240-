'use client'

import { useState } from 'react'

export default function WechatTestPage() {
  const [openid, setOpenid] = useState('')
  const [status, setStatus] = useState('')

  const sendTestMsg = async () => {
    if (!openid) {
      setStatus('请输入 OpenID')
      return
    }

    try {
      setStatus('发送中...')
      const res = await fetch('/xsc/api/wechat/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          openid,
          data: {
            first: { value: '您孩子的学情报告已生成', color: '#173177' },
            keyword1: { value: '数学学情分析报告' },
            keyword2: { value: '小明' },
            keyword3: { value: '85分' },
            keyword4: { value: '正确率 85%' },
            keyword5: { value: '2026-04-21 18:00' },
            remark: { value: '点击详情查看完整报告 →' },
          },
          url: 'https://edu.wingo.icu/xsc',
        }),
      })

      const data = await res.json()
      if (data.error) {
        setStatus(`发送失败: ${data.error}`)
      } else {
        setStatus('✅ 测试消息发送成功！')
      }
    } catch (err: any) {
      setStatus(`错误: ${err.message}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow p-6 space-y-4">
        <h1 className="text-xl font-bold text-center">微信模板消息测试</h1>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">OpenID</label>
            <input
              type="text"
              value={openid}
              onChange={(e) => setOpenid(e.target.value)}
              placeholder="输入测试用户的微信 OpenID"
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>

          <button
            onClick={sendTestMsg}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            发送测试消息
          </button>
        </div>

        {status && (
          <div className="bg-yellow-50 border border-yellow-200 p-3 rounded text-sm">
            {status}
          </div>
        )}

        <div className="text-xs text-gray-400 text-center">
          模板：作业批改完成通知
        </div>
      </div>
    </div>
  )
}
