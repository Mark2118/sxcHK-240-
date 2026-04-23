import sqlite3, json

FEISHU_URL = "https://open.feishu.cn/open-apis/bot/v2/hook/7c7bb761-fac1-49f3-a52f-4e74d77c569d"
ENV_PLACEHOLDER = "{{$env.FEISHU_WEBHOOK_KEY}}"

db_path = r'D:\02工作空间\xsc-enterprise\data\n8n.db'
conn = sqlite3.connect(db_path)
cur = conn.cursor()

cur.execute("SELECT id, name, nodes FROM workflow_entity WHERE name LIKE 'XSC %';")
rows = cur.fetchall()

for row in rows:
    wf_id, name, nodes_raw = row
    nodes = json.loads(nodes_raw)
    modified = False
    
    for node in nodes:
        if node.get('type') == 'n8n-nodes-base.httpRequest':
            url = node.get('parameters', {}).get('url', '')
            if ENV_PLACEHOLDER in url:
                node['parameters']['url'] = url.replace(ENV_PLACEHOLDER, FEISHU_URL)
                modified = True
                print(f"  Fixed {name} / {node['name']}")
    
    if modified:
        cur.execute("UPDATE workflow_entity SET nodes = ? WHERE id = ?", 
                    (json.dumps(nodes, ensure_ascii=False), wf_id))
        print(f"Updated: {name}")

conn.commit()
conn.close()
print("Done.")
