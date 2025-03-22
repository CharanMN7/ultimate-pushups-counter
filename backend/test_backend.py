#!/usr/bin/env python3

import requests
import sys
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_backend_connection():
    """Test if the backend server is running and accessible"""
    try:
        url = "http://localhost:8000/health"
        logger.info(f"Testing connection to backend at: {url}")
        
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            logger.info("✅ Backend connection successful!")
            logger.info(f"Response: {response.json()}")
            return True
        else:
            logger.error(f"❌ Backend returned status code: {response.status_code}")
            logger.error(f"Response: {response.text}")
            return False
    except requests.exceptions.ConnectionError:
        logger.error("❌ Connection error: Cannot connect to the backend server")
        logger.error("Make sure the backend is running with 'python run.py'")
        return False
    except Exception as e:
        logger.error(f"❌ Error testing backend connection: {str(e)}")
        return False

if __name__ == "__main__":
    logger.info("Testing backend connectivity...")
    if test_backend_connection():
        logger.info("Backend check complete - server is responsive")
        sys.exit(0)
    else:
        logger.error("Backend check failed - please verify the server is running")
        sys.exit(1) 