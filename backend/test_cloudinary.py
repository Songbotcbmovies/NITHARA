import os
from dotenv import load_dotenv
load_dotenv()
import cloudinary
import cloudinary.uploader
try:
    res = cloudinary.uploader.upload("requirements.txt", resource_type="raw")
    print(res)
except Exception as e:
    print("Error:", e)
