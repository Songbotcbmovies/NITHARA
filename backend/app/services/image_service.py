from app.extensions import db
from app.models.product_image import ProductImage
from app.utils.storage import StorageManager

def add_product_image(product_id, file, alt_text=None, is_primary=False):
    image_url = StorageManager.save_file(file)
    
    if not image_url:
        return None
        
    # If this is set as primary, unset others
    if is_primary:
        ProductImage.query.filter_by(product_id=product_id, is_primary=True).update({'is_primary': False})
        
    # Get current max sort_order
    current_max = db.session.query(db.func.max(ProductImage.sort_order)).filter_by(product_id=product_id).scalar()
    next_order = (current_max or 0) + 1
        
    image = ProductImage(
        product_id=product_id,
        image_url=image_url,
        alt_text=alt_text,
        sort_order=next_order,
        is_primary=is_primary
    )
    
    db.session.add(image)
    db.session.commit()
    return image

def delete_product_image(image_id):
    image = ProductImage.query.get(image_id)
    if not image:
        return False
        
    # Delete from storage
    StorageManager.delete_file(image.image_url)
    
    # Delete from DB
    db.session.delete(image)
    db.session.commit()
    return True
