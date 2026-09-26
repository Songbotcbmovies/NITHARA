from app.extensions import db
from app.models.category import Category
from slugify import slugify

def get_all_categories(only_active=True):
    query = Category.query
    if only_active:
        query = query.filter_by(active=True)
    return query.all()

def get_category_by_slug(slug, only_active=True):
    query = Category.query.filter_by(slug=slug)
    if only_active:
        query = query.filter_by(active=True)
    return query.first()

def get_category_by_id(category_id):
    return Category.query.get(category_id)

def create_category(name, description=None, image_url=None, parent_id=None, active=True):
    slug = slugify(name)
    
    # Check if slug exists
    if Category.query.filter_by(slug=slug).first():
        # Append a unique identifier or just return None for simplicity
        slug = f"{slug}-{Category.query.count() + 1}"

    category = Category(
        name=name,
        slug=slug,
        description=description,
        image_url=image_url,
        parent_id=parent_id,
        active=active
    )
    db.session.add(category)
    db.session.commit()
    return category

def update_category(category_id, **kwargs):
    category = Category.query.get(category_id)
    if not category:
        return None
        
    for key, value in kwargs.items():
        if hasattr(category, key):
            setattr(category, key, value)
            
    # Auto-update slug if name changes
    if 'name' in kwargs:
        new_slug = slugify(kwargs['name'])
        if category.slug != new_slug:
            # simple collision avoidance
            if not Category.query.filter_by(slug=new_slug).first():
                category.slug = new_slug
                
    db.session.commit()
    return category

def delete_category(category_id):
    category = Category.query.get(category_id)
    if not category:
        return False
        
    db.session.delete(category)
    db.session.commit()
    return True
