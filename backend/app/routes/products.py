from flask import Blueprint, request, jsonify
from app.services.product_service import (
    get_all_products, 
    get_product_by_slug, 
    get_featured_products,
    search_products
)

products_bp = Blueprint('products', __name__, url_prefix='/api/products')

def product_to_dict(product):
    return {
        "id": product.id,
        "category_id": product.category_id,
        "name": product.name,
        "slug": product.slug,
        "description": product.description,
        "brand": product.brand,
        "sku": product.sku,
        "price": float(product.price) if product.price else None,
        "compare_price": float(product.compare_price) if product.compare_price else None,
        "featured": product.featured,
        "active": product.active,
        "category_name": product.category.name if product.category else None,
        "images": [{
            "id": img.id,
            "url": img.image_url,
            "alt_text": img.alt_text,
            "is_primary": img.is_primary,
            "sort_order": img.sort_order
        } for img in sorted(product.images, key=lambda x: x.sort_order)] if hasattr(product, 'images') else []
    }

@products_bp.route('', methods=['GET'])
def list_products():
    # Allow filtering by category slug via query string
    category_slug = request.args.get('category')
    
    products = get_all_products(only_active=True)
    
    if category_slug:
        products = [p for p in products if p.category and p.category.slug == category_slug]
        
    return jsonify([product_to_dict(p) for p in products]), 200

@products_bp.route('/featured', methods=['GET'])
def list_featured_products():
    limit = request.args.get('limit', type=int, default=8)
    products = get_featured_products(only_active=True, limit=limit)
    return jsonify([product_to_dict(p) for p in products]), 200

@products_bp.route('/search', methods=['GET'])
def search():
    query = request.args.get('q', '')
    if not query:
        return jsonify([]), 200
        
    products = search_products(query, only_active=True)
    return jsonify([product_to_dict(p) for p in products]), 200

@products_bp.route('/<slug>', methods=['GET'])
def get_product(slug):
    product = get_product_by_slug(slug, only_active=True)
    if not product:
        return jsonify({"message": "Product not found"}), 404
        
    result = product_to_dict(product)
    
    # Inject images
    result["images"] = [{
        "id": img.id,
        "url": img.image_url,
        "alt_text": img.alt_text,
        "is_primary": img.is_primary,
        "sort_order": img.sort_order
    } for img in sorted(product.images, key=lambda x: x.sort_order)]
    
    # Inject variants
    result["variants"] = [{
        "id": v.id,
        "sku": v.sku,
        "size": v.size,
        "color": v.color,
        "price": float(v.price),
        "stock_quantity": v.stock_quantity
    } for v in product.variants if v.active]
    
    # Inject attributes as a key-value dictionary
    result["attributes"] = {attr.attribute_name: attr.attribute_value for attr in product.attributes}
    
    return jsonify(result), 200
