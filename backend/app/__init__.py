from flask import Flask, jsonify
from app.config import Config
from app.extensions import db, migrate, jwt, bcrypt, cors

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize Flask extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    bcrypt.init_app(app)
    cors.init_app(app)

    # Register models so SQLAlchemy knows about them
    from app import models

    # Register blueprints
    from app.routes.auth import auth_bp
    from app.routes.categories import categories_bp
    from app.routes.products import products_bp
    from app.routes.admin import admin_bp
    
    app.register_blueprint(auth_bp)
    app.register_blueprint(categories_bp)
    app.register_blueprint(products_bp)
    app.register_blueprint(admin_bp)

    # Simple health check route
    @app.route('/api/health')
    def health_check():
        return jsonify({"status": "success", "message": "Nithara Fashion Store API is running"}), 200

    # Serve uploaded images
    from flask import send_from_directory
    @app.route('/uploads/<path:filename>')
    def serve_uploads(filename):
        return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

    # Serve frontend files
    import os
    frontend_dir = os.path.abspath(os.path.join(os.path.dirname(os.path.dirname(__file__)), '..', 'frontend'))

    @app.route('/')
    def serve_frontend_index():
        return send_from_directory(frontend_dir, 'index.html')

    @app.route('/<path:path>')
    def serve_frontend_files(path):
        target = os.path.join(frontend_dir, path)
        if os.path.isfile(target):
            return send_from_directory(frontend_dir, path)
        if os.path.isfile(target + '.html'):
            return send_from_directory(frontend_dir, path + '.html')
        if os.path.isfile(os.path.join(target, 'index.html')):
            return send_from_directory(target, 'index.html')
        return jsonify({"error": "Not Found"}), 404

    return app
