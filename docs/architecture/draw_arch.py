#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
WinGo 学情管家 - 系统架构图生成器
生成 PNG 图片 + Mermaid 代码 + ASCII 文本
"""

import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch
import sys

# 修复编码
sys.stdout.reconfigure(encoding='utf-8')

# 设置中文字体
plt.rcParams['font.sans-serif'] = ['SimHei', 'Microsoft YaHei', 'DejaVu Sans']
plt.rcParams['axes.unicode_minus'] = False

def draw_wingo_architecture():
    fig, ax = plt.subplots(1, 1, figsize=(24, 18))
    ax.set_xlim(0, 24)
    ax.set_ylim(0, 18)
    ax.axis('off')
    ax.set_facecolor('#f8f9fa')
    fig.patch.set_facecolor('#f8f9fa')

    # 标题
    ax.text(12, 17.3, 'WinGo 学情管家 -- 系统架构图', fontsize=26, fontweight='bold',
            ha='center', va='center', color='#1a1a2e')
    ax.text(12, 16.8, 'OPC 一人公司生态版  |  v6.0', fontsize=14,
            ha='center', va='center', color='#666')

    colors = {
        'user': '#e3f2fd',
        'entry': '#fff3e0',
        'core': '#e8f5e9',
        'ai': '#fce4ec',
        'data': '#f3e5f5',
        'auto': '#e0f7fa',
        'service': '#fff8e1',
        'infra': '#eceff1',
        'border_user': '#1976d2',
        'border_entry': '#f57c00',
        'border_core': '#388e3c',
        'border_ai': '#c2185b',
        'border_data': '#7b1fa2',
        'border_auto': '#0097a7',
        'border_service': '#fbc02d',
        'border_infra': '#546e7a',
    }

    def draw_box(ax, x, y, w, h, text, color_key, fontsize=11, bold=False):
        box = FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.02,rounding_size=0.15",
                             facecolor=colors[color_key], edgecolor=colors[f'border_{color_key}'],
                             linewidth=2.5, alpha=0.95, zorder=2)
        ax.add_patch(box)
        weight = 'bold' if bold else 'normal'
        ax.text(x + w/2, y + h/2, text, fontsize=fontsize, ha='center', va='center',
                color='#1a1a2e', fontweight=weight, zorder=3)
        return box

    def draw_group_box(ax, x, y, w, h, title, color_key):
        box = FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.02,rounding_size=0.3",
                             facecolor=colors[color_key], edgecolor=colors[f'border_{color_key}'],
                             linewidth=3, alpha=0.25, zorder=1)
        ax.add_patch(box)
        ax.text(x + w/2, y + h - 0.25, title, fontsize=13, ha='center', va='center',
                color=colors[f'border_{color_key}'], fontweight='bold', zorder=3)

    def draw_arrow(ax, x1, y1, x2, y2, color='#888'):
        ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                    arrowprops=dict(arrowstyle='->', color=color, lw=1.8,
                                    connectionstyle='arc3,rad=0.03'))

    # ============ 用户层 ============
    draw_group_box(ax, 0.3, 14.5, 23.4, 2.0, '[用户层]', 'user')
    draw_box(ax, 1.0, 14.8, 3.5, 1.2, 'C端家长\n(拍照上传/看报告)', 'user', 10, True)
    draw_box(ax, 5.0, 14.8, 3.5, 1.2, 'B端机构\n(幼儿园/托管/培训)', 'user', 10, True)
    draw_box(ax, 9.0, 14.8, 3.5, 1.2, '私立小学/国际小学\n(班级看板)', 'user', 10, True)
    draw_box(ax, 13.0, 14.8, 3.5, 1.2, '运营人员\n(1人运营1000+用户)', 'user', 10, True)
    draw_box(ax, 17.0, 14.8, 3.5, 1.2, 'AI Agent 节点\n(01/02/04)', 'user', 10, True)
    draw_box(ax, 20.8, 14.8, 2.5, 1.2, '指挥官\n(决策/商务)', 'user', 10, True)

    # ============ 入口层 ============
    draw_group_box(ax, 0.3, 11.8, 23.4, 2.3, '[入口层]', 'entry')
    draw_box(ax, 1.0, 12.1, 3.5, 1.5, '微信公众号\n(扫码登录/模板消息)', 'entry', 10, True)
    draw_box(ax, 5.0, 12.1, 3.5, 1.5, '落地页\n( wingo.asia )', 'entry', 10, True)
    draw_box(ax, 9.0, 12.1, 3.5, 1.5, '微信小程序\n(Phase 4)', 'entry', 10, True)
    draw_box(ax, 13.0, 12.1, 3.5, 1.5, 'B端管理后台\n(独立前端)', 'entry', 10, True)
    draw_box(ax, 17.0, 12.1, 3.5, 1.5, 'OpenMAIC 演示页\n(自动演示)', 'entry', 10, True)
    draw_box(ax, 20.8, 12.1, 2.5, 1.5, 'API 接口\n(B端集成)', 'entry', 10, True)

    # ============ 核心业务层 XSC ============
    draw_group_box(ax, 0.3, 7.8, 14.5, 3.5, '[核心业务层 -- XSC (Next.js 15)]', 'core')
    draw_box(ax, 0.8, 10.0, 3.0, 1.0, 'C端前端\n落地页/分析页', 'core', 9, True)
    draw_box(ax, 0.8, 8.6, 3.0, 1.0, 'C端前端\n报告页/趋势页', 'core', 9, True)
    draw_box(ax, 4.3, 10.0, 3.0, 1.0, '/api/auth\n微信登录', 'core', 9)
    draw_box(ax, 4.3, 8.6, 3.0, 1.0, '/api/check\n拍照分析', 'core', 9)
    draw_box(ax, 4.3, 7.2, 3.0, 1.0, '/api/report\n报告查询', 'core', 9)
    draw_box(ax, 7.8, 10.0, 3.0, 1.0, '/api/trends\n学情趋势', 'core', 9)
    draw_box(ax, 7.8, 8.6, 3.0, 1.0, '/api/pay\n微信支付', 'core', 9)
    draw_box(ax, 7.8, 7.2, 3.0, 1.0, '/api/wechat\n模板推送', 'core', 9)
    draw_box(ax, 11.3, 10.0, 3.0, 1.0, '/api/b/inst\n机构管理', 'core', 9)
    draw_box(ax, 11.3, 8.6, 3.0, 1.0, '/api/b/batch\n批量分析', 'core', 9)
    draw_box(ax, 11.3, 7.2, 3.0, 1.0, '/api/b/dash\n班级看板', 'core', 9)

    # ============ AI 引擎层 ============
    draw_group_box(ax, 15.5, 7.8, 8.2, 3.5, '[AI 引擎层]', 'ai')
    draw_box(ax, 16.0, 10.0, 3.5, 1.0, 'OCR 引擎\nPaddleOCR + 百度OCR', 'ai', 9, True)
    draw_box(ax, 16.0, 8.6, 3.5, 1.0, 'AI 分析引擎\nMiniMax / DeepSeek', 'ai', 9, True)
    draw_box(ax, 16.0, 7.2, 3.5, 1.0, 'Prompt 引擎\n自适应年级/学科', 'ai', 9, True)
    draw_box(ax, 20.0, 10.0, 3.2, 1.0, '试卷索引\n题库匹配', 'ai', 9, True)
    draw_box(ax, 20.0, 8.6, 3.2, 1.0, '错题本生成\n薄弱点追踪', 'ai', 9, True)
    draw_box(ax, 20.0, 7.2, 3.2, 1.0, '空白卷还原\n笔迹擦除(年卡)', 'ai', 9, True)

    # ============ 数据层 ============
    draw_group_box(ax, 0.3, 5.0, 10.0, 2.3, '[数据层]', 'data')
    draw_box(ax, 0.8, 5.3, 2.8, 1.5, 'SQLite\n(开发/初期)', 'data', 9, True)
    draw_box(ax, 4.0, 5.3, 2.8, 1.5, 'PostgreSQL\n(生产/后期)', 'data', 9, True)
    draw_box(ax, 7.2, 5.3, 2.8, 1.5, 'Redis\n缓存/队列', 'data', 9, True)

    # ============ 自动化层 n8n ============
    draw_group_box(ax, 10.8, 5.0, 6.2, 2.3, '[自动化引擎 -- n8n]', 'auto')
    draw_box(ax, 11.3, 5.3, 2.5, 1.5, '注册欢迎\n报告推送', 'auto', 9)
    draw_box(ax, 14.3, 5.3, 2.2, 1.5, '付费转化\n续费提醒', 'auto', 9)

    # ============ 客服/咨询层 ============
    draw_group_box(ax, 17.5, 5.0, 6.2, 2.3, '[客服与咨询]', 'service')
    draw_box(ax, 18.0, 5.3, 2.5, 1.5, 'Dify 智能客服\n80% FAQ自动', 'service', 9, True)
    draw_box(ax, 21.0, 5.3, 2.2, 1.5, 'OpenMAIC\n深度咨询', 'service', 9, True)

    # ============ 基础设施层 ============
    draw_group_box(ax, 0.3, 2.0, 23.4, 2.5, '[基础设施层]', 'infra')
    draw_box(ax, 0.8, 3.2, 3.5, 1.0, '阿里云 200\n2核4G / 大陆生产', 'infra', 9)
    draw_box(ax, 4.8, 3.2, 3.5, 1.0, '阿里云 095\n2核2G / 备案实例', 'infra', 9)
    draw_box(ax, 8.8, 3.2, 3.5, 1.0, '香港 240\n高配 / 海外生产', 'infra', 9)
    draw_box(ax, 12.8, 3.2, 3.5, 1.0, 'Mac 55\nTailscale / 测试站', 'infra', 9)
    draw_box(ax, 0.8, 2.0, 3.5, 0.9, '微信生态\n登录/支付/模板消息', 'infra', 9)
    draw_box(ax, 4.8, 2.0, 3.5, 0.9, 'Tailscale\n内网穿透', 'infra', 9)
    draw_box(ax, 8.8, 2.0, 3.5, 0.9, 'systemd\n服务管理', 'infra', 9)
    draw_box(ax, 12.8, 2.0, 3.5, 0.9, 'Docker\nn8n + Dify', 'infra', 9)
    draw_box(ax, 16.8, 2.0, 3.0, 0.9, 'Nginx\n反向代理', 'infra', 9)
    draw_box(ax, 20.3, 2.0, 3.0, 0.9, 'SSL 证书\nzjcz.top', 'infra', 9)

    # ============ 连接箭头 ============
    for x in [2.25, 6.75, 10.75, 14.75, 18.75, 22.05]:
        draw_arrow(ax, x, 14.5, x, 13.6, '#1976d2')
    draw_arrow(ax, 2.75, 12.1, 2.75, 11.5, '#f57c00')
    draw_arrow(ax, 6.75, 12.1, 6.75, 11.5, '#f57c00')
    draw_arrow(ax, 14.75, 12.1, 10.0, 11.5, '#f57c00')
    draw_arrow(ax, 10.5, 9.5, 15.5, 9.5, '#c2185b')
    draw_arrow(ax, 10.5, 8.5, 15.5, 8.5, '#c2185b')
    draw_arrow(ax, 5.0, 7.8, 5.0, 6.8, '#7b1fa2')
    draw_arrow(ax, 9.0, 7.8, 11.5, 7.3, '#0097a7')
    draw_arrow(ax, 11.5, 7.3, 9.0, 7.8, '#0097a7')
    draw_arrow(ax, 14.0, 7.3, 14.0, 6.5, '#0097a7')
    draw_arrow(ax, 14.0, 6.5, 2.75, 6.5, '#0097a7')
    draw_arrow(ax, 2.75, 6.5, 2.75, 5.3, '#0097a7')
    draw_arrow(ax, 12.5, 7.8, 18.5, 7.3, '#fbc02d')
    draw_arrow(ax, 12.5, 7.8, 21.5, 7.3, '#fbc02d')
    draw_arrow(ax, 5.0, 5.0, 5.0, 4.5, '#546e7a')

    # 图例
    legend_items = [
        ('用户层', colors['user'], colors['border_user']),
        ('入口层', colors['entry'], colors['border_entry']),
        ('核心层', colors['core'], colors['border_core']),
        ('AI层', colors['ai'], colors['border_ai']),
        ('数据层', colors['data'], colors['border_data']),
        ('自动化', colors['auto'], colors['border_auto']),
        ('客服咨询', colors['service'], colors['border_service']),
        ('基础设施', colors['infra'], colors['border_infra']),
    ]
    for i, (label, fc, ec) in enumerate(legend_items):
        lx = 16.0 + (i % 4) * 2.0
        ly = 0.6 - (i // 4) * 0.5
        rect = plt.Rectangle((lx, ly), 0.4, 0.3, facecolor=fc, edgecolor=ec, linewidth=2)
        ax.add_patch(rect)
        ax.text(lx + 0.5, ly + 0.15, label, fontsize=9, va='center')

    plt.tight_layout()
    plt.savefig('D:/02工作空间/docs/architecture/wingo-architecture-v6.png',
                dpi=200, bbox_inches='tight', facecolor='#f8f9fa', edgecolor='none')
    plt.savefig('D:/02工作空间/docs/architecture/wingo-architecture-v6.svg',
                format='svg', bbox_inches='tight', facecolor='#f8f9fa', edgecolor='none')
    print('PNG + SVG saved successfully')

if __name__ == '__main__':
    draw_wingo_architecture()
