import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('8.217.147.240', username='root', password='opcYK6166680', timeout=30)

pubkey = 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIBtv/tAOaDlymgi0mxWKIvWxukqYBDmzReyG8smwpJGj kimi-cli-20260411'
cmds = [
    'mkdir -p ~/.ssh',
    'echo "' + pubkey + '" >> ~/.ssh/authorized_keys',
    'chmod 600 ~/.ssh/authorized_keys',
    'chmod 700 ~/.ssh',
    'echo "SSH_KEY_ADDED_OK"'
]

for cmd in cmds:
    stdin, stdout, stderr = client.exec_command(cmd)
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    if err and 'warning' not in err.lower():
        print('ERR:', err)
    if out:
        print(out)

client.close()
