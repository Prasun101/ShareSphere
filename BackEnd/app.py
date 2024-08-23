from flask import Flask, request, jsonify, g, send_from_directory
from flask_cors import CORS
from flask_pymongo import PyMongo
from bson.objectid import ObjectId
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash, check_password_hash
from flask_socketio import SocketIO, emit, join_room, leave_room
import jwt
import datetime
import os
from functools import wraps
import logging
import stripe



app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)
app.config["MONGO_URI"] = "mongodb://localhost:27017/marketplace"
mongo = PyMongo(app)
SECRET_KEY = 'jxa7twkcVglVoZQcB5Lr3etwEGTfOUdBIFNd2qFNXj4'
socketio = SocketIO(app, cors_allowed_origins="*")
stripe.api_key = 'sk_test_51PlEjbP5jAgM3OlZZqgRjagEh1WLmNFYee2wGysLWwK8wnYvZzpP7O9u30HzbtIXG8n93HFfFBl0jg52I85woKOn00fC5bdJD0'

UPLOAD_FOLDER = './Uploaded_productImages'
PROFILE_FOLDER = './Uploaded_profilePictures'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['PROFILE_FOLDER'] = PROFILE_FOLDER


class ActivityTypes:
    
    PRODUCT_ADDED = 'product_added'
    PRODUCT_DELETED = 'product_deleted'
    PRODUCT_UPDATED = 'product_updated'
    PRODUCT_SAVED = 'product_saved'
    PROFILE_UPDATED = 'profile_updated'
    MESSAGE_RECEIVED = 'message_received'

def log_activity(user_id,username,profile_picture, activity_type, activity_details, other_user_id=None):
    """Logs user activity in the activities collection."""
    
    # If another user is involved, fetch their details
    other_user_details = None
    if other_user_id:
        other_user = mongo.db.users.find_one({'_id': ObjectId(other_user_id)}, {'username': 1, 'profile_picture': 1})
        if other_user:
            other_user_details = {
                'username': other_user.get('username'),
                'profile_picture': other_user.get('profile_picture')
            }

    # Insert the activity log into the database
    mongo.db.activities.insert_one({
        'user_id': user_id, 
        'username':username,
        'profile_picture': profile_picture,
        'activity_type': activity_type,
        'activity_details': activity_details,
        'other_user_details': other_user_details, 
        'timestamp': datetime.datetime.utcnow()
    })
@app.route('/')
def home():
    return "Test API"


@app.route('/uploads/products/<path:filename>', methods=['GET'])
def serve_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/uploads/profiles/<path:filename>', methods=['GET'])
def serve_profile_picture(filename):
    return send_from_directory(app.config['PROFILE_FOLDER'], filename)

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    users = mongo.db.users
    existing_user = users.find_one({'email': data['email']})
    if existing_user:
        return jsonify({"message": "Email already exists! Please use a different email."}), 400

    hashed_password = generate_password_hash(data['password'], method='sha256')
    user_data = {
        'username': data['username'],
        'email': data['email'],
        'password': hashed_password
    }
    
    if data.get('isSeller'):
        user_data['seller_id'] = data['uniqueID']
    
    user_id = users.insert_one(user_data).inserted_id
    
    return jsonify({"message": "User registered successfully!", "user_id": str(user_id)}), 201



@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    users = mongo.db.users
    user = users.find_one({'username': data['username']})

    if not user or not check_password_hash(user['password'], data['password']):
        return jsonify({"message": "Invalid Username or password!"}), 401

    is_seller = data.get('isSeller', False)

    if is_seller:
        seller_id = data.get('uniqueID')
        if 'seller_id' not in user or user['seller_id'] != seller_id:
            return jsonify({"message": "Invalid seller ID!"}), 401

    token = jwt.encode({
        'user_id': str(user['_id']),
        'exp': datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=24)
    }, SECRET_KEY, algorithm='HS256')

    return jsonify({"token": token})


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token or not isinstance(token, str) or not token.startswith('Bearer '):
            return jsonify({"message": "Token is missing!"}), 403
        token_value = token.split()[1]
        try:
            data = jwt.decode(token_value, SECRET_KEY, algorithms=['HS256'])
            current_user = mongo.db.users.find_one({'_id': ObjectId(data['user_id'])})
            g.user_id = str(data['user_id'])
        except jwt.ExpiredSignatureError:
            return jsonify({"message": "Token has expired!"}), 403
        except Exception:
            return jsonify({"message": "Token is invalid!"}), 403
        return f(current_user, *args, **kwargs)
    return decorated

