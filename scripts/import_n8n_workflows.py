import sqlite3, json, uuid, sys
from datetime import datetime

def generate_id():
    """Generate n8n-style ID"""
    chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    import random
    return ''.join(random.choices(chars, k=16))

def import_workflow(db_path, json_path):
    with open(json_path, 'r', encoding='utf-8') as f:
        workflow = json.load(f)
    
    wf_id = generate_id()
    name = workflow['name']
    nodes = json.dumps(workflow['nodes'], ensure_ascii=False)
    connections = json.dumps(workflow['connections'], ensure_ascii=False)
    settings = json.dumps(workflow.get('settings', {}), ensure_ascii=False)
    static_data = json.dumps(workflow.get('staticData', None), ensure_ascii=False)
    
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    
    # Check if workflow already exists
    cur.execute("SELECT id FROM workflow_entity WHERE name = ?", (name,))
    existing = cur.fetchone()
    if existing:
        print(f"Workflow '{name}' already exists with ID {existing[0]}, updating...")
        cur.execute("""
            UPDATE workflow_entity 
            SET nodes = ?, connections = ?, settings = ?, staticData = ?, active = 1, updatedAt = ?
            WHERE id = ?
        """, (nodes, connections, settings, static_data, datetime.now().isoformat(), existing[0]))
        print(f"  Updated and activated: {existing[0]}")
    else:
        now = datetime.now().isoformat()
        cur.execute("""
            INSERT INTO workflow_entity 
            (id, name, active, nodes, connections, settings, staticData, versionId, triggerCount, createdAt, updatedAt, isArchived, versionCounter, description, activeVersionId)
            VALUES (?, ?, 1, ?, ?, ?, ?, ?, 0, ?, ?, 0, 1, ?, ?)
        """, (wf_id, name, nodes, connections, settings, static_data, generate_id(), now, now, 'Imported from PRD-v6', generate_id()))
        print(f"Imported and activated: {name} (ID: {wf_id})")
    
    conn.commit()
    conn.close()

def list_workflows(db_path):
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute("SELECT id, name, active FROM workflow_entity ORDER BY name")
    rows = cur.fetchall()
    conn.close()
    return rows

if __name__ == '__main__':
    db_path = r'D:\02工作空间\xsc-enterprise\data\n8n.db'
    workflows = [
        r'D:\02工作空间\xsc-enterprise\workflows\n8n-user-register-welcome.json',
        r'D:\02工作空间\xsc-enterprise\workflows\n8n-report-push.json',
        r'D:\02工作空间\xsc-enterprise\workflows\n8n-conversion.json',
    ]
    
    print("=== Before Import ===")
    for r in list_workflows(db_path):
        print(f"  {'[ACTIVE]' if r[2] else '[inactive]'} {r[1]} ({r[0]})")
    
    print("\n=== Importing ===")
    for wf in workflows:
        import_workflow(db_path, wf)
    
    print("\n=== After Import ===")
    for r in list_workflows(db_path):
        print(f"  {'[ACTIVE]' if r[2] else '[inactive]'} {r[1]} ({r[0]})")
