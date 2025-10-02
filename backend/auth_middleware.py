import os
from functools import wraps
from flask import request, jsonify
from jose import jwt, JWTError
import requests
from dotenv import load_dotenv

load_dotenv()

AUTH0_DOMAIN = os.getenv('AUTH0_DOMAIN')
AUTH0_AUDIENCE = os.getenv('AUTH0_AUDIENCE')
ALGORITHMS = [os.getenv('AUTH0_ALGORITHMS', 'RS256')]

# Cache for Auth0 public keys
_jwks_cache = None

def get_auth0_public_key():
    """Fetch Auth0 public keys for JWT verification"""
    global _jwks_cache
    if _jwks_cache:
        return _jwks_cache

    jwks_url = f'https://{AUTH0_DOMAIN}/.well-known/jwks.json'
    try:
        response = requests.get(jwks_url)
        response.raise_for_status()
        _jwks_cache = response.json()
        return _jwks_cache
    except Exception as e:
        print(f"Error fetching Auth0 public keys: {e}")
        return None

def get_token_from_header():
    """Extract token from Authorization header"""
    auth_header = request.headers.get('Authorization', None)
    if not auth_header:
        return None

    parts = auth_header.split()
    if parts[0].lower() != 'bearer':
        return None
    elif len(parts) == 1:
        return None
    elif len(parts) > 2:
        return None

    return parts[1]

def verify_token(token):
    """Verify and decode JWT token"""
    try:
        jwks = get_auth0_public_key()
        if not jwks:
            return None

        # Get the key id from the token header
        unverified_header = jwt.get_unverified_header(token)
        rsa_key = {}

        # Find the matching key
        for key in jwks['keys']:
            if key['kid'] == unverified_header['kid']:
                rsa_key = {
                    'kty': key['kty'],
                    'kid': key['kid'],
                    'use': key['use'],
                    'n': key['n'],
                    'e': key['e']
                }
                break

        if not rsa_key:
            return None

        # Verify and decode the token
        payload = jwt.decode(
            token,
            rsa_key,
            algorithms=ALGORITHMS,
            audience=AUTH0_AUDIENCE,
            issuer=f'https://{AUTH0_DOMAIN}/'
        )
        return payload

    except JWTError as e:
        print(f"JWT verification error: {e}")
        return None
    except Exception as e:
        print(f"Token verification error: {e}")
        return None

def requires_auth(f):
    """Decorator to protect routes with Auth0 authentication"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = get_token_from_header()
        if not token:
            return jsonify({'error': 'No authorization token provided'}), 401

        payload = verify_token(token)
        if not payload:
            return jsonify({'error': 'Invalid or expired token'}), 401

        # Add user info to request context
        request.auth0_user = payload
        return f(*args, **kwargs)

    return decorated_function

def optional_auth(f):
    """Decorator that allows but doesn't require authentication"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = get_token_from_header()
        if token:
            payload = verify_token(token)
            if payload:
                request.auth0_user = payload
            else:
                request.auth0_user = None
        else:
            request.auth0_user = None

        return f(*args, **kwargs)

    return decorated_function