@app.route('/products', methods=['POST'])
@token_required
def create_product(current_user):
    required_fields = ['title', 'description', 'price', 'category', 'image']
    for field in required_fields:
        if field not in request.form and field not in request.files:
            return jsonify({"message": f"Missing required field: {field}"}), 400
    title = request.form['title']
    description = request.form['description']
    price = float(request.form['price'])
    category = request.form['category']
    image_file = request.files['image']
    try:
        filename = secure_filename(image_file.filename)
        image_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        image_file.save(image_path)
        products = mongo.db.products
        product_id = products.insert_one({
            'title': title,
            'description': description,
            'price': price,
            'category': category,
            'user_id': g.user_id,
            'image_path': filename,
            'created_at': datetime.datetime.now(datetime.timezone.utc)
        }).inserted_id
        return jsonify({"message": "Product created successfully!", "product_id": str(product_id)}), 201
    except Exception as e:
        return jsonify({"message": f"Failed to create product: {str(e)}"}), 500

@app.route('/sellproducts', methods=['GET'])
def get_sellproducts():
    try:
        products = mongo.db.products.find({'price': {'$ne': None, '$gt': 0}})
        product_list = []
        for product in products:
            # Determine the inventory status
            is_in_cart = mongo.db.carts.find_one({'items.product_id': product['_id']}) is not None
            inventory_status = 'out of stock' if is_in_cart else 'in stock'
            
            # Fetch the user details
            user = mongo.db.users.find_one({'_id': ObjectId(product['user_id'])}, {'username': 1, 'profile_picture': 1})
            if user:
                product['id'] = str(product.pop('_id'))
                product['user'] = {
                    'id': str(user['_id']) if user else 'Unknown',
                    'username': user['username'],
                    'profile_picture': user.get('profile_picture', None)
                }
            else:
                product['user'] = {
                    'id': str(user['_id']) if user else 'Unknown',
                    'username': 'Unknown',
                    'profile_picture': None
                }

            # Normalize image paths
            product['image_path'] = product['image_path'].replace('\\', '/')
            if product['user']['profile_picture']:
                product['user']['profile_picture'] = product['user']['profile_picture'].replace('\\', '/')
            
            product['image_url'] = f"http://localhost:5000/uploads/products/{product['image_path']}"
            if product['user']['profile_picture']:
                product['user']['profile_picture'] = f"http://localhost:5000/uploads/profiles/{product['user']['profile_picture']}"

            # Add the inventory status to the product info
            product['inventoryStatus'] = inventory_status

            product_list.append(product)
        
        return jsonify(product_list), 200
    except Exception as e:
        return jsonify({"message": f"Failed to fetch products: {str(e)}"}), 500


@app.route('/save/<product_id>', methods=['POST'])
@token_required
def save_product(current_user, product_id):
    try:
        product_oid = ObjectId(product_id)
    except Exception as e:
        return jsonify({"message": "Invalid product ID format"}), 400

    saved_products = mongo.db.savedproducts
    if saved_products.find_one({'user_id': g.user_id, 'product_id': product_oid}):
        return jsonify({"message": "Product already saved"}), 400

    saved_products.insert_one({
        'user_id': g.user_id,
        'product_id': product_oid,
        'saved_at': datetime.datetime.now(datetime.timezone.utc)
    })

    # Fetch product details for logging
    product = mongo.db.products.find_one({'_id': product_oid}, {'title': 1, 'category': 1, 'user_id': 1})
    if product:
        # Ensure that username and profile_picture are available in g
        user_details = mongo.db.users.find_one({'_id': ObjectId(g.user_id)}, {'username': 1, 'profile_picture': 1})
        if user_details:
            g.username = user_details.get('username')
            g.profile_picture = user_details.get('profile_picture')

        # Log the product save activity
        log_activity(
            user_id=g.user_id,
            username=g.username,
            profile_picture=g.profile_picture,
            activity_type=ActivityTypes.PRODUCT_SAVED,
            activity_details={
                'product_id': product_id,
                'title': product.get('title'),
                'category': product.get('category')
            },
            other_user_id=product.get('user_id')  # Log the owner of the product
        )

    return jsonify({"message": "Product saved"}), 200


