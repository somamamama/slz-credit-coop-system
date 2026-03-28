CREATE DATABASE staff_portal;

CREATE TABLE users(
    user_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_name VARCHAR(255) NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    user_password VARCHAR(255) NOT NULL,
    user_role VARCHAR(50) NOT NULL DEFAULT 'cashier',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

--INSERT TEST USERS WITH DIFFERENT ROLES

INSERT INTO users (user_name, user_email, user_password, user_role) VALUES 
('Admin User', 'admin@creditcoop.com', 'password123', 'admin'),
('Manager User', 'manager@creditcoop.com', 'password123', 'manager'),
('Loan Officer', 'loanofficer@creditcoop.com', 'password123', 'loan_officer'),
('Cashier User', 'cashier@creditcoop.com', 'password123', 'cashier'),
('IT Admin', 'itadmin@creditcoop.com', 'password123', 'it_admin');