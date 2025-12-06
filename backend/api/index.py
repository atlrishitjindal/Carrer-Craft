import sys
import os

# Add parent directory to path to import server module
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from server import app

# Vercel serverless function handler
handler = app
app = app  # Expose app for Vercel
