from app.extensions import db
from app.models.product import Product
from app.models.category import Category
from slugify import slugify
from sqlalchemy.orm import selectinload

def get_all_products(only_active=True, limit=None):
    query = Product.query.options(
        selectinload(Product.images),
        selectinload(Product.category)
    )
    if only_active:
        query = query.filter_by(active=True)
    if limit:
        query = query.limit(limit)
    return query.all()

def get_product_by_slug(slug, only_active=True):
    query = Product.query.options(
        selectinload(Product.images),
        selectinload(Product.category),
        selectinload(Product.variants),
        selectinload(Product.attributes)
    ).filter_by(slug=slug)
    if only_active:
        query = query.filter_by(active=True)
    return query.first()

def get_featured_products(only_active=True, limit=None):
    query = Product.query.options(
        selectinload(Product.images),
        selectinload(Product.category)
    ).filter_by(featured=True)
    if only_active:
        query = query.filter_by(active=True)
    if limit:
        query = query.limit(limit)
    return query.all()

def search_products(search_term, only_active=True):
    query = Product.query.options(
        selectinload(Product.images),
        selectinload(Product.category)
    )
    if only_active:
        query = query.filter_by(active=True)
        
    search_pattern = f"%{search_term}%"
    query = query.filter(
        db.or_(
            Product.name.ilike(search_pattern),
            Product.description.ilike(search_pattern),
            Product.sku.ilike(search_pattern),
            Product.brand.ilike(search_pattern)
        )
    )
    return query.all()

def create_product(category_id, name, price, sku, description=None, brand=None, compare_price=None, featured=False, active=True):
    slug = slugify(name)
    
    # Check for slug collision
    if Product.query.filter_by(slug=slug).first():
        slug = f"{slug}-{sku.lower()}"

    product = Product(
        category_id=category_id,
        name=name,
        slug=slug,
        description=description,
        brand=brand,
        sku=sku,
        price=price,
        compare_price=compare_price,
        featured=featured,
        active=active
    )
    db.session.add(product)
    db.session.commit()
    return product

def update_product(product_id, **kwargs):
    product = Product.query.get(product_id)
    if not product:
        return None
        
    for key, value in kwargs.items():
        if hasattr(product, key) and key not in ['id', 'created_at', 'updated_at']:
            setattr(product, key, value)
            
    if 'name' in kwargs:
        new_slug = slugify(kwargs['name'])
        if product.slug != new_slug:
            # simple collision avoidance
            if not Product.query.filter_by(slug=new_slug).first():
                product.slug = new_slug
                
    db.session.commit()
    return product

def delete_product(product_id):
    product = Product.query.get(product_id)
    if not product:
        return False
        
    db.session.delete(product)
    db.session.commit()
    return True
