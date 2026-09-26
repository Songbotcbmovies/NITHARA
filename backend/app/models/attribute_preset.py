from app.extensions import db

class AttributePreset(db.Model):
    __tablename__ = 'attribute_presets'

    id = db.Column(db.Integer, primary_key=True)
    attr_type = db.Column(db.String(50), nullable=False) # e.g. 'size' or 'color'
    value = db.Column(db.String(100), nullable=False)    # e.g. 'Medium' or 'Red'
    
    __table_args__ = (
        db.UniqueConstraint('attr_type', 'value', name='_attr_type_value_uc'),
    )