@app.route('/save/<product_id>', methods=['DELETE'])
@token_required
def unsave_product(current_user, product_id):
    try:
        product_oid = ObjectId(product_id)
    except Exception as e:
        return jsonify({"message": "Invalid product ID format"}), 400
    saved_products = mongo.db.savedproducts
    result = saved_products.delete_one({'user_id': g.user_id, 'product_id': product_oid})
    if result.deleted_count == 1:
        return jsonify({"message": "Product unsaved"}), 200
    return jsonify({"message": "Product not found in saved list"}), 400

@app.route('/savedproducts', methods=['GET'])
@token_required
def get_saved_products(current_user):
    try:
        # Fetch saved product records for the current user
        saved_products = mongo.db.savedproducts.find({'user_id': g.user_id})
        product_ids = [saved['product_id'] for saved in saved_products]
        
        # Fetch the actual product details from the products collection
        products = mongo.db.products.find({'_id': {'$in': [ObjectId(pid) for pid in product_ids]}})
        product_list = []

        for product in products:
            # Get the user who added the product
            user = mongo.db.users.find_one({'_id': ObjectId(product['user_id'])}, {'username': 1, 'profile_picture': 1})

            # Prepare the product dictionary
            product_info = {
                'id': str(product['_id']),
                'title': product.get('title', ''),
                'description': product.get('description', ''),
                'image_path': product.get('image_path', None),
        
                'inventoryStatus': product.get('inventoryStatus', 'Still Available'),
                'price': product.get('price', 0),
                'category': product.get('category', ''),
                'created_at': product.get('created_at', '').strftime('%a, %d %b %Y %H:%M:%S GMT') if product.get('created_at') else '',
                'user': {
                    'id': str(user['_id']) if user else 'Unknown',
                    'username': user['username'] if user else 'Unknown',
                    'profile_picture':  user.get('profile_picture', None) if user else None
                },
                'user_id': str(product['user_id'])
            }

            product_list.append(product_info)

        return jsonify(product_list), 200

    except Exception as e:
        return jsonify({"message": f"Failed to fetch products: {str(e)}"}), 500


@app.route('/freeproducts', methods=['GET'])
def get_freeproducts():
    try:
        products = mongo.db.products.find({'price': 0})
        product_list = []
        for product in products:
            # Get the user who added the product
            user = mongo.db.users.find_one({'_id': ObjectId(product['user_id'])}, {'username': 1, 'profile_picture': 1})

            # Check if the product is in any cart
            is_in_cart = mongo.db.messages.find_one({'messages.message.product_id': product['_id']}) is not None

            # Prepare product dictionary
            product_info = {
                'id': str(product['_id']),
                'title': product['title'],
                'description': product['description'],
                
                'image_path': product.get('image_path', None),
                'inventoryStatus': 'Someone is Interested' if is_in_cart else 'Still Available',
                'user': {
                    'id': str(user['_id']) if user else 'Unknown',
                    'username': user['username'] if user else 'Unknown',
                    'profile_picture': user.get('profile_picture', None) if user else None
                }
            }

            product_list.append(product_info)

        return jsonify(product_list), 200
    except Exception as e:
        return jsonify({"message": f"Failed to fetch products: {str(e)}"}), 500
    

@app.route('/activities', methods=['GET'])
@token_required
def get_activities(current_user):
    try:
        activities = mongo.db.activities.find().sort('timestamp', -1)
        activity_list = []
        for activity in activities:
            activity['_id'] = str(activity['_id'])
            activity['timestamp'] = activity['timestamp'].isoformat()
            activity_list.append(activity)
        return jsonify(activity_list), 200
    except Exception as e:
        return jsonify({"message": f"Failed to fetch activities: {str(e)}"}), 500

