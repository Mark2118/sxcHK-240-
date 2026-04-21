from PIL import Image, ImageDraw, ImageFont
import base64, io, json, urllib.request, time

# 生成一张足够大的测试图（最短边>=512px）
img = Image.new('RGB', (1200, 1600), color='white')
draw = ImageDraw.Draw(img)
try:
    font = ImageFont.truetype('simhei.ttf', 36)
    font_small = ImageFont.truetype('simhei.ttf', 28)
except:
    try:
        font = ImageFont.truetype('msyh.ttc', 36)
        font_small = ImageFont.truetype('msyh.ttc', 28)
    except:
        font = ImageFont.load_default()
        font_small = font

# 印刷体题目
y = 40
draw.text((60, y), '数学作业', fill='black', font=font)
y += 80
draw.text((60, y), '1. 计算: 125 x 8 = ?', fill='black', font=font)
y += 60
draw.text((60, y), '   学生答案: 1000', fill='gray', font=font_small)
y += 100
draw.text((60, y), '2. 解方程: 2x + 4 = 10', fill='black', font=font)
y += 60
draw.text((60, y), '   学生答案: x = 3', fill='gray', font=font_small)
y += 100
draw.text((60, y), '3. 长方形长6cm,宽4cm,面积=?', fill='black', font=font)
y += 60
draw.text((60, y), '   学生答案: 24cm2', fill='gray', font=font_small)
y += 100
draw.text((60, y), '4. 3.14 x 2 x 2 = ?', fill='black', font=font)
y += 60
draw.text((60, y), '   学生答案: 12.56', fill='gray', font=font_small)
y += 100
draw.text((60, y), '5. 1/2 + 1/3 = ?', fill='black', font=font)
y += 60
draw.text((60, y), '   学生答案: 5/6', fill='gray', font=font_small)

buf = io.BytesIO()
img.save(buf, format='PNG')
img_b64 = base64.b64encode(buf.getvalue()).decode('utf-8')

print(f'图片尺寸: {img.size}, base64长度: {len(img_b64)}')

# 测试 /api/correct
body = json.dumps({'imageBase64': img_b64, 'subject': 'math', 'generateExerciseSet': True}).encode('utf-8')
req = urllib.request.Request('http://localhost:3999/xsc/api/correct', data=body, headers={'Content-Type': 'application/json'}, method='POST')

start = time.time()
try:
    with urllib.request.urlopen(req, timeout=120) as resp:
        data = json.loads(resp.read().decode('utf-8'))
    elapsed = time.time() - start
    
    with open('test-correct-full.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f'耗时: {elapsed:.1f}秒')
    print(f'success: {data["success"]}')
    if data.get('error'):
        print(f'error: {data["error"]}')
    else:
        print(f'reportId: {data.get("reportId")}')
        print(f'score: {data.get("report", {}).get("score")}')
        print(f'correct: {data.get("report", {}).get("correct")}/{data.get("report", {}).get("totalQuestions")}')
        cr = data.get('correctResult')
        if cr:
            print(f'paperSubject: {cr.get("subject")}')
            print(f'questions: {cr.get("stat", {}).get("all")}')
            print(f'corrected: {cr.get("stat", {}).get("corrected")}')
            for q in cr.get('questions', [])[:3]:
                status = '对' if q['correctResult'] == 1 else '错' if q['correctResult'] == 2 else '未批'
                print(f'  Q{q["sequence"]+1}: {q["typeName"]} -> {status}')
        ex = data.get('exercises')
        if ex:
            print(f'exercises: {len(ex.get("exercises", []))}道')
except Exception as e:
    print(f'请求失败: {e}')
