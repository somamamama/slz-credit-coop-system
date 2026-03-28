#!/usr/bin/env python3

import psycopg2
import os
import sys

def revert_payment_references_table():
    try:
        print("Reverting payment_references table to simple structure...")
        
        # Database connection parameters
        conn_params = {
            'host': 'localhost',
            'database': 'slz_coop_staff',
            'user': 'postgres',
            'password': 'password',
            'port': 5432
        }
        
        # Connect to database
        conn = psycopg2.connect(**conn_params)
        cursor = conn.cursor()
        
        # Drop the complex table and create a simple one
        revert_sql = """
        -- Drop the complex table
        DROP TABLE IF EXISTS payment_references CASCADE;
        
        -- Create simple payment_references table
        CREATE TABLE payment_references (
            id SERIAL PRIMARY KEY,
            member_id INTEGER,
            member_name VARCHAR(255),
            image_path VARCHAR(500) NOT NULL,
            amount DECIMAL(12,2),
            reference_text TEXT,
            status VARCHAR(20) DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            confirmed_by INTEGER,
            confirmed_by_name VARCHAR(255),
            confirmed_notes TEXT,
            confirmed_at TIMESTAMP
        );
        
        -- Create indexes for better performance
        CREATE INDEX idx_payment_references_status ON payment_references(status);
        CREATE INDEX idx_payment_references_member_id ON payment_references(member_id);
        CREATE INDEX idx_payment_references_created_at ON payment_references(created_at);
        """
        
        cursor.execute(revert_sql)
        conn.commit()
        
        cursor.close()
        conn.close()
        
        print("✅ Payment references table reverted to simple structure!")
        print("")
        print("Reverted changes:")
        print("- Removed complex foreign key constraints")
        print("- Back to simple member_id and member_name fields")
        print("- No more UUID dependencies")
        print("- Simple integer-based structure")
        
        return True
        
    except psycopg2.Error as e:
        print(f"❌ Database error: {e}")
        return False
        
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

if __name__ == "__main__":
    success = revert_payment_references_table()
    sys.exit(0 if success else 1)
