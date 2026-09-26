from app.extensions import db
from app.models.product_attribute import ProductAttribute

def add_product_attribute(product_id, attribute_name, attribute_value):
    # Check if this attribute name already exists for this product to update it instead
    existing_attr = ProductAttribute.query.filter_by(
        product_id=product_id, 
        attribute_name=attribute_name
    ).first()
    
    if existing_attr:
        existing_attr.attribute_value = attribute_value
        db.session.commit()
        return existing_attr

    attribute = ProductAttribute(
        product_id=product_id,
        attribute_name=attribute_name,
        attribute_value=attribute_value
    )
    db.session.add(attribute)
    db.session.commit()
    return attribute

def delete_product_attribute(attribute_id):
    attribute = ProductAttribute.query.get(attribute_id)
    if not attribute:
        return False
        
    db.session.delete(attribute)
    db.session.commit()
    return True
