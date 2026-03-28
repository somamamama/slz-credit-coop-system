#!/usr/bin/env python3
"""
Command-line interface for the Loan Application Service.
This script can be called from Node.js or used directly from the command line.
"""

import sys
import json
import os
from loan_application_service import LoanApplicationService

def main():
    """Main CLI function."""
    if len(sys.argv) < 2:
        print_usage()
        sys.exit(1)
    
    command = sys.argv[1]
    
    # Database configuration - Connect to staff database
    db_config = {
        'host': 'localhost',
        'database': 'slz_coop_staff',
        'user': 'postgres',
        'password': 'password',
        'port': 5432
    }
    
    try:
        loan_service = LoanApplicationService(db_config)
        
        if command == '--submit':
            if len(sys.argv) != 4:
                print("Usage: python loan_cli.py --submit <user_id> <file_path>")
                sys.exit(1)
            
            user_id = sys.argv[2]
            file_path = sys.argv[3]
            
            # Create a mock file object
            class MockFile:
                def __init__(self, file_path):
                    self.filename = os.path.basename(file_path)
                    self.file_path = file_path
                
                def read(self, size=-1):
                    with open(self.file_path, 'rb') as f:
                        return f.read(size)
                
                def seek(self, position, whence=0):
                    pass  # Not needed for this implementation
                
                def tell(self):
                    return os.path.getsize(self.file_path)
                
                def save(self, path):
                    import shutil
                    shutil.copy2(self.file_path, path)
            
            mock_file = MockFile(file_path)
            result = loan_service.submit_loan_application(user_id, mock_file)
            print(json.dumps(result))
            
        elif command == '--list':
            user_id = sys.argv[2] if len(sys.argv) > 2 else None
            result = loan_service.get_loan_applications(user_id)
            print(json.dumps(result))
            
        elif command == '--update-status':
            if len(sys.argv) != 4:
                print("Usage: python loan_cli.py --update-status <application_id> <status>")
                sys.exit(1)
            
            application_id = int(sys.argv[2])
            status = sys.argv[3]
            result = loan_service.update_application_status(application_id, status)
            print(json.dumps(result))
            
        elif command == '--test':
            # Run basic test
            print("Testing loan application service...")
            
            # Test user ID (using a sample UUID format for testing)
            # In real usage, this should be a valid member user ID from member_users table
            test_user_id = "123e4567-e89b-12d3-a456-426614174000"
            
            # Create a test JPG file
            from PIL import Image
            from io import BytesIO
            
            img = Image.new('RGB', (100, 100), color='red')
            test_file_path = 'test_application.jpg'
            img.save(test_file_path, 'JPEG')
            
            # Define MockFile class for testing
            class MockFile:
                def __init__(self, file_path):
                    self.filename = os.path.basename(file_path)
                    self.file_path = file_path
                
                def read(self, size=-1):
                    with open(self.file_path, 'rb') as f:
                        return f.read(size)
                
                def seek(self, position, whence=0):
                    pass  # Not needed for this implementation
                
                def tell(self):
                    return os.path.getsize(self.file_path)
                
                def save(self, path):
                    import shutil
                    shutil.copy2(self.file_path, path)
            
            try:
                # Test submission
                mock_file = MockFile(test_file_path)
                result = loan_service.submit_loan_application(test_user_id, mock_file)
                print(f"Test result: {json.dumps(result, indent=2)}")
                
            finally:
                # Clean up test file
                if os.path.exists(test_file_path):
                    os.remove(test_file_path)
                    
        else:
            print(f"Unknown command: {command}")
            print_usage()
            sys.exit(1)
            
    except Exception as e:
        error_result = {
            'success': False,
            'message': f'Error: {str(e)}'
        }
        print(json.dumps(error_result))
        sys.exit(1)

def print_usage():
    """Print usage information."""
    print("Loan Application Service CLI")
    print("=" * 40)
    print("Usage:")
    print("  python loan_cli.py --submit <user_id> <file_path>")
    print("  python loan_cli.py --list [user_id]")
    print("  python loan_cli.py --update-status <application_id> <status>")
    print("  python loan_cli.py --test")
    print("")
    print("Examples:")
    print("  python loan_cli.py --submit 123e4567-e89b-12d3-a456-426614174000 /path/to/application.jpg")
    print("  python loan_cli.py --list 123e4567-e89b-12d3-a456-426614174000")
    print("  python loan_cli.py --list")
    print("  python loan_cli.py --update-status 1 approved")
    print("  python loan_cli.py --test")

if __name__ == "__main__":
    main()
