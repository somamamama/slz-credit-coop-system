#!/usr/bin/env python3
"""
Test script for the Loan Application Service.
This script demonstrates how to use the loan application functionality.
"""

import os
import sys
from io import BytesIO
from PIL import Image
from loan_application_service import LoanApplicationService

def create_test_jpg():
    """Create a test JPG file for testing purposes."""
    # Create a simple test image
    img = Image.new('RGB', (100, 100), color='red')
    img_bytes = BytesIO()
    img.save(img_bytes, format='JPEG')
    img_bytes.seek(0)
    return img_bytes

class MockFile:
    """Mock file object for testing."""
    def __init__(self, content, filename):
        self.content = content
        self.filename = filename
        self.position = 0
    
    def read(self, size=-1):
        if size == -1:
            return self.content
        data = self.content[self.position:self.position + size]
        self.position += len(data)
        return data
    
    def seek(self, position, whence=0):
        if whence == 0:
            self.position = position
        elif whence == 1:
            self.position += position
        elif whence == 2:
            self.position = len(self.content) + position
    
    def tell(self):
        return self.position
    
    def save(self, path):
        with open(path, 'wb') as f:
            f.write(self.content)

def test_loan_application_service():
    """Test the loan application service functionality."""
    
    # Database configuration (adjust as needed)
    db_config = {
        'host': 'localhost',
        'database': 'slz_members',
        'user': 'postgres',
        'password': 'password',
        'port': 5432
    }
    
    try:
        # Create service instance
        print("Initializing Loan Application Service...")
        loan_service = LoanApplicationService(db_config)
        print("✓ Service initialized successfully!")
        
        # Create test JPG file
        print("\nCreating test JPG file...")
        test_jpg_content = create_test_jpg().getvalue()
        test_file = MockFile(test_jpg_content, "test_application.jpg")
        print("✓ Test JPG file created!")
        
        # Test user ID (you'll need to replace this with an actual user ID from your database)
        test_user_id = "123e4567-e89b-12d3-a456-426614174000"  # Example UUID
        
        print(f"\nTesting loan application submission for user: {test_user_id}")
        
        # Submit loan application
        result = loan_service.submit_loan_application(test_user_id, test_file)
        
        if result['success']:
            print("✓ Loan application submitted successfully!")
            print(f"  Application ID: {result['application_id']}")
            print(f"  File saved to: {result['file_path']}")
            
            # Test retrieving applications
            print("\nTesting application retrieval...")
            applications_result = loan_service.get_loan_applications(test_user_id)
            
            if applications_result['success']:
                print("✓ Applications retrieved successfully!")
                print(f"  Found {len(applications_result['applications'])} applications")
                for app in applications_result['applications']:
                    print(f"    - App ID: {app['application_id']}, Status: {app['status']}")
            else:
                print(f"✗ Error retrieving applications: {applications_result['message']}")
            
        else:
            print(f"✗ Loan application failed: {result['message']}")
            
            # If user doesn't exist, let's try to create the table first
            if "User does not exist" in result['message']:
                print("\nNote: The test user doesn't exist in the database.")
                print("Please ensure you have a valid user_id from your member_users table.")
                print("You can check existing users with: SELECT user_id, user_name FROM users LIMIT 5;")
        
        print("\n" + "="*50)
        print("Test completed!")
        
    except Exception as e:
        print(f"✗ Test failed with error: {str(e)}")
        print("\nMake sure:")
        print("1. PostgreSQL is running")
        print("2. Database 'slz_members' exists")
        print("3. User table exists with proper schema")
        print("4. Database credentials are correct")

def show_usage_examples():
    """Show usage examples for the loan application service."""
    print("\n" + "="*60)
    print("LOAN APPLICATION SERVICE - USAGE EXAMPLES")
    print("="*60)
    
    print("\n1. Basic Setup:")
    print("""
    from loan_application_service import LoanApplicationService
    
    db_config = {
        'host': 'localhost',
        'database': 'slz_members',
        'user': 'postgres',
        'password': 'password',
        'port': 5432
    }
    
    loan_service = LoanApplicationService(db_config)
    """)
    
    print("\n2. Submit Loan Application:")
    print("""
    # Assuming you have a file object from a web request
    result = loan_service.submit_loan_application(user_id, jpg_file)
    
    if result['success']:
        print(f"Application submitted! ID: {result['application_id']}")
    else:
        print(f"Error: {result['message']}")
    """)
    
    print("\n3. Get Applications:")
    print("""
    # Get all applications for a specific user
    result = loan_service.get_loan_applications(user_id)
    
    # Get all applications (admin view)
    result = loan_service.get_loan_applications()
    """)
    
    print("\n4. Update Application Status:")
    print("""
    result = loan_service.update_application_status(application_id, 'approved')
    """)
    
    print("\n5. Flask Integration:")
    print("""
    from flask import Flask, request, jsonify
    from loan_application_service import create_flask_routes
    
    app = Flask(__name__)
    loan_service = LoanApplicationService(db_config)
    create_flask_routes(app, loan_service)
    """)

if __name__ == "__main__":
    print("Loan Application Service Test")
    print("="*40)
    
    if len(sys.argv) > 1 and sys.argv[1] == "--examples":
        show_usage_examples()
    else:
        test_loan_application_service()
        show_usage_examples()
