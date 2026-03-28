import os
import uuid
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime
from werkzeug.utils import secure_filename
import mimetypes
from PIL import Image
import io

class LoanApplicationService:
    def __init__(self, db_config):
        """
        Initialize the loan application service with database configuration.
        
        Args:
            db_config (dict): Database configuration containing:
                - host: Database host
                - database: Database name (should be 'slz_members')
                - user: Database user
                - password: Database password
                - port: Database port
        """
        self.db_config = db_config
        self.upload_folder = "loan_applications"
        self.allowed_extensions = {'jpg', 'jpeg'}
        self.max_file_size = 10 * 1024 * 1024  # 10MB max file size
        
        # Create upload directory if it doesn't exist
        os.makedirs(self.upload_folder, exist_ok=True)
        
        # Ensure we're connecting to the correct database
        if db_config.get('database') != 'slz_coop_staff':
            print(f"Warning: Expected database 'slz_coop_staff', got '{db_config.get('database')}'")
            print("Make sure you're connecting to the staff database where member_users table exists.")
    
    def _get_db_connection(self):
        """Create and return a database connection."""
        try:
            conn = psycopg2.connect(**self.db_config)
            return conn
        except psycopg2.Error as e:
            raise Exception(f"Database connection failed: {str(e)}")
    
    def _validate_file_type(self, file_path):
        """
        Validate that the file is a valid JPG/JPEG image.
        
        Args:
            file_path (str): Path to the file to validate
            
        Returns:
            bool: True if file is valid JPG/JPEG, False otherwise
        """
        try:
            # Check file extension
            file_ext = file_path.lower().split('.')[-1]
            if file_ext not in self.allowed_extensions:
                return False
            
            # Check MIME type
            mime_type, _ = mimetypes.guess_type(file_path)
            if mime_type not in ['image/jpeg', 'image/jpg']:
                return False
            
            # Try to open with PIL to verify it's a valid image
            with Image.open(file_path) as img:
                # Verify it's actually a JPEG
                if img.format not in ['JPEG', 'JPG']:
                    return False
                    
            return True
        except Exception:
            return False
    
    def _generate_unique_filename(self, original_filename):
        """
        Generate a unique filename to prevent conflicts.
        
        Args:
            original_filename (str): Original filename
            
        Returns:
            str: Unique filename with timestamp and UUID
        """
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        unique_id = str(uuid.uuid4())[:8]
        file_ext = original_filename.split('.')[-1].lower()
        return f"loan_app_{timestamp}_{unique_id}.{file_ext}"
    
    def _validate_user_exists(self, user_id):
        """
        Validate that the user exists in the member_users table and is active.
        
        Args:
            user_id (str): User ID to validate
            
        Returns:
            bool: True if user exists and is active, False otherwise
        """
        try:
            conn = self._get_db_connection()
            cursor = conn.cursor()
            
            # Check if user exists in member_users table and is active
            cursor.execute(
                "SELECT user_id, user_name, member_number FROM member_users WHERE user_id = %s AND is_active = true", 
                (user_id,)
            )
            result = cursor.fetchone()
            
            cursor.close()
            conn.close()
            
            return result is not None
        except Exception as e:
            raise Exception(f"Error validating user: {str(e)}")
    
    def get_member_info(self, user_id):
        """
        Get member information by user ID.
        
        Args:
            user_id (str): User ID to look up
            
        Returns:
            dict: Member information or None if not found
        """
        try:
            conn = self._get_db_connection()
            cursor = conn.cursor()
            
            cursor.execute(
                "SELECT user_id, user_name, user_email, member_number, is_active FROM member_users WHERE user_id = %s", 
                (user_id,)
            )
            result = cursor.fetchone()
            
            cursor.close()
            conn.close()
            
            if result:
                return {
                    'user_id': result[0],
                    'user_name': result[1],
                    'user_email': result[2],
                    'member_number': result[3],
                    'is_active': result[4]
                }
            return None
        except Exception as e:
            raise Exception(f"Error fetching member info: {str(e)}")
    
    def _create_loan_applications_table(self):
        """
        Create the loan_applications table if it doesn't exist.
        """
        try:
            conn = self._get_db_connection()
            cursor = conn.cursor()
            
            create_table_query = """
            CREATE TABLE IF NOT EXISTS loan_applications (
                application_id SERIAL PRIMARY KEY,
                user_id UUID NOT NULL,
                application_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                jpg_file_path VARCHAR(500) NOT NULL,
                status VARCHAR(50) DEFAULT 'pending',
                submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES member_users(user_id) ON DELETE CASCADE
            );
            """
            
            cursor.execute(create_table_query)
            conn.commit()
            
            cursor.close()
            conn.close()
            
        except Exception as e:
            raise Exception(f"Error creating loan_applications table: {str(e)}")
    
    def submit_loan_application(self, user_id, jpg_file):
        """
        Submit a loan application with JPG file upload.
        
        Args:
            user_id (str): User ID of the member submitting the application
            jpg_file: File object containing the JPG image
            
        Returns:
            dict: Result containing success status, message, and application_id
        """
        try:
            # Validate user exists and is active
            if not self._validate_user_exists(user_id):
                member_info = self.get_member_info(user_id)
                if member_info is None:
                    return {
                        'success': False,
                        'message': 'Invalid user ID. Member account does not exist.',
                        'application_id': None
                    }
                elif not member_info['is_active']:
                    return {
                        'success': False,
                        'message': 'Member account is inactive. Please contact support.',
                        'application_id': None
                    }
                else:
                    return {
                        'success': False,
                        'message': 'Unable to validate member account.',
                        'application_id': None
                    }
            
            # Validate file
            if not jpg_file or not jpg_file.filename:
                return {
                    'success': False,
                    'message': 'No file provided.',
                    'application_id': None
                }
            
            # Check file size
            jpg_file.seek(0, 2)  # Seek to end
            file_size = jpg_file.tell()
            jpg_file.seek(0)  # Reset to beginning
            
            if file_size > self.max_file_size:
                return {
                    'success': False,
                    'message': f'File too large. Maximum size allowed is {self.max_file_size / (1024*1024):.1f}MB.',
                    'application_id': None
                }
            
            # Generate secure filename
            original_filename = secure_filename(jpg_file.filename)
            unique_filename = self._generate_unique_filename(original_filename)
            file_path = os.path.join(self.upload_folder, unique_filename)
            
            # Save file temporarily to validate
            jpg_file.save(file_path)
            
            try:
                # Validate file type
                if not self._validate_file_type(file_path):
                    os.remove(file_path)  # Clean up invalid file
                    return {
                        'success': False,
                        'message': 'Invalid file type. Only JPG/JPEG files are allowed.',
                        'application_id': None
                    }
                
                # Create loan_applications table if it doesn't exist
                self._create_loan_applications_table()
                
                # Store application in database
                conn = self._get_db_connection()
                cursor = conn.cursor()
                
                insert_query = """
                INSERT INTO loan_applications (user_id, jpg_file_path, status, submitted_at)
                VALUES (%s, %s, %s, %s)
                RETURNING application_id
                """
                
                cursor.execute(insert_query, (
                    user_id,
                    file_path,
                    'pending',
                    datetime.now()
                ))
                
                application_id = cursor.fetchone()[0]
                conn.commit()
                
                cursor.close()
                conn.close()
                
                return {
                    'success': True,
                    'message': 'Loan application submitted successfully.',
                    'application_id': application_id,
                    'file_path': file_path
                }
                
            except Exception as e:
                # Clean up file if database operation fails
                if os.path.exists(file_path):
                    os.remove(file_path)
                raise e
                
        except psycopg2.Error as e:
            return {
                'success': False,
                'message': f'Database error: {str(e)}',
                'application_id': None
            }
        except Exception as e:
            return {
                'success': False,
                'message': f'Error processing loan application: {str(e)}',
                'application_id': None
            }
    
    def get_loan_applications(self, user_id=None):
        """
        Retrieve loan applications, optionally filtered by user_id.
        
        Args:
            user_id (str, optional): User ID to filter applications
            
        Returns:
            dict: Result containing success status and applications list
        """
        try:
            conn = self._get_db_connection()
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            
            if user_id:
                query = """
                SELECT la.*, mu.user_name, mu.user_email, mu.member_number
                FROM loan_applications la
                JOIN member_users mu ON la.user_id = mu.user_id
                WHERE la.user_id = %s
                ORDER BY la.submitted_at DESC
                """
                cursor.execute(query, (user_id,))
            else:
                query = """
                SELECT la.*, mu.user_name, mu.user_email, mu.member_number
                FROM loan_applications la
                JOIN member_users mu ON la.user_id = mu.user_id
                ORDER BY la.submitted_at DESC
                """
                cursor.execute(query)
            
            applications = cursor.fetchall()
            
            cursor.close()
            conn.close()
            
            # Convert datetime objects to strings for JSON serialization
            applications_list = []
            for app in applications:
                app_dict = dict(app)
                # Convert datetime objects to ISO format strings
                for key, value in app_dict.items():
                    if hasattr(value, 'isoformat'):
                        app_dict[key] = value.isoformat()
                applications_list.append(app_dict)
            
            return {
                'success': True,
                'applications': applications_list
            }
            
        except Exception as e:
            return {
                'success': False,
                'message': f'Error retrieving loan applications: {str(e)}',
                'applications': []
            }
    
    def update_application_status(self, application_id, new_status):
        """
        Update the status of a loan application.
        
        Args:
            application_id (int): Application ID to update
            new_status (str): New status ('pending', 'approved', 'rejected')
            
        Returns:
            dict: Result containing success status and message
        """
        try:
            conn = self._get_db_connection()
            cursor = conn.cursor()
            
            update_query = """
            UPDATE loan_applications 
            SET status = %s 
            WHERE application_id = %s
            RETURNING application_id
            """
            
            cursor.execute(update_query, (new_status, application_id))
            result = cursor.fetchone()
            
            if result:
                conn.commit()
                cursor.close()
                conn.close()
                return {
                    'success': True,
                    'message': f'Application status updated to {new_status}'
                }
            else:
                cursor.close()
                conn.close()
                return {
                    'success': False,
                    'message': 'Application not found'
                }
                
        except Exception as e:
            return {
                'success': False,
                'message': f'Error updating application status: {str(e)}'
            }


