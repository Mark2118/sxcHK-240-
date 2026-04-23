import urllib.request, json

# Test webhook endpoints
endpoints = ['user-register', 'report-ready', 'limit-exceeded', 'wingo-events', 'renewal-reminder', 'sleeping-wakeup', 'b2b-lead']
for ep in endpoints:
    try:
        req = urllib.request.Request(f'http://localhost:5678/webhook/{ep}', method='POST', data=b'{"test":true}', headers={'Content-Type': 'application/json'})
        r = urllib.request.urlopen(req, timeout=5)
        print(f'  {ep}: {r.getcode()} - {r.read().decode()[:50]}')
    except urllib.error.HTTPError as e:
        print(f'  {ep}: HTTP {e.code}')
    except Exception as e:
        print(f'  {ep}: {type(e).__name__}: {str(e)[:60]}')
