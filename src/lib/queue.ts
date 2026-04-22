/**
 * 内存任务队列
 * 提交后后台执行 AI 分析，家长无需等待
 */

import { CheckReport, analyzeHomework } from './ai'
import { renderReportHTML } from './report'
import { generateExercises } from './exercises'

export interface Job {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  subject: string
  text: string
  createdAt: number
  result?: {
    report: CheckReport
    html: string
    exercises?: any
  }
  error?: string
}

const jobs = new Map<string, Job>()

function generateJobId(): string {
  return 'job_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6)
}

export function submitJob(text: string, subject: string): string {
  const id = generateJobId()
  const job: Job = {
    id,
    status: 'pending',
    subject,
    text,
    createdAt: Date.now(),
  }
  jobs.set(id, job)

  // 后台执行
  processJob(id)

  return id
}

async function processJob(id: string) {
  const job = jobs.get(id)
  if (!job) return

  job.status = 'processing'

  try {
    const report = await analyzeHomework(job.text, job.subject)
    const html = renderReportHTML(report)

    let exercises = null
    if (report.wrong > 0) {
      try {
        exercises = await generateExercises(report.weakPoints, report.moduleScores, job.subject)
      } catch (e) {
      }
    }

    job.status = 'completed'
    job.result = { report, html, exercises }
  } catch (error: any) {
    job.status = 'failed'
    job.error = error.message || '分析失败'
  }
}

export function getJob(id: string): Job | null {
  return jobs.get(id) || null
}

// 每10分钟清理一次已完成/失败的任务，防止内存泄漏
setInterval(() => {
  const now = Date.now()
  for (const [id, job] of jobs.entries()) {
    if ((job.status === 'completed' || job.status === 'failed') && now - job.createdAt > 30 * 60 * 1000) {
      jobs.delete(id)
    }
  }
}, 10 * 60 * 1000)
