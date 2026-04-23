import sqlite3
conn = sqlite3.connect(r'D:\02工作空间\xsc-enterprise\data\n8n.db')
cur = conn.cursor()
cur.execute("SELECT workflowId, event FROM workflow_publish_history;")
rows = cur.fetchall()
print(f"Total rows: {len(rows)}")
for r in rows:
    print(r)
conn.close()
