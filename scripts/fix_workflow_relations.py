import sqlite3
from datetime import datetime

db_path = r'D:\02工作空间\xsc-enterprise\data\n8n.db'
conn = sqlite3.connect(db_path)
cur = conn.cursor()

project_id = 'CfiJqZ2gHgTDvrFK'
user_id = '145ab172-f11a-4759-9671-f9d47fdc2ae9'
now = datetime.now().isoformat()

# Get new workflows that don't have shared_workflow entries
cur.execute("""
    SELECT w.id, w.name, w.versionId 
    FROM workflow_entity w 
    LEFT JOIN shared_workflow s ON w.id = s.workflowId 
    WHERE s.workflowId IS NULL AND w.name LIKE 'XSC %'
""")
new_workflows = cur.fetchall()

print(f"Found {len(new_workflows)} workflows missing relations:")
for wf in new_workflows:
    print(f"  - {wf[1]} ({wf[0]}), versionId={wf[2]}")

for wf_id, name, version_id in new_workflows:
    # Add shared_workflow
    cur.execute("""
        INSERT INTO shared_workflow (workflowId, projectId, role)
        VALUES (?, ?, 'workflow:owner')
    """, (wf_id, project_id))
    print(f"  Added shared_workflow for {name}")
    
    # Add workflow_published_version
    cur.execute("""
        INSERT INTO workflow_published_version (workflowId, publishedVersionId, createdAt, updatedAt)
        VALUES (?, ?, ?, ?)
    """, (wf_id, version_id, now, now))
    print(f"  Added workflow_published_version for {name}")
    
    # Add workflow_publish_history
    cur.execute("""
        INSERT INTO workflow_publish_history (workflowId, versionId, event, userId, createdAt)
        VALUES (?, ?, 'published', ?, ?)
    """, (wf_id, version_id, user_id, now))
    print(f"  Added workflow_publish_history for {name}")

conn.commit()
conn.close()
print("\nDone! New workflows now have all required relations.")
