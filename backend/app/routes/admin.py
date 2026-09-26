from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.user import User
from app.services.category_service import (
    create_category, 
    update_category, 
    delete_category,
    get_all_categories
)

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')

def admin_required(fn):
    @jwt_required()
    def wrapper(*args, **kwargs):
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        if not user or user.role != 'admin':
            return jsonify({"message": "Admin privileges required"}), 403
        return fn(*args, **kwargs)
    wrapper.__name__ = fn.__name__
    return wrapper

# --- Categories Admin ---

@admin_bp.route('/categories', methods=['GET'])
@admin_required
def admin_list_categories():
    # Admin sees all categories, including inactive ones
    categories = get_all_categories(only_active=False)
    result = []
    for c in categories:
        result.append({
            "id": c.id,
            "name": c.name,
            "slug": c.slug,
            "active": c.active,
            "parent_id": c.parent_id,
            "image_url": c.image_url
        })
    return jsonify(result), 200

@admin_bp.route('/categories', methods=['POST'])
@admin_required
def admin_create_category():
    data = request.get_json()
    if not data or not data.get('name'):
        return jsonify({"message": "Category name is required"}), 400
        
    category = create_category(
        name=data.get('name'),
        description=data.get('description'),
        image_url=data.get('image_url'),
        parent_id=data.get('parent_id'),
        active=data.get('active', True)
    )
    
    return jsonify({"message": "Category created", "id": category.id, "slug": category.slug}), 201

@admin_bp.route('/categories/<int:category_id>', methods=['PUT'])
@admin_required
def admin_update_category(category_id):
    data = request.get_json()
    category = update_category(category_id, **data)
    
    if not category:
        return jsonify({"message": "Category not found"}), 404
        
    return jsonify({"message": "Category updated", "id": category.id}), 200

@admin_bp.route('/categories/<int:category_id>', methods=['DELETE'])
@admin_required
def admin_delete_category(category_id):
    success = delete_category(category_id)
    if not success:
        return jsonify({"message": "Category not found"}), 404
        
    return jsonify({"message": "Category deleted"}), 200

from app.utils.storage import StorageManager
@admin_bp.route('/categories/<int:category_id>/image', methods=['POST'])
@admin_required
def admin_upload_category_image(category_id):
    from app.models.category import Category
    from app.extensions import db
    
    category = Category.query.get(category_id)
    if not category:
        return jsonify({"message": "Category not found"}), 404
        
    if 'image' not in request.files:
        return jsonify({"message": "No image file provided"}), 400
        
    file = request.files['image']
    if file.filename == '':
        return jsonify({"message": "Empty file name"}), 400
        
    image_url = StorageManager.save_file(file)
    if not image_url:
        return jsonify({"message": "Invalid file type. Allowed: jpg, jpeg, png, webp"}), 400
        
    category.image_url = image_url
    db.session.commit()
    
    return jsonify({"message": "Category image uploaded successfully", "image_url": image_url}), 201

# --- Products Admin ---
from app.services.product_service import (
    create_product, update_product, delete_product, get_all_products
)

@admin_bp.route('/products', methods=['GET'])
@admin_required
def admin_list_products():
    products = get_all_products(only_active=False)
    result = []
    for p in products:
        primary_img = next((img.image_url for img in p.images if img.is_primary), None)
        if not primary_img and p.images:
            primary_img = p.images[0].image_url
            
        result.append({
            "id": p.id,
            "name": p.name,
            "category_id": p.category_id,
            "price": float(p.price) if p.price else None,
            "active": p.active,
            "featured": p.featured,
            "image_url": primary_img
        })
    return jsonify(result), 200

@admin_bp.route('/products/<int:product_id>', methods=['GET'])
@admin_required
def admin_get_product(product_id):
    from app.models.product import Product
    product = Product.query.get(product_id)
    if not product:
        return jsonify({"message": "Product not found"}), 404
        
    return jsonify({
        "id": product.id,
        "name": product.name,
        "category_id": product.category_id,
        "price": float(product.price) if product.price else None,
        "sku": product.sku,
        "description": product.description,
        "active": product.active,
        "featured": product.featured
    }), 200

@admin_bp.route('/products', methods=['POST'])
@admin_required
def admin_create_product():
    data = request.get_json()
    req_fields = ['name', 'price', 'sku', 'category_id']
    if not all(field in data for field in req_fields):
        return jsonify({"message": f"Missing required fields: {', '.join(req_fields)}"}), 400
        
    product = create_product(
        category_id=data['category_id'],
        name=data['name'],
        price=data['price'],
        sku=data['sku'],
        description=data.get('description'),
        brand=data.get('brand'),
        compare_price=data.get('compare_price'),
        featured=data.get('featured', False),
        active=data.get('active', True)
    )
    
    return jsonify({"message": "Product created", "id": product.id, "slug": product.slug}), 201

@admin_bp.route('/products/<int:product_id>', methods=['PUT'])
@admin_required
def admin_update_product(product_id):
    data = request.get_json()
    product = update_product(product_id, **data)
    
    if not product:
        return jsonify({"message": "Product not found"}), 404
        
    return jsonify({"message": "Product updated", "id": product.id}), 200

@admin_bp.route('/products/<int:product_id>', methods=['DELETE'])
@admin_required
def admin_delete_product(product_id):
    success = delete_product(product_id)
    if not success:
        return jsonify({"message": "Product not found"}), 404
        
    return jsonify({"message": "Product deleted"}), 200

