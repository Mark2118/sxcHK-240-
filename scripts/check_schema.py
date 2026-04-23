import sqlite3
conn = sqlite3.connect(r'D:\02工作空间\xsc-enterprise\data\n8n.db')
cur = conn.cursor()
cur.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='workflow_publish_history';")
for r in cur.fetchall():
    print(r[0])
conn.close()
