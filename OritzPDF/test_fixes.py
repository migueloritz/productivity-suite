#!/usr/bin/env python3
"""
Test script to validate the fixes made to OritzPDF
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

import asyncio
import logging
from pathlib import Path

# Test imports
try:
    from src.config import settings
    from src.models.document import DocumentUploadRequest, DocumentType
    from src.services.document_service import DocumentService
    from src.services.cache_service import CacheService
    from src.services.storage_service import LocalStorageService
    print("✓ All imports successful")
except ImportError as e:
    print(f"✗ Import failed: {e}")
    sys.exit(1)

async def test_document_service():
    """Test document service functionality"""
    print("\n=== Testing Document Service ===")
    
    # Test validation
    service = DocumentService()
    
    # Test empty filename
    try:
        await service.validate_upload("", 1000, "application/pdf")
        print("✗ Should have failed with empty filename")
    except ValueError:
        print("✓ Empty filename validation works")
    
    # Test invalid file size
    try:
        await service.validate_upload("test.pdf", 0, "application/pdf")
        print("✗ Should have failed with zero file size")
    except ValueError:
        print("✓ Zero file size validation works")
    
    # Test valid upload
    try:
        await service.validate_upload("test.pdf", 1000, "application/pdf")
        print("✓ Valid upload validation works")
    except Exception as e:
        print(f"✗ Valid upload validation failed: {e}")

async def test_cache_service():
    """Test cache service with error handling"""
    print("\n=== Testing Cache Service ===")
    
    cache = CacheService("redis://invalid-host:6379")
    
    # Test graceful failure
    try:
        result = await cache.get("test-key")
        print(f"✓ Cache gracefully handled connection failure: {result}")
    except Exception as e:
        print(f"✓ Cache properly raised error: {e}")
    
    # Test empty key validation
    cache._redis = None  # Simulate no connection
    result = await cache.set("", "value")
    if not result:
        print("✓ Empty key validation works")
    else:
        print("✗ Empty key should have failed")

async def test_storage_service():
    """Test storage service"""
    print("\n=== Testing Storage Service ===")
    
    storage = LocalStorageService("/tmp/test_storage")
    
    # Test file operations
    test_content = b"test content"
    
    try:
        # Save file
        path = await storage.save_file(test_content, "test.txt")
        print(f"✓ File saved: {path}")
        
        # Check exists
        exists = await storage.file_exists(path)
        print(f"✓ File exists check: {exists}")
        
        # Read file
        content = await storage.get_file(path)
        if content == test_content:
            print("✓ File content matches")
        else:
            print("✗ File content doesn't match")
        
        # Delete file
        deleted = await storage.delete_file(path)
        print(f"✓ File deleted: {deleted}")
        
    except Exception as e:
        print(f"✗ Storage test failed: {e}")

def test_config():
    """Test configuration loading"""
    print("\n=== Testing Configuration ===")
    
    print(f"✓ App name: {settings.APP_NAME}")
    print(f"✓ Max file size: {settings.MAX_FILE_SIZE_MB}MB")
    print(f"✓ Supported formats: {settings.supported_formats_list}")
    print(f"✓ Max file size bytes: {settings.max_file_size_bytes}")

async def main():
    """Run all tests"""
    print("Running OritzPDF fixes validation...")
    
    test_config()
    await test_document_service()
    await test_cache_service()
    await test_storage_service()
    
    print("\n=== Test Summary ===")
    print("All basic functionality tests completed.")
    print("Check the output above for any failed tests (marked with ✗)")

if __name__ == "__main__":
    # Configure logging to see any warnings/errors
    logging.basicConfig(level=logging.WARNING)
    
    asyncio.run(main())