# Example usage and Flask route integration
def create_flask_routes(app, loan_service):
    """
    Create Flask routes for loan application functionality.
    
    Args:
        app: Flask application instance
        loan_service: LoanApplicationService instance
        
    Note: This function requires Flask to be imported:
        from flask import Flask, request, jsonify
    """
    from flask import request, jsonify
    
    @app.route('/api/loan-application/submit', methods=['POST'])
    def submit_loan_application():
        """Submit a loan application with JPG file upload."""
        try:
            # Get user_id from request (could be from JWT token, session, etc.)
            user_id = request.form.get('user_id')
            jpg_file = request.files.get('jpg_file')
            
            if not user_id:
                return jsonify({
                    'success': False,
                    'message': 'User ID is required'
                }), 400
            
            result = loan_service.submit_loan_application(user_id, jpg_file)
            
            if result['success']:
                return jsonify(result), 200
            else:
                return jsonify(result), 400
                
        except Exception as e:
            return jsonify({
                'success': False,
                'message': f'Server error: {str(e)}'
            }), 500
    
    @app.route('/api/loan-application/list', methods=['GET'])
    def get_loan_applications():
        """Get loan applications for a user."""
        try:
            user_id = request.args.get('user_id')
            result = loan_service.get_loan_applications(user_id)
            return jsonify(result)
            
        except Exception as e:
            return jsonify({
                'success': False,
                'message': f'Server error: {str(e)}'
            }), 500
    
    @app.route('/api/loan-application/update-status', methods=['PUT'])
    def update_application_status():
        """Update loan application status."""
        try:
            data = request.get_json()
            application_id = data.get('application_id')
            new_status = data.get('status')
            
            if not application_id or not new_status:
                return jsonify({
                    'success': False,
                    'message': 'Application ID and status are required'
                }), 400
            
            result = loan_service.update_application_status(application_id, new_status)
            return jsonify(result)
            
        except Exception as e:
            return jsonify({
                'success': False,
                'message': f'Server error: {str(e)}'
            }), 500


# Example standalone usage
if __name__ == "__main__":
    # Database configuration - Connect to staff database
    db_config = {
        'host': 'localhost',
        'database': 'slz_coop_staff',
        'user': 'postgres',
        'password': 'password',
        'port': 5432
    }
    
    # Create service instance
    loan_service = LoanApplicationService(db_config)
    
    # Example usage (this would typically be called from a web framework)
    print("Loan Application Service initialized successfully!")
    print("Use the submit_loan_application() method to process loan applications.")
