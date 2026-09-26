from app import create_app
from app.services.auth_service import create_admin_user

app = create_app()

with app.app_context():
    admin = create_admin_user(
        first_name="Admin",
        last_name="User",
        email="admin@nithara.com",
        password="password123"
    )
    if admin:
        print("Admin user created successfully! Email: admin@nithara.com | Password: password123")
    else:
        print("Admin user already exists.")
