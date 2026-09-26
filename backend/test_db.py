import os
from sqlalchemy import create_engine
from dotenv import load_dotenv

load_dotenv()
database_url = os.environ.get('DATABASE_URL')
if database_url and database_url.startswith("postgresql://"):
    database_url = database_url.replace("postgresql://", "postgresql+pg8000://", 1)
try:
    engine = create_engine(database_url)
    connection = engine.connect()
    print('Connection successful!')
    connection.close()
except Exception as e:
    print(f'Connection failed: {e}')
