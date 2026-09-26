import requests

base_url = 'http://localhost:5000/api'

# 1. Login
login_response = requests.post(f'{base_url}/auth/login', json={'email': 'admin@nithara.com', 'password': 'password123'})
if login_response.status_code != 200:
    print('Login failed:', login_response.text)
    exit(1)

token = login_response.json()['access_token']
headers = {'Authorization': f'Bearer {token}'}

# 2. Create Category
cat_data = {'name': 'Clothing', 'description': 'All clothing items'}
create_resp = requests.post(f'{base_url}/admin/categories', json=cat_data, headers=headers)
print('Create Category:', create_resp.status_code, create_resp.text)

# 3. List Categories (Public)
list_resp = requests.get(f'{base_url}/categories')
print('List Categories:', list_resp.status_code, list_resp.text)
