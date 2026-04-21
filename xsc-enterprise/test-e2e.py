import json
import urllib.request

body = json.dumps({
    "text": """1. 计算：125 x 32 x 25 = ?
学生答案：100000

2. 解方程：3x + 5 = 20
学生答案：x = 5

3. 长方形长8cm，宽5cm，求面积。
学生答案：40cm²

4. 甲乙相距360km，A车60km/h，B车40km/h，相向而行，几小时相遇？
学生答案：3.6小时

5. 正方形边长4cm，内有直径4cm的圆，求阴影面积。(π=3.14)
学生答案：3.44cm²""",
    "subject": "math",
    "generateExerciseSet": True
}, ensure_ascii=False).encode("utf-8")

req = urllib.request.Request(
    "http://localhost:3999/xsc/api/check",
    data=body,
    headers={"Content-Type": "application/json"},
    method="POST"
)

with urllib.request.urlopen(req, timeout=120) as resp:
    data = json.loads(resp.read().decode("utf-8"))

with open("test-result.json", "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"reportId: {data['reportId']}")
print(f"score: {data['report']['score']}")
print(f"correct: {data['report']['correct']}/{data['report']['totalQuestions']}")
print(f"wrong: {data['report']['wrong']}")
print(f"weakPoints: {data['report']['weakPoints']}")
print(f"exercises.title: {data['exercises']['title']}")
print(f"exercises.count: {len(data['exercises']['exercises'])}")
if data["exercises"]["exercises"]:
    ex = data["exercises"]["exercises"][0]
    print(f"ex[0].type: {ex['type']}")
    print(f"ex[0].difficulty: {ex['difficulty']}")
    print(f"ex[0].content: {ex['content'][:80]}...")
    print(f"ex[0].answer: {ex['answer'][:60]}...")
    print(f"ex[0].knowledgePoint: {ex['knowledgePoint']}")
