import sqlite3, json
conn = sqlite3.connect(r'D:\02工作空间\xsc-enterprise\data\n8n.db')
cur = conn.cursor()

# Check workflow_entity activeVersionId
cur.execute("SELECT id, name, active, versionId, activeVersionId FROM workflow_entity WHERE name LIKE 'XSC %' ORDER BY name;")
print("=== workflow_entity ===")
for r in cur.fetchall():
    print(r)

# Check workflow_history
cur.execute("PRAGMA table_info(workflow_history);")
print("\n=== workflow_history schema ===")
for c in cur.fetchall():
    print(c)

cur.execute("SELECT versionId, workflowId, authorsWorkflowId FROM workflow_history;")
print("\n=== workflow_history ===")
for r in cur.fetchall():
    print(r)

# Check if activeVersionId matches versionId for new workflows
cur.execute("SELECT id, name, versionId, activeVersionId FROM workflow_entity WHERE activeVersionId IS NULL OR activeVersionId = '';")
print("\n=== workflows with NULL activeVersionId ===")
for r in cur.fetchall():
    print(r)

conn.close()
