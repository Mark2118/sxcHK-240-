import sqlite3
conn = sqlite3.connect(r'D:\02工作空间\xsc-enterprise\data\n8n.db')
cur = conn.cursor()
cur.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;")
print("=== Tables ===")
for t in cur.fetchall():
    print(t[0])

# Check webhook_entity
try:
    cur.execute("PRAGMA table_info(webhook_entity);")
    print("\n=== webhook_entity schema ===")
    for c in cur.fetchall():
        print(c)
    cur.execute("SELECT * FROM webhook_entity;")
    print("\n=== webhook_entity data ===")
    for r in cur.fetchall():
        print(r)
except Exception as e:
    print(f"webhook_entity error: {e}")

conn.close()
