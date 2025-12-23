#!/bin/bash

# Check if port 3307 is in use
PORT=3307
if lsof -i :$PORT >/dev/null 2>&1; then
    echo "Port $PORT is already in use. Killing the process..."
    # Kill the process using the port
    PID=$(lsof -t -i :$PORT)
    kill -9 $PID
    echo "Port $PORT is now free."
fi

# Load environment variables
source ../.env

# Create SSH tunnel and connect to MySQL
ssh -i ../../creds/adh-db-proxy.pem -L $PORT:$DB_URI:3306 $SSH_USERNAME@$EC2_URI -N -f

# Wait a moment for tunnel to establish
sleep 2

echo "Connected to Proxy"

# Connect to MySQL through tunnel (password will be prompted)
mysql -h 127.0.0.1 -P $PORT -u $DB_USER -p