@app.route('/myproducts', methods=['GET'])
@token_required
def get_my_products(current_user):
    try:
        # Fetch the products created by the logged-in user
        products = mongo.db.products.find({'user_id': g.user_id})
        product_list = []

        for product in products:
            # Check if the product is in any messages (e.g., someone is interested)
            is_in_cart = mongo.db.messages.find_one({'messages.message.product_id': product['_id']}) is not None

            # Prepare the product information
            product_info = {
                'id': str(product['_id']),
                'title': product['title'],
                'description': product['description'],
                'price': product['price'],
                'image_path': product.get('image_path', None),
                'inventoryStatus': 'Someone is Interested' if is_in_cart else 'Still Available',
                'user': {
                    'id': str(current_user['_id']),
                    'username': current_user['username'],
                    'profile_picture': current_user.get('profile_picture', None)
                }
            }

            product_list.append(product_info)

        return jsonify(product_list), 200
    except Exception as e:
        return jsonify({"message": f"Failed to fetch products: {str(e)}"}), 500

@app.route('/products/<product_id>', methods=['PUT'])
@token_required
def update_product(product_id):
    try:
        product = mongo.db.products.find_one({'_id': ObjectId(product_id)})
        if not product:
            return jsonify({'message': 'Product not found'}), 404
        
        title = request.form.get('title')
        category = request.form.get('category')
        description = request.form.get('description')
        update_data = {}
        if title:
            update_data['title'] = title
        if category:
            update_data['category'] = category
        if description:
            update_data['description'] = description
        if 'image' in request.files:
            image_file = request.files['image']
            if image_file:
                filename = secure_filename(image_file.filename)
                image_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                image_file.save(image_path)
                update_data['image_path'] = filename
        mongo.db.products.update_one({'_id': ObjectId(product_id)}, {'$set': update_data})


        user_details = mongo.db.users.find_one({'_id': ObjectId(g.user_id)}, {'username': 1, 'profile_picture': 1})
        if user_details:
            g.username = user_details.get('username')
            g.profile_picture = user_details.get('profile_picture')
        log_activity(
            user_id=g.user_id, 
            username=g.username,
            profile_picture=g.profile_picture,
            activity_type=ActivityTypes.PRODUCT_UPDATED, 
            activity_details={
                'product_id': product_id, 
                'title': title if title else product.get('title'),
                'category': category if category else product.get('category'),
                'description': description if description else product.get('description')
            }
        )

        return jsonify({'message': 'Product updated successfully'}), 200

    except Exception as e:
        return jsonify({'message': f'Failed to update product: {str(e)}'}), 500



@app.route('/products/<product_id>', methods=['DELETE'])
@token_required
def delete_product(current_user, product_id):
    try:
        product = mongo.db.products.find_one({'_id': ObjectId(product_id)})
        if product is None:
            return jsonify({"message": "Product not found!"}), 404
        
        if str(product['user_id']) != str(g.user_id):
            return jsonify({"message": "You are not authorized to delete this product!"}), 403
        
        result = mongo.db.products.delete_one({'_id': ObjectId(product_id)})
        if result.deleted_count == 1:
            log_activity(g.user_id, ActivityTypes.PRODUCT_DELETED, {'product_id': product_id, 'title': product['title']})
            return jsonify({"message": "Product deleted successfully!"})
        else:
            return jsonify({"message": "Failed to delete product!"}), 500
    
    except Exception as e:
        logging.error(f"An error occurred while deleting product {product_id}: {str(e)}")
        return jsonify({"message": f"An error occurred: {str(e)}"}), 500


@app.route('/products/<product_id>', methods=['GET'])
def get_product(product_id):
    try:
        product = mongo.db.products.find_one({'_id': ObjectId(product_id)})
        if not product:
            return jsonify({"message": "Product not found!"}), 404
        user = mongo.db.users.find_one({'_id': ObjectId(product['user_id'])}, {'username': 1, 'profile_picture': 1})
        if user:
            product['_id'] = str(product['_id'])
            product['user'] = {
                'username': user['username'],
                'profile_picture': user.get('profile_picture', None)
            }
        else:
            product['user'] = {
                'username': 'Unknown',
                'profile_picture': None
            }
        return jsonify(product), 200
    except Exception as e:
        return jsonify({"message": f"Failed to fetch product: {str(e)}"}), 500

