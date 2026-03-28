#!/usr/bin/env python3
import psycopg2
import os

def test_database_connection():
    try:
        # Database connection
        conn = psycopg2.connect(
            host="localhost",
            database="staff_coop_staff",
            user="postgres",
            password="password",
            port=5432
        )
        
        cursor = conn.cursor()
        
        # Check if membership_applications table exists
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'membership_applications'
        """)
        
        result = cursor.fetchone()
        
        if result:
            print("✅ Database connection successful!")
            print("✅ membership_applications table exists")
            
            # Check table structure
            cursor.execute("""
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'membership_applications'
                ORDER BY ordinal_position
                LIMIT 10
            """)
            
            columns = cursor.fetchall()
            print(f"✅ Table has {len(columns)} columns (showing first 10):")
            for col in columns[:10]:
                print(f"   - {col[0]} ({col[1]})")
                
        else:
            print("❌ membership_applications table does not exist")
            print("Creating table...")
            
            # Read and execute the SQL file
            sql_file_path = "/home/soma/Documents/credit-coop-system/credit-coop-system/landing-page/server/membership_applications.sql"
            
            if os.path.exists(sql_file_path):
                with open(sql_file_path, 'r') as file:
                    sql_content = file.read()
                    cursor.execute(sql_content)
                    conn.commit()
                    print("✅ Table created successfully!")
            else:
                print("❌ SQL file not found")
        
        cursor.close()
        conn.close()
        
        return True
        
    except psycopg2.Error as e:
        print(f"❌ Database error: {e}")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    test_database_connection()