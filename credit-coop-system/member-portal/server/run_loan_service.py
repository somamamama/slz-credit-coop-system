#!/usr/bin/env python3
"""
Run a minimal Flask wrapper for the LoanApplicationService on port 5000.

Usage:
  cd member-portal/server
  python3 run_loan_service.py

Edit the `db_config` below if your Postgres credentials differ.
"""
from flask import Flask
from loan_application_service import LoanApplicationService, create_flask_routes

app = Flask(__name__)

# Adjust DB config as needed for your environment
db_config = {
    'host': 'localhost',
    'database': 'slz_coop_staff',
    'user': 'postgres',
    'password': 'password',
    'port': 5432
}

loan_service = LoanApplicationService(db_config)
create_flask_routes(app, loan_service)

if __name__ == '__main__':
    print('Starting Loan Application Flask service on http://0.0.0.0:5000')
    app.run(host='0.0.0.0', port=5000, debug=True)