@app.route('/update_profile', methods=['POST'])
@token_required
def update_profile(current_user):
    try:
        if not request.form and 'profile_picture' not in request.files:
            return jsonify({"message": "No data provided"}), 400
        
        update_data = {}
        
        if 'username' in request.form:
            new_username = request.form['username']
            
            update_data['username'] = new_username
        
        if 'first_name' in request.form:
            update_data['first_name'] = request.form['first_name']
        if 'last_name' in request.form:
            update_data['last_name'] = request.form['last_name']
        if 'email' in request.form:
            update_data['email'] = request.form['email']
        if 'birthday' in request.form:
            try:
                update_data['birthday'] = datetime.datetime.strptime(request.form['birthday'], '%Y-%m-%d')
            except ValueError:
                return jsonify({"message": "Invalid birthday format, expected YYYY-MM-DD"}), 400
        if 'address' in request.form:
            update_data['address'] = request.form['address']
        if 'phone' in request.form:
            update_data['phone'] = request.form['phone']
        
        if 'profile_picture' in request.files:
            profile_picture = request.files['profile_picture']
            filename = secure_filename(profile_picture.filename)
            profile_picture_path = os.path.join(app.config['PROFILE_FOLDER'], filename)
            profile_picture.save(profile_picture_path)
            update_data['profile_picture'] = filename
        
        if not update_data:
            return jsonify({"message": "No fields to update"}), 400
        
        mongo.db.users.update_one(
            {'_id': ObjectId(g.user_id)},
            {'$set': update_data}
        )
        
        return jsonify({"message": "Profile updated successfully"}), 200
    
    except Exception as e:
        logging.error(f"Failed to update profile: {str(e)}")
        return jsonify({"message": f"Failed to update profile: {str(e)}"}), 500

@app.route('/current_user', methods=['GET'])
@token_required
def get_current_user(current_user):
    user_data = {
        'user_id': str(current_user['_id']),
        'username': current_user['username'],
        'first_name': current_user.get('first_name', ''),
        'last_name': current_user.get('last_name', ''),
        'address': current_user.get('address', ''),
        'email': current_user['email'],
        'phone': current_user.get('phone', ''),
        'birthday': current_user.get('birthday', '').strftime('%Y-%m-%d') if current_user.get('birthday') else '',
        'profile_picture': current_user.get('profile_picture', '')
    }
    
    if 'seller_id' in current_user:
        user_data['seller_id'] = current_user['seller_id']

    return jsonify(user_data), 200



def socket_token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.args.get('token') or request.headers.get('Authorization')
        if not token or not isinstance(token, str) or not token.startswith('Bearer '):
            emit('error', {'message': 'Token is missing or invalid!'}, broadcast=True)
            return
        token_value = token.split()[1]
        try:
            data = jwt.decode(token_value, SECRET_KEY, algorithms=['HS256'])
            current_user = mongo.db.users.find_one({'_id': ObjectId(data['user_id'])})
            g.user_id = str(data['user_id'])
        except jwt.ExpiredSignatureError:
            emit('error', {'message': 'Token has expired!'}, broadcast=True)
            return
        except Exception as e:
            emit('error', {'message': f'Token is invalid: {str(e)}'}, broadcast=True)
            return
        return f(current_user, *args, **kwargs)
    return decorated
