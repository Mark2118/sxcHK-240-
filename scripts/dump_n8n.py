import sqlite3, json
conn = sqlite3.connect(r'D:\02工作空间\xsc-enterprise\data\n8n.db')
cur = conn.cursor()

cur.execute("SELECT id, name, nodes, connections, settings FROM workflow_entity ORDER BY name;")
for row in cur.fetchall():
    wf_id, name, nodes_raw, conn_raw, settings_raw = row
    nodes = json.loads(nodes_raw)
    connections = json.loads(conn_raw) if conn_raw else {}
    settings = json.loads(settings_raw) if settings_raw else {}
    
    print(f"\n{'='*60}")
    print(f"Workflow: {name} (ID: {wf_id})")
    print(f"{'='*60}")
    for n in nodes:
        node_type = n.get('type', '')
        if 'webhook' in node_type or 'wait' in node_type or 'if' in node_type or 'switch' in node_type:
            print(f"\n--- Node: {n.get('name')} ---")
            print(json.dumps(n, indent=2, ensure_ascii=False))

conn.close()
