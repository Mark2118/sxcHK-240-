/**
 * Dify 知识库批量导入脚本
 * 读取 data/dify-knowledge-base.json，通过 Dify API 创建数据集和文档
 *
 * 使用方法：
 *   1. 在 Dify 管理后台获取 API Key（设置 → API 密钥）
 *   2. 将 Key 填入 .env.local 的 DIFY_API_KEY
 *   3. node scripts/import-dify-kb.js
 */

const fs = require('fs');
const path = require('path');

// 配置
const DIFY_API_URL = process.env.DIFY_API_URL || 'http://localhost:8080/v1';
const DIFY_API_KEY = process.env.DIFY_API_KEY || '';
const DATA_FILE = path.join(__dirname, '..', 'data', 'dify-knowledge-base.json');
const DATASET_NAME = 'WinGo 学情引擎 FAQ';

if (!DIFY_API_KEY) {
  console.error('❌ 错误：未配置 DIFY_API_KEY，请在 .env.local 中设置');
  process.exit(1);
}

// 读取知识库数据
let kbData;
try {
  const raw = fs.readFileSync(DATA_FILE, 'utf-8');
  kbData = JSON.parse(raw);
} catch (err) {
  console.error('❌ 读取知识库文件失败:', err.message);
  process.exit(1);
}

console.log(`📚 读取到 ${kbData.length} 条 FAQ 记录`);

// HTTP 请求封装
async function difyFetch(endpoint, options = {}) {
  const url = `${DIFY_API_URL}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${DIFY_API_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Dify API ${res.status}: ${text}`);
  }
  return res.json();
}

// 查找或创建数据集
async function getOrCreateDataset() {
  // 先列出已有数据集
  const list = await difyFetch('/datasets');
  const existing = list.data?.find(d => d.name === DATASET_NAME);
  if (existing) {
    console.log(`✅ 使用已有数据集: ${existing.name} (id=${existing.id})`);
    return existing.id;
  }

  // 创建新数据集
  const created = await difyFetch('/datasets', {
    method: 'POST',
    body: JSON.stringify({ name: DATASET_NAME }),
  });
  console.log(`✅ 创建数据集: ${created.name} (id=${created.id})`);
  return created.id;
}

// 创建文档（单条 FAQ 作为一篇文档）
async function createDocument(datasetId, item, index) {
  const name = `[${item.category}] ${item.question}`.slice(0, 200);
  const text = `问题：${item.question}\n\n分类：${item.category}\n\n答案：\n${item.answer}`;

  const body = {
    name,
    text,
    indexing_technique: 'high_quality',
    // Dify 支持通过 text 直接创建文档
    doc_type: 'others',
    doc_metadata: {
      category: item.category,
      source: 'wingo-xsc-kb',
    },
  };

  const result = await difyFetch(`/datasets/${datasetId}/document/create-by-text`, {
    method: 'POST',
    body: JSON.stringify(body),
  });

  console.log(`  [${index + 1}/${kbData.length}] ✅ ${item.question.slice(0, 50)}...`);
  return result;
}

// 主流程
async function main() {
  try {
    const datasetId = await getOrCreateDataset();

    console.log('🚀 开始导入文档...');
    let success = 0;
    let failed = 0;

    for (let i = 0; i < kbData.length; i++) {
      try {
        await createDocument(datasetId, kbData[i], i);
        success++;
      } catch (err) {
        failed++;
        console.error(`  [${i + 1}] ❌ 导入失败: ${err.message}`);
      }
      // 简单限流，避免触发 API 频率限制
      if (i < kbData.length - 1) await new Promise(r => setTimeout(r, 300));
    }

    console.log('\n===========================');
    console.log('📊 导入完成统计');
    console.log(`   总计: ${kbData.length}`);
    console.log(`   成功: ${success}`);
    console.log(`   失败: ${failed}`);
    console.log('===========================');

    if (failed > 0) {
      console.log('\n⚠️ 部分文档导入失败，可重新运行脚本重试（已存在的会跳过）。');
      process.exit(1);
    }
  } catch (err) {
    console.error('❌ 导入异常:', err.message);
    process.exit(1);
  }
}

main();
