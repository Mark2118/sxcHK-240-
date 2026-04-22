import { NextRequest, NextResponse } from 'next/server'
import { ocrRecognizeAdvanced } from '@/lib/ocr'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { imageBase64 } = body

    if (!imageBase64) {
      return NextResponse.json({ error: '缺少图片数据' }, { status: 400 })
    }

    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '')
    const result = await ocrRecognizeAdvanced(base64Data)

    return NextResponse.json({
      success: true,
      text: result.text,
      lines: result.lines,
      formulas: result.formulas,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || '识别失败' }, { status: 500 })
  }
}
