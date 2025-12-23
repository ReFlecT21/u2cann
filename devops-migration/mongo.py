from sshtunnel import SSHTunnelForwarder
from pymongo import MongoClient
from dotenv import load_dotenv
import os
from pathlib import Path

load_dotenv()

# Get absolute paths
BASE_DIR = Path(__file__).parent.parent
SSH_KEY_PATH = BASE_DIR / "creds" / "adh-db-proxy.pem"
CA_FILE_PATH = BASE_DIR / "creds" / "global-bundle.pem"

EC2_URL = os.getenv('EC2_URI')
DB_URI = os.getenv('MONGO_DB_URI')
DB_USER = os.getenv('MONGO_DB_USER')
DB_PASS = os.getenv('MONGO_DB_PASS')
SSH_USERNAME = os.getenv('SSH_USERNAME')
OLD_DB_CONNECTION_STRING = os.getenv('OLD_MONGO_DB_CONNECTION_STRING')

try:
    # Create the tunnel
    server = SSHTunnelForwarder(
        (EC2_URL, 22),
        ssh_username=SSH_USERNAME,
        ssh_pkey=str(SSH_KEY_PATH),
        remote_bind_address=(DB_URI, 27017)
    )

    # Start the tunnel
    server.start()
    print(f"SSH tunnel established on local port: {server.local_bind_port}")

    # Connect to new Database
    new_client = MongoClient(
        host='localhost',
        port=server.local_bind_port,
        username=DB_USER,
        password=DB_PASS,
        tls=True,
        tlsCAFile=str(CA_FILE_PATH),
        retryWrites=False,
        directConnection=True,
        tlsAllowInvalidHostnames=True
    )

    # Connect to old Database
    old_client = MongoClient(OLD_DB_CONNECTION_STRING)

    print("Connected to both databases")

    # Migrate all databases except system ones
    excluded_dbs = ['admin', 'local', 'config']
    BATCH_SIZE = 1000

    for db_name in old_client.list_database_names():
        if db_name in excluded_dbs:
            continue

        print(f"\nMigrating database: {db_name}")
        old_db = old_client[db_name]
        new_db = new_client[db_name]

        # Migrate all collections in the database
        for collection_name in old_db.list_collection_names():
            print(f"Migrating collection: {collection_name}")
            old_collection = old_db[collection_name]
            new_collection = new_db[collection_name]

            # Get total count for progress tracking
            total_docs = old_collection.count_documents({})
            migrated_count = 0

            # Copy documents in batches
            cursor = old_collection.find({}, batch_size=BATCH_SIZE)
            current_batch = []

            for doc in cursor:
                current_batch.append(doc)

                if len(current_batch) >= BATCH_SIZE:
                    new_collection.insert_many(current_batch)
                    migrated_count += len(current_batch)
                    print(f"Progress: {migrated_count}/{total_docs} documents")
                    current_batch = []

            # Insert remaining documents
            if current_batch:
                new_collection.insert_many(current_batch)
                migrated_count += len(current_batch)
                print(f"Progress: {migrated_count}/{total_docs} documents")

            print(f"Completed migrating {migrated_count} documents")

    print("\nMigration completed successfully!")

except Exception as e:
    print(f"Error: {e}")

finally:
    if 'server' in locals() and server.is_active:
        server.stop()
        print("SSH tunnel closed")
    if 'old_client' in locals():
        old_client.close()
    if 'new_client' in locals():
        new_client.close()
