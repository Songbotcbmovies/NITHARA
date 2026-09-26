from app.models.user import User
from app.extensions import db, bcrypt

def authenticate(email, password):
    user = User.query.filter_by(email=email).first()
    if user and bcrypt.check_password_hash(user.password_hash, password):
        return user
    return None

def create_admin_user(first_name, last_name, email, password):
    # Check if user already exists
    if User.query.filter_by(email=email).first():
        return None
        
    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
    admin_user = User(
        first_name=first_name,
        last_name=last_name,
        email=email,
        password_hash=hashed_password,
        role='admin'
    )
    db.session.add(admin_user)
    db.session.commit()
    return admin_user
