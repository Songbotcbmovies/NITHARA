from flask import Blueprint, jsonify
from app.services.category_service import get_all_categories, get_category_by_slug

categories_bp = Blueprint('categories', __name__, url_prefix='/api/categories')

def category_to_dict(category):
    return {
        "id": category.id,
        "name": category.name,
        "slug": category.slug,
        "description": category.description,
        "image_url": category.image_url,
        "parent_id": category.parent_id,
        "active": category.active
    }

@categories_bp.route('', methods=['GET'])
def list_categories():
    categories = get_all_categories(only_active=True)
    return jsonify([category_to_dict(c) for c in categories]), 200

@categories_bp.route('/<slug>', methods=['GET'])
def get_category(slug):
    category = get_category_by_slug(slug, only_active=True)
    if not category:
        return jsonify({"message": "Category not found"}), 404
        
    # include subcategories
    result = category_to_dict(category)
    result["subcategories"] = [category_to_dict(sub) for sub in category.subcategories if sub.active]
    
    return jsonify(result), 200
