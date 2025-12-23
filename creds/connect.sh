#!/bin/bash

if [ "$#" -ne 1 ]; then
  echo "Usage: $0 < db-proxy | app | web | db | old-prod >"
  exit 1
fi

case $1 in
  db-proxy)
    echo "Connecting to DB Proxy server..."
    ssh -i adh-db-proxy.pem ec2-user@ec2-54-179-189-250.ap-southeast-1.compute.amazonaws.com
    ;;
  app)
    echo "Connecting to App Server..."
    ssh -i adh-appserver.pem ubuntu@app.asiadealhub.com
    ;;
  web)
    echo "Connecting to Web Server..."
    ssh -i adh-webserver.pem -p 522 apps@asiadealhub.com
    ;;
  db)
    echo "Connecting to DB Server..."
    ssh -i adh-db.pem -p 522 apps@db.asiadealhub.com
    ;;
  old-prod)
    echo "Connecting to Old Prod Server..."
    ssh -i adh-old-prod.pem -p 522 apps@54.254.164.223
    ;;
  *)
    echo "Invalid argument. Use db-proxy or app or web or db or old-prod."
    exit 1
    ;;
esac