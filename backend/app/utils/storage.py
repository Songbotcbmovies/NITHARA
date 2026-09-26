import os
import cloudinary
import cloudinary.uploader

ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'webp'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

class StorageManager:
    @staticmethod
    def save_file(file):
        """
        Uploads file to Cloudinary and returns the secure URL
        """
        if not file or not allowed_file(file.filename):
            return None
            
        try:
            upload_result = cloudinary.uploader.upload(file)
            return upload_result.get("secure_url")
        except Exception as e:
            print(f"Cloudinary upload failed: {e}")
            return None
        
    @staticmethod
    def delete_file(file_url):
        """
        Extracts public_id from URL and deletes from Cloudinary
        """
        if not file_url or 'cloudinary.com' not in file_url:
            return False
            
        try:
            # Basic extraction of public_id from standard Cloudinary URL
            # Format: .../v1234567890/public_id.jpg
            filename = file_url.split('/')[-1]
            public_id = filename.rsplit('.', 1)[0]
            cloudinary.uploader.destroy(public_id)
            return True
        except Exception as e:
            print(f"Cloudinary delete failed: {e}")
            return False
