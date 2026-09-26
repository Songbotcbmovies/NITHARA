from app.extensions import db
from app.models.product_variant import ProductVariant

def add_product_variant(product_id, sku, price, size=None, color=None, stock_quantity=0, active=True):
    # Check for duplicate SKU
    if ProductVariant.query.filter_by(sku=sku).first():
        return None
        
    variant = ProductVariant(
        product_id=product_id,
        sku=sku,
        size=size,
        color=color,
        price=price,
        stock_quantity=stock_quantity,
        active=active
    )
    
    db.session.add(variant)
    db.session.commit()
    return variant

def update_product_variant(variant_id, **kwargs):
    variant = ProductVariant.query.get(variant_id)
    if not variant:
        return None
        
    for key, value in kwargs.items():
        if hasattr(variant, key) and key not in ['id', 'product_id', 'created_at', 'updated_at']:
            # Prevent duplicate SKU on update
            if key == 'sku' and variant.sku != value:
                if ProductVariant.query.filter_by(sku=value).first():
                    continue # Skip setting duplicate SKU
            setattr(variant, key, value)
            
    db.session.commit()
    return variant

def delete_product_variant(variant_id):
    variant = ProductVariant.query.get(variant_id)
    if not variant:
        return False
        
    db.session.delete(variant)
    db.session.commit()
    return True
