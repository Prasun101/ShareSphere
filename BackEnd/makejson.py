import json
from flask import Flask
from flask_pymongo import PyMongo
from bson import ObjectId
from datetime import datetime
import os

app = Flask(__name__)

# Set the MongoDB URI
app.config["MONGO_URI"] = "mongodb://localhost:27017/marketplace"

# Initialize PyMongo
mongo = PyMongo(app)

def convert_document(doc):
    """
    Convert ObjectId and datetime fields to JSON serializable formats.
    """
    # Remove the '_id' field if present
    if '_id' in doc:
        del doc['_id']
    
    for key, value in doc.items():
        if isinstance(value, ObjectId):
            # Remove ObjectId fields
            del doc[key]
        elif isinstance(value, datetime):
            # Convert datetime fields to ISO 8601 format
            doc[key] = value.isoformat()
    return doc

def export_data():
    try:
        # List all collections in the database
        collections = mongo.db.list_collection_names()

        # Create an output directory if it does not exist
        output_dir = 'exports'
        os.makedirs(output_dir, exist_ok=True)

        # Loop through each collection and retrieve its documents
        for collection_name in collections:
            collection = mongo.db[collection_name]
            documents = list(collection.find())
            
            # Convert documents to be JSON serializable
            documents = [convert_document(doc) for doc in documents]
            
            # Define the file path for this collection
            file_path = os.path.join(output_dir, f'{collection_name}.json')
            
            # Save the collection data to a JSON file
            with open(file_path, 'w') as file:
                json.dump(documents, file, indent=4)
        
            print(f"Data exported successfully for collection '{collection_name}' to '{file_path}'")
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == '__main__':
    with app.app_context():
        export_data()
