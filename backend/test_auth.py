import urllib.request
import json
import urllib.error

# Login
req = urllib.request.Request('http://localhost:5000/api/auth/login', 
                             data=json.dumps({'email':'admin@nithara.com', 'password':'password123'}).encode(),
                             headers={'Content-Type': 'application/json'},
                             method='POST')
with urllib.request.urlopen(req) as response:
    token = json.loads(response.read())['access_token']

# Get admin categories
try:
    req2 = urllib.request.Request('http://localhost:5000/api/admin/categories', 
                                 headers={'Authorization': f'Bearer {token}'},
                                 method='GET')
    with urllib.request.urlopen(req2) as response2:
        print("Success:", response2.read())
except urllib.error.HTTPError as e:
    print("HTTPError:", e.code)
    print("Body:", e.read())