@app.route('/freeproducts/<product_id>', methods=['PUT'])
@token_required
def update_freeproduct(current_user, product_id):
    try:
        product = mongo.db.products.find_one({'_id': ObjectId(product_id)})
        if not product:
            return jsonify({'message': 'Product not found'}), 404

        title = request.form.get('title')
        description = request.form.get('description')

        update_data = {}
        if title:
            update_data['title'] = title
        if description:
            update_data['description'] = description

        if 'image' in request.files:
            image_file = request.files['image']
            if image_file:
                filename = secure_filename(image_file.filename)
                image_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                image_file.save(image_path)
                update_data['image_path'] = filename

        mongo.db.products.update_one({'_id': ObjectId(product_id)}, {'$set': update_data})

        # Log activity
        user_details = mongo.db.users.find_one({'_id': ObjectId(g.user_id)}, {'username': 1, 'profile_picture': 1})
        log_activity(
            user_id=g.user_id,
            username=user_details.get('username'),
            profile_picture=user_details.get('profile_picture'),
            activity_type=ActivityTypes.PRODUCT_UPDATED,
            activity_details={
                'product_id': product_id,
                'title': title if title else product.get('title'),
                'description': description if description else product.get('description')
            }
        )

        return jsonify({'message': 'Product updated successfully'}), 200

    except Exception as e:
        return jsonify({'message': f'Failed to update product: {str(e)}'}), 500
@app.route('/search', methods=['GET'])
def search_products():
    query = request.args.get('q', '')  # Get the search query from the URL parameters
    if not query:
        return jsonify({'message': 'Search query missing'}), 400
    
    try:
        # Search for products whose title contains the query string, case-insensitive
        products = mongo.db.products.find({'title': {'$regex': query, '$options': 'i'}})
        
        product_list = []
        for product in products:
            product_info = {
                'id': str(product['_id']),
                'title': product['title'],
                'description': product.get('description', ''),
                'price': product.get('price', 0),
                'image_path': product.get('image_path', None),
                'category': product.get('category', 'Uncategorized')
            }
            product_list.append(product_info)
        
        return jsonify(product_list), 200

    except Exception as e:
        return jsonify({'message': f'Failed to search products: {str(e)}'}), 500


@app.route('/create-checkout-session', methods=['POST'])
@socket_token_required
def create_checkout_session(current_user):
    try:
        cart = mongo.db.carts.find_one({'user_id': ObjectId(g.user_id)})
        if not cart:
            return jsonify({"message": "Cart not found"}), 404
        cart_items = cart['items']

        line_items = []
        for item in cart_items:
            product_id = ObjectId(item['product_id'])
            product = mongo.db.products.find_one({'_id': product_id})
            if product:
                line_items.append({
                    'price_data': {
                        'currency': 'GBP',
                        'product_data': {
                            'name': product['title'],
                            'images': [f"http://127.0.0.1:5000/uploads/products/{product['image_path']}"]
                        },
                        'unit_amount': int(product['price'] * 100)  # Convert price to cents
                    },
                    'quantity': item['quantity']
                })

        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=line_items,
            mode='payment',
            success_url='http://localhost:4200/success?session_id={CHECKOUT_SESSION_ID}',
            cancel_url='http://localhost:4200/cancel'
        )

        return jsonify({'id': session.id})
    except Exception as e:
        return jsonify(error=str(e)), 403

@app.route('/create-ads-checkout-session', methods=['POST'])
@socket_token_required
def create_ads_checkout_session(current_user):
    try:
        data = request.get_json()
        plan_type = data.get('plan_type')
        ad_plans = {
            'basic': {
                'name': 'Basic Plan',
                'price': 1999  
            },
            'standard': {
                'name': 'Standard Plan',
                'price': 4999 
            },
            'premium': {
                'name': 'Premium Plan',
                'price': 9999  
            }
        }
        if plan_type not in ad_plans:
            return jsonify({"message": "Invalid plan type"}), 400
        plan = ad_plans[plan_type]
        line_items = [{
            'price_data': {
                'currency': 'GBP',
                'product_data': {
                    'name': plan['name']
                },
                'unit_amount': plan['price']
            },
            'quantity': 1
        }]
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=line_items,
            mode='payment',
            success_url='http://localhost:4200/success?session_id={CHECKOUT_SESSION_ID}',
            cancel_url='http://localhost:4200/cancel'
        )
        return jsonify({'id': session.id})
    except Exception as e:
        return jsonify({"message": f"Failed to create checkout session: {str(e)}"}), 500


