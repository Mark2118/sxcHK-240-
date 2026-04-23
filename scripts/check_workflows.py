import sqlite3, json
conn = sqlite3.connect(r'D:\02工作空间\xsc-enterprise\data\n8n.db')
cur = conn.cursor()

# Check shared_workflow
cur.execute("SELECT workflowId, projectId, role FROM shared_workflow;")
print("=== shared_workflow ===")
for r in cur.fetchall():
    print(r)

# Check workflow_published_version
cur.execute("SELECT workflowId, versionId FROM workflow_published_version;")
print("\n=== workflow_published_version ===")
for r in cur.fetchall():
    print(r)

# Check workflow_publish_history  
cur.execute("SELECT workflowId, versionId FROM workflow_publish_history;")
print("\n=== workflow_publish_history ===")
for r in cur.fetchall():
    print(r)

# Check new workflows details
cur.execute("SELECT id, name, active, versionId, activeVersionId FROM workflow_entity WHERE name LIKE 'XSC %' ORDER BY name;")
print("\n=== workflow_entity details ===")
for r in cur.fetchall():
    print(r)

conn.close()
