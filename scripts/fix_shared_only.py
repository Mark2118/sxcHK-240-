import sqlite3
from datetime import datetime

db_path = r'D:\02工作空间\xsc-enterprise\data\n8n.db'
conn = sqlite3.connect(db_path)
cur = conn.cursor()

project_id = 'CfiJqZ2gHgTDvrFK'
now = datetime.now().isoformat()

# Get new workflows that don't have shared_workflow entries
cur.execute("""
    SELECT w.id, w.name, w.versionId 
    FROM workflow_entity w 
    LEFT JOIN shared_workflow s ON w.id = s.workflowId 
    WHERE s.workflowId IS NULL AND w.name LIKE 'XSC %'
""")
new_workflows = cur.fetchall()

print(f"Found {len(new_workflows)} workflows missing shared_workflow:")
for wf in new_workflows:
    print(f"  - {wf[1]} ({wf[0]})")

for wf_id, name, version_id in new_workflows:
    cur.execute("""
        INSERT INTO shared_workflow (workflowId, projectId, role)
        VALUES (?, ?, 'workflow:owner')
    """, (wf_id, project_id))
    print(f"  Added shared_workflow for {name}")
    
    # Also add workflow_published_version (might help)
    try:
        cur.execute("""
            INSERT INTO workflow_published_version (workflowId, publishedVersionId, createdAt, updatedAt)
            VALUES (?, ?, ?, ?)
        """, (wf_id, version_id, now, now))
        print(f"  Added workflow_published_version for {name}")
    except Exception as e:
        print(f"  workflow_published_version skipped for {name}: {e}")

conn.commit()
conn.close()
print("\nDone!")
