import sqlite3, json, sys
conn = sqlite3.connect(r'D:\02工作空间\xsc-enterprise\data\n8n.db')
cur = conn.cursor()

cur.execute("SELECT id, name, nodes, connections, settings FROM workflow_entity WHERE name='XSC Renewal Reminder';")
row = cur.fetchone()
if row:
    print('ID:', row[0])
    print('Name:', row[1])
    nodes = json.loads(row[2])
    print('Nodes count:', len(nodes))
    for n in nodes:
        print('  -', n.get('name'), '|', n.get('type'))
    conn_settings = json.loads(row[3]) if row[3] else {}
    print('Connections sample:', json.dumps(conn_settings, indent=2, ensure_ascii=False)[:500])
    settings = json.loads(row[4]) if row[4] else {}
    print('Settings:', json.dumps(settings, indent=2, ensure_ascii=False))

print("\n=== All workflows ===")
cur.execute("SELECT id, name, active FROM workflow_entity ORDER BY name;")
for r in cur.fetchall():
    print(r)

conn.close()