@app.route('/send_message', methods=['POST'])
@socket_token_required
def send_message(current_user):
    data = request.get_json()
    recipient_id = data.get('recipient_id')
    message = data.get('message')
    sender_id = g.user_id
    if not recipient_id or not message:
        return jsonify({"message": "Missing recipient or message"}), 400
    try:
        message_data = {
            'sender_id': sender_id,
            'recipient_id': recipient_id,
            'message': message,
            'timestamp': datetime.datetime.now(datetime.timezone.utc)
        }
        mongo.db.messages.insert_one(message_data)
        socketio.emit('private_message', {
            'sender_id': sender_id,
            'recipient_id': recipient_id,
            'message': message,
            'timestamp': message_data['timestamp'].isoformat()
        }, room=recipient_id)
        return jsonify({"message": "Message sent"}), 200
    except Exception as e:
        return jsonify({"message": f"Failed to send message: {str(e)}"}), 500
@app.route('/sendproductmessage', methods=['POST'])
@socket_token_required
def sendproductmessage(current_user):
    try:
        data = request.get_json()
        recipient_id = data.get('recipient_id')
        product_id = data.get('product_id')
        product_title = data.get('product_title')
        product_description = data.get('product_description')
        product_image_path = data.get('product_image_path')

        if not recipient_id or not product_id or not product_title or not product_description or not product_image_path:
            return jsonify({"message": "Missing recipient, product, or product details"}), 400
        message = {
            'product_id': product_id,
            'title': product_title,
            'description': product_description,
            'image': product_image_path
            
        }

        message_data = {
            'sender_id': g.user_id,
            'recipient_id': recipient_id,
            'message': message,
            'timestamp': datetime.datetime.now(datetime.timezone.utc)
        }

        mongo.db.messages.insert_one(message_data)

        # Notify the recipient via Socket.IO
        socketio.emit('private_message', {
            'sender_id': g.user_id,
            'recipient_id': recipient_id,
            'message': message,
            'timestamp': message_data['timestamp'].isoformat()
        }, room=recipient_id)

        return jsonify({"message": "Message sent"}), 200
    except Exception as e:
        return jsonify({"message": f"Failed to send message: {str(e)}"}), 500
    

@socketio.on('connect')
def handle_connect():
    print(f"User connected: {request.sid}")

@socketio.on('disconnect')
def handle_disconnect():
    print(f"User disconnected: {request.sid}")

@socketio.on('join')
@socket_token_required
def handle_join(current_user, data):
    room = data.get('room')
    join_room(room)
    emit('status', {'msg': f'{current_user["username"]} has entered the room.'}, room=room)

@socketio.on('leave')
@socket_token_required
def handle_leave(current_user, data):
    room = data.get('room')
    leave_room(room)
    emit('status', {'msg': f'{current_user["username"]} has left the room.'}, room=room)

@socketio.on('private_message')
@socket_token_required
def handle_private_message(current_user, data):
    recipient_id = data.get('recipient_id')
    message = data.get('message')
    sender_id = g.user_id if hasattr(g, 'user_id') else 'Anonymous'

    print(f"Handling private message: {sender_id} -> {recipient_id}: {message}")  # Debugging statement

    # Save the message in the database
    try:
        mongo.db.messages.insert_one({
            'sender_id': sender_id,
            'recipient_id': recipient_id,
            'message': message,
            'timestamp': datetime.datetime.now(datetime.timezone.utc)
        })
        print("Message saved to database")  # Debugging statement
    except Exception as e:
        print(f"Failed to save message to database: {str(e)}")  # Debugging statement

    emit('private_message', {
        'sender_id': sender_id,
        'recipient_id': recipient_id,
        'message': message,
        'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat()
    }, room=recipient_id)
    print("Message emitted to recipient")  # Debugging statement


