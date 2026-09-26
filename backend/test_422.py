import requests

login = requests.post('http://localhost:5000/api/auth/login', json={'email':'admin@nithara.com', 'password':'password123'})
token = login.json()['access_token']

resp = requests.get('http://localhost:5000/api/admin/categories', headers={'Authorization': f'Bearer {token}'})
print("Status:", resp.status_code)
print("Response:", resp.text)
