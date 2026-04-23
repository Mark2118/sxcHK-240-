import sqlite3, json
conn = sqlite3.connect(r'D:\02工作空间\xsc-enterprise\data\n8n.db')
cur = conn.cursor()

# Check project table
cur.execute("SELECT id, name FROM project;")
print("=== project ===")
for r in cur.fetchall():
    print(r)

# Check workflow_publish_history schema
cur.execute("PRAGMA table_info(workflow_publish_history);")
print("\n=== workflow_publish_history schema ===")
for c in cur.fetchall():
    print(c)

# Check workflow_published_version schema
cur.execute("PRAGMA table_info(workflow_published_version);")
print("\n=== workflow_published_version schema ===")
for c in cur.fetchall():
    print(c)

# Check user table
cur.execute("SELECT id, email FROM user;")
print("\n=== user ===")
for r in cur.fetchall():
    print(r)

conn.close()