@app.route('/messages/<recipient_id>', methods=['GET'])
@socket_token_required
def get_messages(current_user, recipient_id):
    messages = mongo.db.messages.find({
        '$or': [
            {'sender_id': g.user_id, 'recipient_id': recipient_id},
            {'sender_id': recipient_id, 'recipient_id': g.user_id}
        ]
    }).sort('timestamp', 1)
    message_list = []
    for message in messages:
        sender = mongo.db.users.find_one({'_id': ObjectId(message['sender_id'])}, {'username': 1})
        message_list.append({
            'sender_id': message['sender_id'],
            'sender_username': sender['username'] if sender else 'Anonymous',
            'message': message['message'],
            'timestamp': message['timestamp'].isoformat()
        })
    return jsonify(message_list), 200

@app.route('/users', methods=['GET'])
@token_required
def get_all_users(current_user):
    users = mongo.db.users.find({}, {'username': 1, 'email': 1, 'profile_picture': 1})
    user_list = []
    for user in users:
        if str(user['_id']) != g.user_id:
            user['_id'] = str(user['_id'])
            user_list.append(user)
    return jsonify({'users': user_list}), 200


@app.route('/cart/add', methods=['POST'])
@token_required
def add_to_cart(current_user):
    try:
        data = request.get_json()
        product_id = data.get('product_id')
        quantity = data.get('quantity', 1)

        if not product_id:
            return jsonify({"message": "Product ID is required"}), 400
        
        cart = mongo.db.carts.find_one({"user_id": ObjectId(g.user_id)})
        if cart:
            # Update existing cart
            for item in cart['items']:
                if item['product_id'] == ObjectId(product_id):
                    item['quantity'] += quantity
                    break
            else:
                cart['items'].append({
                    "product_id": ObjectId(product_id),
                    "quantity": quantity
                })
            mongo.db.carts.update_one({"user_id": ObjectId(g.user_id)}, {"$set": {"items": cart['items']}})
        else:
            # Create new cart
            mongo.db.carts.insert_one({
                "user_id": ObjectId(g.user_id),
                "items": [{"product_id": ObjectId(product_id), "quantity": quantity}]
            })
        
        return jsonify({"message": "Item added to cart"}), 200
    except Exception as e:
        return jsonify({"message": f"Failed to add item to cart: {str(e)}"}), 500

@app.route('/cart/remove', methods=['POST'])
@token_required
def remove_from_cart(current_user):
    try:
        data = request.get_json()
        product_id = data.get('product_id')
        
        if not product_id:
            return jsonify({"message": "Product ID is required"}), 400
        
        cart = mongo.db.carts.find_one({"user_id": ObjectId(g.user_id)})
        if cart:
            cart['items'] = [item for item in cart['items'] if item['product_id'] != ObjectId(product_id)]
            mongo.db.carts.update_one({"user_id": ObjectId(g.user_id)}, {"$set": {"items": cart['items']}})
            return jsonify({"message": "Item removed from cart"}), 200
        else:
            return jsonify({"message": "Cart not found"}), 404
    except Exception as e:
        return jsonify({"message": f"Failed to remove item from cart: {str(e)}"}), 500

@app.route('/cart', methods=['GET'])
@token_required
def get_cart_items(current_user):
    try:
        logging.debug(f"Fetching cart items for user_id: {g.user_id}")
        cart = mongo.db.carts.find_one({'user_id': ObjectId(g.user_id)})
        if not cart:
            return jsonify({'items': []}), 200

        items = []
        for item in cart.get('items', []):
            product_id = item.get('product_id')
            if not product_id:
                logging.warning(f"Cart item missing 'product_id': {item}")
                continue
            product = mongo.db.products.find_one({'_id': ObjectId(product_id)})
            if product:
                logging.debug(f"Found product: {product}")
                items.append({
                    'product': {
                        '_id': str(product['_id']),
                        'title': product['title'],
                        'image_path': product.get('image_path', ''),
                        'price': product['price'],
                        'category': product.get('category', 'uncategorized')  # Include category
                    },
                    'quantity': item.get('quantity', 1)  # Default quantity to 1 if not present
                })
            else:
                logging.warning(f"Product not found for product_id: {product_id}")
        return jsonify({'items': items}), 200
    except Exception as e:
        logging.error(f"Error fetching cart items: {str(e)}")
        return jsonify({"message": "Failed to fetch cart items", "error": str(e)}), 500


if __name__ == '__main__':
    socketio.run(app, debug=True)