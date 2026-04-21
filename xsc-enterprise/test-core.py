# -*- coding: utf-8 -*-
"""
WinGo 学情洞察 - 核心功能验证脚本
绕过 npm，直接用 Python 验证 AI 分析 + 报告生成
"""
import os, json, requests, re

os.chdir(r'F:\taizi_test_env\xsc-enterprise')

# 加载环境变量
with open('.env.local', 'r', encoding='utf-8') as f:
    for line in f:
        if '=' in line and not line.startswith('#'):
            k, v = line.strip().split('=', 1)
            os.environ.setdefault(k, v)

api_key = os.environ['AI_API_KEY']
base_url = os.environ['AI_BASE_URL']
model = os.environ['AI_MODEL']

text = """1. 计算：125 x 32 x 25 = ?    学生答案：100000
2. 解方程：3x + 5 = 20    学生答案：x = 5
3. 长方形长8cm宽5cm，求面积。    学生答案：40cm²
4. 甲乙相距360km，A车60km/h，B车40km/h，相向而行，几小时相遇？    学生答案：3.6小时
5. 正方形边长4cm，内有直径4cm的圆，求阴影面积(π=3.14)。    学生答案：3.44cm²"""

prompt = f"""你是一位教育数据分析模型，基于小升初数学知识体系，对以下学生作业进行客观分析。

请输出专业级的学情分析报告，帮助家长了解孩子的知识掌握情况。

【小升初数学知识体系 · 五大模块】
1. 计算模块（25%-30%）：四则混合运算、简便运算、解方程、定义新运算
2. 几何模块（18%-25%）：平面/立体图形、阴影面积、图形变换
3. 应用题模块（30%-40%）：行程、工程、浓度、利润、比和比例、经典思维题
4. 数论模块（5%-12%）：因数倍数、质数合数、GCD/LCM、整除
5. 统计与逻辑（5%-10%）：统计图、平均数、概率、逻辑推理

【输出格式 · 严格 JSON】
{{
  "score": 75,
  "totalQuestions": 5,
  "correct": 4,
  "wrong": 1,
  "questions": [
    {{
      "no": 1,
      "content": "题目原文",
      "studentAnswer": "学生答案",
      "correctAnswer": "正确答案",
      "isCorrect": true,
      "knowledgePoint": "精确知识点",
      "examModule": "计算模块",
      "difficulty": "基础",
      "processScore": "完整",
      "juniorLink": "初中衔接内容",
      "analysis": "客观分析，包含知识点说明和常见误区"
    }}
  ],
  "moduleScores": [
    {{"module": "计算模块", "scoreRate": 100, "weight": "25%", "status": "扎实"}}
  ],
  "weakPoints": ["提升方向1"],
  "suggestions": ["家庭学习建议1"],
  "recommendedExercises": [
    {{"module": "计算模块", "type": "简便运算", "desc": "提取公因数练习", "difficulty": "基础"}}
  ],
  "examStrategy": "基于本次分析的阶段性学习建议"
}}

【分析原则】
1. 必须逐题分析，不遗漏任何题目
2. 知识点标注要精确到知识体系子概念
3. 过程分析：有步骤缺失需指出
4. 初中衔接：说明该知识点与初中内容的关联
5. 只返回 JSON，不要任何解释文字
6. 确保 JSON 完整、格式正确

作业内容：
{text}

要求：
1. 必须严格按上述 JSON 格式返回
2. 只返回 JSON，不要任何解释
3. 确保 JSON 完整、格式正确
4. 如果题目很多，优先分析前10题
"""

print("=" * 60)
print("WinGo 学情洞察 - 核心功能验证")
print("=" * 60)
print("\n[1/3] 正在调用 MiniMax AI 进行学情分析...")

try:
    resp = requests.post(
        f'{base_url}/chat/completions',
        headers={'Authorization': f'Bearer {api_key}', 'Content-Type': 'application/json'},
        json={'model': model, 'messages': [{'role': 'user', 'content': prompt}], 'temperature': 0.2, 'max_tokens': 4096},
        timeout=120
    )
    resp.raise_for_status()
    raw = resp.json()['choices'][0]['message']['content']
    print(f"[OK] AI 返回成功，长度: {len(raw)} 字符")

    # 解析 JSON
    def extract_json(s):
        try: return json.loads(s)
        except: pass
        m = re.search(r'```(?:json)?\s*(\{[\s\S]*?\})\s*```', s)
        if m:
            try: return json.loads(m.group(1))
            except: pass
        start = s.find('{')
        end = s.rfind('}')
        if start != -1 and end != -1:
            try: return json.loads(s[start:end+1])
            except: pass
        return None

    report = extract_json(raw)
    if not report:
        print("[FAIL] JSON 解析失败")
        print(raw[:500])
        exit(1)

    print("[OK] JSON 解析成功")
    print(f"\n[2/3] 学情分析结果:")
    print(f"  掌握度指数: {report.get('score', 0)}")
    print(f"  分析题数: {report.get('totalQuestions', 0)}")
    print(f"  已掌握: {report.get('correct', 0)}")
    print(f"  待巩固: {report.get('wrong', 0)}")
    print(f"  五大模块: {len(report.get('moduleScores', []))} 个")
    print(f"  提升方向: {', '.join(report.get('weakPoints', [])[:3])}")

    # 保存报告
    with open(r'F:\taizi_test_env\xsc-enterprise\test-report.json', 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
    print("\n[3/3] 报告已保存: test-report.json")
    print("\n" + "=" * 60)
    print("[SUCCESS] WinGo 学情洞察核心逻辑验证通过!")
    print("=" * 60)

except Exception as e:
    print(f"[FAIL] {e}")
    import traceback
    traceback.print_exc()
