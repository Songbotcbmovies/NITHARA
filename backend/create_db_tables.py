import sys
import os

# Add backend directory to python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from app.extensions import db
from app.models.attribute_preset import AttributePreset

app = create_app()

with app.app_context():
    db.create_all()
    print("Successfully created missing tables (like AttributePreset)!")
