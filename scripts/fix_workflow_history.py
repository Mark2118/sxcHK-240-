import sqlite3, json
from datetime import datetime

db_path = r'D:\02工作空间\xsc-enterprise\data\n8n.db'
conn = sqlite3.connect(db_path)
cur = conn.cursor()

now = datetime.now().isoformat()

# Get workflows that need history records (activeVersionId != versionId)
cur.execute("""
    SELECT id, name, versionId, activeVersionId, nodes, connections 
    FROM workflow_entity 
    WHERE name LIKE 'XSC %' AND (activeVersionId IS NULL OR activeVersionId != versionId)
""")
workflows = cur.fetchall()

print(f"Found {len(workflows)} workflows to fix:")
for wf in workflows:
    print(f"  - {wf[1]}: versionId={wf[2]}, activeVersionId={wf[3]}")

for wf_id, name, version_id, active_version_id, nodes, connections in workflows:
    # Insert workflow_history
    cur.execute("""
        INSERT INTO workflow_history (versionId, workflowId, authors, createdAt, updatedAt, nodes, connections, name, autosaved, description)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
    """, (version_id, wf_id, 'admin@wingo.edu', now, now, nodes, connections, name, 'Imported from PRD-v6'))
    print(f"  Added workflow_history for {name}")
    
    # Update activeVersionId to match versionId
    cur.execute("UPDATE workflow_entity SET activeVersionId = ? WHERE id = ?", (version_id, wf_id))
    print(f"  Updated activeVersionId for {name}")

conn.commit()
conn.close()
print("\nDone!")
