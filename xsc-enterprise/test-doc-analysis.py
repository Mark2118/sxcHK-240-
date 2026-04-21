from PIL import Image, ImageDraw, ImageFont
import base64, io, json, urllib.request

# 生成混排测试图：印刷体题目 + 手写体答案
img = Image.new('RGB', (500, 200), color='white')
draw = ImageDraw.Draw(img)
try:
    font = ImageFont.truetype('simhei.ttf', 32)
except:
    try:
        font = ImageFont.truetype('msyh.ttc', 32)
    except:
        font = ImageFont.load_default()

draw.text((20, 20), '1. 计算: 125 x 32 x 25 = ?', fill='black', font=font)
draw.text((20, 80), '学生答案:', fill='gray', font=font)
draw.text((180, 80), '100000', fill='black', font=font)
draw.text((20, 140), '2. 解方程: 3x + 5 = 20', fill='black', font=font)

buf = io.BytesIO()
img.save(buf, format='PNG')
img_b64 = base64.b64encode(buf.getvalue()).decode('utf-8')

body = json.dumps({'imageBase64': img_b64}).encode('utf-8')
req = urllib.request.Request('http://localhost:3999/xsc/api/ocr', data=body, headers={'Content-Type': 'application/json'}, method='POST')
with urllib.request.urlopen(req, timeout=30) as resp:
    data = json.loads(resp.read().decode('utf-8'))

with open('test-doc-analysis.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print('success:', data.get('success'))
print('lines count:', len(data.get('lines', [])))
for l in data.get('lines', []):
    t = l.get('type', '')
    txt = l.get('text', '')
    print(f'  [{t}] {txt}')
print('formulas:', data.get('formulas', []))
