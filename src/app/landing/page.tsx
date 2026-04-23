"use client";

import Link from "next/link";

const softShadow = { boxShadow: "0 4px 20px rgba(0,0,0,0.06)" } as React.CSSProperties;
const softShadowHover = { boxShadow: "0 12px 32px rgba(0,0,0,0.1)" } as React.CSSProperties;

export default function LandingPage() {
  return (
    <div
      className="min-h-screen"
      style={{
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', 'Segoe UI', Roboto, sans-serif",
        background: "#faf8f5",
      }}
    >
      {/* ==================== 顶部信任条 ==================== */}
      <div className="bg-orange-50 border-b border-orange-100">
        <div className="max-w-lg mx-auto px-5 py-2.5 flex items-center justify-center gap-2 text-xs text-orange-700">
          <span className="inline-block w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span>
            已有 <strong>1,247</strong> 位家长正在使用 · 累计分析 <strong>8,632</strong> 份作业
          </span>
        </div>
      </div>

      {/* ==================== HERO ==================== */}
      <div
        className="pt-10 pb-12"
        style={{ background: "linear-gradient(180deg, #fff7ed 0%, #faf8f5 100%)" }}
      >
        <div className="max-w-lg mx-auto px-5 text-center">
          {/* 品牌 */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-base"
              style={{ background: "linear-gradient(135deg, #f97316 0%, #fb923c 50%, #fdba74 100%)" }}
            >
              W
            </div>
            <span className="text-base font-bold text-gray-800">WinGo学情管家</span>
          </div>

          <h1 className="text-[28px] font-extrabold text-gray-900 leading-snug mb-4">
            拍一拍作业
            <br />
            <span className="text-orange-500">15秒</span>看懂孩子学得怎么样
          </h1>

          <p className="text-[15px] text-gray-500 leading-relaxed mb-8">
            不用下载App，微信里就能用。
            <br />
            孩子哪里会、哪里不会，管家帮您标出来。
          </p>

          {/* 主CTA */}
          <Link href="/xsc/analyze">
            <button
              className="text-white font-bold text-lg px-10 py-4 rounded-2xl w-full mb-4 hover:opacity-95 transition"
              style={{
                background: "linear-gradient(135deg, #f97316 0%, #fb923c 50%, #fdba74 100%)",
                ...softShadow,
              }}
            >
              免费试用 · 前2次不要钱
            </button>
          </Link>
          <p className="text-xs text-gray-400">👆 点一下，微信里直接开始</p>

          {/* 三个小卖点横排 */}
          <div className="flex items-center justify-center gap-4 mt-8 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <span className="text-green-500">✓</span> 不用绑卡
            </span>
            <span className="flex items-center gap-1">
              <span className="text-green-500">✓</span> 自动出报告
            </span>
            <span className="flex items-center gap-1">
              <span className="text-green-500">✓</span> 老人也会用
            </span>
          </div>
        </div>
      </div>

      {/* ==================== 场景痛点：微信聊天形式 ==================== */}
      <div className="bg-white py-12">
        <div className="max-w-lg mx-auto px-5">
          <h2 className="text-xl font-bold text-gray-900 text-center mb-8">
            这些问题，是不是您也遇到过？
          </h2>

          {/* 聊天对话 */}
          <div className="space-y-4 mb-8">
            <div className="flex gap-3">
              <div className="w-9 h-9 bg-gray-200 rounded-full flex items-center justify-center text-lg flex-shrink-0">
                👩
              </div>
              <div
                className="px-4 py-3 text-sm text-gray-700 max-w-[80%]"
                style={{
                  background: "#fff",
                  borderRadius: "18px 18px 18px 4px",
                  ...softShadow,
                }}
              >
                孩子这次考了78分，我说"要努力"，但到底该努力什么？我自己也说不清楚...
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <div
                className="px-4 py-3 text-sm text-gray-800 max-w-[80%]"
                style={{
                  background: "#fef3c7",
                  borderRadius: "18px 18px 4px 18px",
                  ...softShadow,
                }}
              >
                同班都在报班，不报怕落后，报了怕冤枉钱。钱花了，效果呢？
              </div>
              <div className="w-9 h-9 bg-orange-100 rounded-full flex items-center justify-center text-lg flex-shrink-0">
                👨
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-9 h-9 bg-gray-200 rounded-full flex items-center justify-center text-lg flex-shrink-0">
                👵
              </div>
              <div
                className="px-4 py-3 text-sm text-gray-700 max-w-[80%]"
                style={{
                  background: "#fff",
                  borderRadius: "18px 18px 18px 4px",
                  ...softShadow,
                }}
              >
                每天盯着写作业，但不知道盯得对不对。时间花了，薄弱点解决了吗？
              </div>
            </div>
          </div>

          <div className="bg-orange-50 rounded-2xl p-5 text-center border border-orange-100">
            <p className="text-[15px] text-gray-700 font-medium">
              WinGo管家帮您把 <span className="text-orange-600 font-bold">"感觉"</span> 变成{" "}
              <span className="text-orange-600 font-bold">"数据"</span>
            </p>
          </div>
        </div>
      </div>

      {/* ==================== 三步看懂孩子 ==================== */}
      <div className="py-12" style={{ background: "#faf8f5" }}>
        <div className="max-w-lg mx-auto px-5">
          <h2 className="text-xl font-bold text-gray-900 text-center mb-2">三步看懂孩子</h2>
          <p className="text-sm text-gray-400 text-center mb-8">不用懂教育，管家帮您看</p>

          <div className="space-y-6">
            {/* Step 1 */}
            <div
              className="bg-white rounded-2xl p-5 transition-all duration-300 hover:-translate-y-[3px]"
              style={softShadow}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.boxShadow = softShadowHover.boxShadow!;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.boxShadow = softShadow.boxShadow!;
              }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg text-white flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #f97316 0%, #fb923c 50%, #fdba74 100%)" }}
                >
                  1
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg mb-1">拍一拍作业</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    手写、印刷、涂改、拍得歪歪扭扭都没关系，管家都能读。
                  </p>
                  <div className="flex gap-2 mt-3">
                    <span className="inline-block px-3 py-1 rounded-[20px] text-xs font-semibold bg-blue-50 text-blue-600">
                      📷 拍照上传
                    </span>
                    <span className="inline-block px-3 py-1 rounded-[20px] text-xs font-semibold bg-green-50 text-green-600">
                      ⏱ 15秒出结果
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div
              className="bg-white rounded-2xl p-5 transition-all duration-300 hover:-translate-y-[3px]"
              style={softShadow}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.boxShadow = softShadowHover.boxShadow!;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.boxShadow = softShadow.boxShadow!;
              }}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg text-white flex-shrink-0 bg-green-500">
                  2
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg mb-1">看分析报告</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    哪里会、哪里不会、为什么不会，管家一条一条标出来。不是笼统的"粗心"，是"进位加法不熟练"。
                  </p>
                  <div className="flex gap-2 mt-3">
                    <span className="inline-block px-3 py-1 rounded-[20px] text-xs font-semibold bg-purple-50 text-purple-600">
                      📊 知识点拆解
                    </span>
                    <span className="inline-block px-3 py-1 rounded-[20px] text-xs font-semibold bg-orange-50 text-orange-600">
                      🎯 薄弱点定位
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div
              className="bg-white rounded-2xl p-5 transition-all duration-300 hover:-translate-y-[3px]"
              style={softShadow}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.boxShadow = softShadowHover.boxShadow!;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.boxShadow = softShadow.boxShadow!;
              }}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg text-white flex-shrink-0 bg-amber-500">
                  3
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg mb-1">管家持续跟踪</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    每次分析都记入档案。这个月比上个月进步了吗？哪个模块一直拖后腿？管家越用越懂您的孩子。
                  </p>
                  <div className="flex gap-2 mt-3">
                    <span className="inline-block px-3 py-1 rounded-[20px] text-xs font-semibold bg-pink-50 text-pink-600">
                      📈 成长曲线
                    </span>
                    <span className="inline-block px-3 py-1 rounded-[20px] text-xs font-semibold bg-cyan-50 text-cyan-600">
                      📋 错题归档
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== 真实家长怎么说 ==================== */}
      <div className="bg-white py-12">
        <div className="max-w-lg mx-auto px-5">
          <h2 className="text-xl font-bold text-gray-900 text-center mb-8">家长们怎么说</h2>

          <div className="space-y-4">
            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-pink-200 rounded-full flex items-center justify-center text-pink-700 font-bold text-sm">
                  林
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">林妈妈 · 六年级</p>
                  <p className="text-xs text-gray-400">使用 3 个月 · 年卡用户</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                "以前孩子考80分我觉得还行，考70分就着急。现在管家告诉我，孩子计算题基本全对，但应用题理解力弱。我就有针对性地练，不用广撒网了。"
              </p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center text-blue-700 font-bold text-sm">
                  张
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">张爸爸 · 四年级</p>
                  <p className="text-xs text-gray-400">使用 1 个月 · 月卡用户</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                "最让我惊喜的是错题本功能。以前都是我帮孩子抄错题，现在拍照就自动归类了。周末打印出来练，比自己整理的还清楚。"
              </p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-green-200 rounded-full flex items-center justify-center text-green-700 font-bold text-sm">
                  王
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">王奶奶 · 帮带孙子</p>
                  <p className="text-xs text-gray-400">使用 2 周 · 免费版</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                "我不会用那些复杂的App，这个微信里就能用，拍个照就行。儿子上班忙，我拍了管家出的报告发给他看，他知道孩子今天学了什么。"
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== 能帮您做什么（场景卡片）==================== */}
      <div className="py-12" style={{ background: "#faf8f5" }}>
        <div className="max-w-lg mx-auto px-5">
          <h2 className="text-xl font-bold text-gray-900 text-center mb-8">管家能帮您做什么</h2>

          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: "🎯", title: "精准定位薄弱点", desc: "不是\"粗心\"，是\"进位不熟练\"" },
              { icon: "📚", title: "智能错题本", desc: "自动归类，支持打印" },
              { icon: "🔄", title: "旧题新做", desc: "擦掉笔迹，卷子变新卷" },
              { icon: "📊", title: "成长趋势图", desc: "每月一张学习体检表" },
              { icon: "👶", title: "多孩档案", desc: "一个账号，各管各的" },
              { icon: "💡", title: "报班建议", desc: "该花的花，不该花的不花" },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-white rounded-2xl p-5 text-center transition-all duration-300 hover:-translate-y-[3px]"
                style={softShadow}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = softShadowHover.boxShadow!;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = softShadow.boxShadow!;
                }}
              >
                <div className="text-3xl mb-3">{item.icon}</div>
                <h4 className="font-bold text-gray-900 text-sm mb-1">{item.title}</h4>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ==================== 不同阶段 ==================== */}
      <div className="bg-white py-12">
        <div className="max-w-lg mx-auto px-5">
          <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
            不同阶段，管家不同用法
          </h2>
          <p className="text-sm text-gray-400 text-center mb-8">中间年级也适用，自动识别</p>

          <div className="space-y-4">
            <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl p-6 border border-pink-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-pink-400 rounded-xl flex items-center justify-center text-white font-bold">
                  幼
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">幼升小 · 入学管家</h3>
                  <p className="text-xs text-gray-500">孩子 ready 了吗？</p>
                </div>
              </div>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-pink-400 mt-1">●</span>入学准备度评分
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-pink-400 mt-1">●</span>幼小衔接重点建议
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-pink-400 mt-1">●</span>该报班吗？报什么？
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-6 border border-blue-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center text-white font-bold">
                  升
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">小升初 · 升学管家</h3>
                  <p className="text-xs text-gray-500">能考上目标初中吗？</p>
                </div>
              </div>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-1">●</span>升学竞争力指数
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-1">●</span>薄弱模块靶向突破
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-1">●</span>暑假该补什么？
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== 定价卡片 ==================== */}
      <div className="py-12" style={{ background: "#faf8f5" }}>
        <div className="max-w-lg mx-auto px-5">
          <h2 className="text-xl font-bold text-gray-900 text-center mb-2">选一个适合您的方案</h2>
          <p className="text-sm text-gray-400 text-center mb-8">年卡每天只要 8 毛钱</p>

          <div className="space-y-4">
            {/* 体验版 */}
            <div className="bg-white rounded-2xl p-6 border-2 border-gray-100" style={softShadow}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-900 text-lg">体验版</h3>
                <span className="text-2xl font-extrabold text-gray-900">¥0</span>
              </div>
              <p className="text-sm text-gray-500 mb-4">每月 2 次免费分析，永久有效</p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>拍照分析作业
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>查看完整报告
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-gray-300">✗</span>微信推送报告
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-gray-300">✗</span>历史回看（仅最近2次）
                </li>
              </ul>
            </div>

            {/* 月卡 */}
            <div className="bg-white rounded-2xl p-6 border-2 border-gray-100" style={softShadow}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-900 text-lg">月卡</h3>
                <span className="text-2xl font-extrabold text-gray-900">
                  ¥39<span className="text-sm font-normal text-gray-400">/月</span>
                </span>
              </div>
              <p className="text-sm text-gray-500 mb-4">每月 100 次分析，适合短期冲刺</p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>拍照分析作业
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>微信推送报告
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>30天内历史回看
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-gray-300">✗</span>成长趋势图
                </li>
              </ul>
            </div>

            {/* 年卡 推荐 */}
            <div
              className="bg-white rounded-2xl p-6 border-2 border-orange-300 relative"
              style={softShadow}
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span
                  className="text-white text-xs font-bold px-4 py-1.5 rounded-full"
                  style={{ background: "linear-gradient(135deg, #f97316 0%, #fb923c 50%, #fdba74 100%)" }}
                >
                  ⭐ 最多家长选择
                </span>
              </div>
              <div className="flex items-center justify-between mb-3 mt-2">
                <h3 className="font-bold text-gray-900 text-lg">年卡</h3>
                <div className="text-right">
                  <span className="text-2xl font-extrabold text-orange-600">
                    ¥299<span className="text-sm font-normal text-gray-400">/年</span>
                  </span>
                  <p className="text-xs text-orange-500">每天只要 8 毛钱</p>
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-4">每月 300 次分析，全年管家服务</p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>月卡全部功能
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>成长趋势图（全年追踪）
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>智能错题本汇总
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>空白卷还原（旧题新做）
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>全年历史报告回看
                </li>
              </ul>
            </div>
          </div>

          {/* 小提示 */}
          <div className="bg-blue-50 rounded-xl p-4 mt-6 border border-blue-100">
            <p className="text-sm text-blue-700 text-center">
              💡 <strong>建议：</strong>先用免费版拍 2 次作业，看看报告质量。满意再开通，不满意一分钱不花。
            </p>
          </div>
        </div>
      </div>

      {/* ==================== FAQ ==================== */}
      <div className="bg-white py-12">
        <div className="max-w-lg mx-auto px-5">
          <h2 className="text-xl font-bold text-gray-900 text-center mb-8">您可能还想问</h2>

          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
              <h4 className="font-semibold text-gray-900 mb-2 text-sm">免费次数用完了怎么办？</h4>
              <p className="text-sm text-gray-600">
                可以开通月卡或年卡。每个月1号免费次数会自动恢复，不想花钱就等下个月。
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
              <h4 className="font-semibold text-gray-900 mb-2 text-sm">两个孩子能用一个账号吗？</h4>
              <p className="text-sm text-gray-600">
                可以。添加多个孩子档案，每个孩子的学习数据分开统计，互不干扰。
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
              <h4 className="font-semibold text-gray-900 mb-2 text-sm">能分析语文和英语吗？</h4>
              <p className="text-sm text-gray-600">
                目前主要支持数学。语文英语正在开发中，年卡用户会自动获得更新，不用额外付费。
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
              <h4 className="font-semibold text-gray-900 mb-2 text-sm">拍得不清楚怎么办？</h4>
              <p className="text-sm text-gray-600">
                管家支持手写、印刷、涂改、倾斜拍摄。如果确实识别不了，会提示您重拍，不扣次数。
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== 底部CTA ==================== */}
      <div className="py-12" style={{ background: "linear-gradient(135deg, #f97316 0%, #fb923c 50%, #fdba74 100%)" }}>
        <div className="max-w-lg mx-auto px-5 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">看看孩子到底学得怎么样</h2>
          <p className="text-orange-100 mb-8 text-sm">前 2 次免费，不用绑卡 · 微信里直接就能用</p>
          <Link href="/xsc/analyze">
            <button
              className="bg-white text-orange-600 font-bold text-lg px-10 py-4 rounded-2xl w-full hover:bg-orange-50 transition"
              style={softShadow}
            >
              免费试用
            </button>
          </Link>
          <p className="text-orange-200 text-xs mt-4">已有 1,247 位家长在用 · 不满意不花钱</p>
        </div>
      </div>

      {/* ==================== 开始体验按钮 ==================== */}
      <div className="bg-gray-50 py-8 border-t border-gray-200">
        <div className="max-w-lg mx-auto px-5 text-center">
          <Link href="/xsc/analyze">
            <button
              className="text-white font-bold text-lg px-10 py-4 rounded-2xl w-full hover:opacity-95 transition"
              style={{
                background: "linear-gradient(135deg, #f97316 0%, #fb923c 50%, #fdba74 100%)",
                ...softShadow,
              }}
            >
              🚀 开始体验
            </button>
          </Link>
          <p className="text-gray-400 text-xs mt-3">点击按钮，立即进入作业分析页面</p>
        </div>
      </div>

      {/* ==================== FOOTER ==================== */}
      <div className="bg-gray-900 py-8">
        <div className="max-w-lg mx-auto px-5 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-sm"
              style={{ background: "linear-gradient(135deg, #f97316 0%, #fb923c 50%, #fdba74 100%)" }}
            >
              W
            </div>
            <span className="text-gray-300 font-semibold text-sm">WinGo学情管家</span>
          </div>
          <p className="text-gray-500 text-xs">让每个家庭都懂孩子的学习</p>
          <p className="text-gray-600 text-xs mt-2">学情信息服务 · 非培训机构</p>
        </div>
      </div>
    </div>
  );
}
