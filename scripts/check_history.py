import sqlite3
conn = sqlite3.connect(r'D:\02工作空间\xsc-enterprise\data\n8n.db')
cur = conn.cursor()

cur.execute("SELECT versionId, workflowId, name FROM workflow_history;")
print("=== workflow_history ===")
for r in cur.fetchall():
    print(r)

conn.close()