# --- Product Images Admin ---
from app.services.image_service import add_product_image, delete_product_image

@admin_bp.route('/products/<int:product_id>/images', methods=['POST'])
@admin_required
def admin_upload_image(product_id):
    if 'image' not in request.files:
        return jsonify({"message": "No image file provided"}), 400
        
    file = request.files['image']
    if file.filename == '':
        return jsonify({"message": "Empty file name"}), 400
        
    is_primary = request.form.get('is_primary', 'false').lower() == 'true'
    alt_text = request.form.get('alt_text', '')
    
    image = add_product_image(product_id, file, alt_text, is_primary)
    
    if not image:
        return jsonify({"message": "Invalid file type. Allowed: jpg, jpeg, png, webp"}), 400
        
    return jsonify({
        "message": "Image uploaded successfully",
        "image": {
            "id": image.id,
            "url": image.image_url,
            "is_primary": image.is_primary
        }
    }), 201

@admin_bp.route('/products/<int:product_id>/images/<int:image_id>', methods=['DELETE'])
@admin_required
def admin_delete_image(product_id, image_id):
    success = delete_product_image(image_id)
    if not success:
        return jsonify({"message": "Image not found"}), 404
        
    return jsonify({"message": "Image deleted successfully"}), 200

# --- Product Variants Admin ---
from app.services.variant_service import add_product_variant, update_product_variant, delete_product_variant

@admin_bp.route('/products/<int:product_id>/variants', methods=['POST'])
@admin_required
def admin_create_variant(product_id):
    data = request.get_json()
    req_fields = ['sku', 'price']
    if not data or not all(field in data for field in req_fields):
        return jsonify({"message": f"Missing required fields: {', '.join(req_fields)}"}), 400
        
    variant = add_product_variant(
        product_id=product_id,
        sku=data['sku'],
        price=data['price'],
        size=data.get('size'),
        color=data.get('color'),
        stock_quantity=data.get('stock_quantity', 0),
        active=data.get('active', True)
    )
    
    if not variant:
        return jsonify({"message": "Variant SKU already exists"}), 400
        
    return jsonify({"message": "Variant created", "id": variant.id}), 201

@admin_bp.route('/variants/<int:variant_id>', methods=['PUT'])
@admin_required
def admin_update_variant(variant_id):
    data = request.get_json()
    variant = update_product_variant(variant_id, **data)
    
    if not variant:
        return jsonify({"message": "Variant not found"}), 404
        
    return jsonify({"message": "Variant updated", "id": variant.id}), 200

@admin_bp.route('/variants/<int:variant_id>', methods=['DELETE'])
@admin_required
def admin_delete_variant(variant_id):
    success = delete_product_variant(variant_id)
    if not success:
        return jsonify({"message": "Variant not found"}), 404
        
    return jsonify({"message": "Variant deleted"}), 200

# --- Product Attributes Admin ---
from app.services.attribute_service import add_product_attribute, delete_product_attribute

@admin_bp.route('/products/<int:product_id>/attributes', methods=['POST'])
@admin_required
def admin_create_attribute(product_id):
    data = request.get_json()
    if not data or not data.get('attribute_name') or not data.get('attribute_value'):
        return jsonify({"message": "Both attribute_name and attribute_value are required"}), 400
        
    attribute = add_product_attribute(
        product_id=product_id,
        attribute_name=data['attribute_name'],
        attribute_value=data['attribute_value']
    )
    
    return jsonify({"message": "Attribute added", "id": attribute.id}), 201

@admin_bp.route('/attributes/<int:attribute_id>', methods=['DELETE'])
@admin_required
def admin_delete_attribute(attribute_id):
    success = delete_product_attribute(attribute_id)
    if not success:
        return jsonify({"message": "Attribute not found"}), 404
        
    return jsonify({"message": "Attribute deleted"}), 200

# --- Attribute Presets Admin ---
from app.models.attribute_preset import AttributePreset

@admin_bp.route('/presets', methods=['GET'])
@admin_required
def admin_list_presets():
    presets = AttributePreset.query.all()
    result = []
    for p in presets:
        result.append({
            "id": p.id,
            "attr_type": p.attr_type,
            "value": p.value
        })
    return jsonify(result), 200

@admin_bp.route('/presets', methods=['POST'])
@admin_required
def admin_create_preset():
    data = request.get_json()
    if not data or not data.get('attr_type') or not data.get('value'):
        return jsonify({"message": "attr_type and value are required"}), 400
        
    # Check if exists
    exists = AttributePreset.query.filter_by(attr_type=data['attr_type'], value=data['value']).first()
    if exists:
        return jsonify({"message": "Preset already exists"}), 400
        
    preset = AttributePreset(
        attr_type=data['attr_type'],
        value=data['value']
    )
    from app.extensions import db
    db.session.add(preset)
    db.session.commit()
    
    return jsonify({"message": "Preset created", "id": preset.id}), 201

@admin_bp.route('/presets/<int:preset_id>', methods=['DELETE'])
@admin_required
def admin_delete_preset(preset_id):
    preset = AttributePreset.query.get(preset_id)
    if not preset:
        return jsonify({"message": "Preset not found"}), 404
        
    from app.extensions import db
    db.session.delete(preset)
    db.session.commit()
    return jsonify({"message": "Preset deleted"}), 200
