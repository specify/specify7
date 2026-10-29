import uuid

import jwt

from datetime import datetime, timezone, timedelta
from typing import Literal, cast

from django import http
from django.contrib.auth import authenticate
from django.conf import settings

from specifyweb.specify.models import Collection, Specifyuser
from specifyweb.backend.cache.redis.connect import RedisConnection, RedisString
from specifyweb.backend.context.views import has_collection_access

DEFAULT_AUTH_LIFESPAN_SECONDS = 1800

# See https://pyjwt.readthedocs.io/en/latest/api.html#jwt.decode
AUTH_JWT_DECODE_OPTIONS: jwt.types.Options = {
    "require": ["iat", "exp", "jti"],
    "verify_signature": True,
    "verify_iat": True,
    "verify_exp": True
}

AUTH_TOKEN_ALGORITHMS = ["HS256"]


def generate_access_token(user, collection_id: int, expires_in: int = DEFAULT_AUTH_LIFESPAN_SECONDS):
    jti = str(uuid.uuid4())

    jwt_payload = {
        "sub": str(user.id),
        "username": user.name,
        "collection": collection_id,
        "jti": jti,
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(seconds=expires_in)
    }
    token = jwt.encode(jwt_payload, settings.SECRET_KEY,
                       algorithm=AUTH_TOKEN_ALGORITHMS[0])
    return token


def revoke_access_token(token: dict):
    """
    Accepts and revokes a decoded JWT Auth Token.
    Specifically, stores the token in a "blacklist" in Redis for the remaining
    time of the token.
    The JWT Auth Middleware checks to see if the token is blacklisted during
    authorization
    """
    required_claims = ("jti", "exp")
    if not all(k in token for k in required_claims):
        raise ValueError(f"Token missing required claims: {required_claims}")
    jti = token["jti"]
    expires_at = token["exp"]
    current_time = int(datetime.now(timezone.utc).timestamp())
    blacklist_ttl = expires_at - current_time
    redis_string = RedisString(RedisConnection())
    token_key = f"revoked:{jti}"
    redis_string.set(token_key, "true", time_to_live=blacklist_ttl)


def get_token_from_request(request) -> Literal[False] | None | dict:
    auth_header = request.headers.get("Authorization")
    if auth_header is None or not auth_header.startswith("Bearer "):
        return None

    encoded_token = auth_header.split(" ")[1]

    try:
        token = jwt.decode(encoded_token, settings.SECRET_KEY,
                           options=AUTH_JWT_DECODE_OPTIONS, algorithms=AUTH_TOKEN_ALGORITHMS)
    except jwt.exceptions.InvalidTokenError:
        return False
    return token


def token_is_revoked(token: dict):
    token_identifier = token["jti"]
    redis_string = RedisString(RedisConnection())
    token_key = f"revoked:{token_identifier}"
    return redis_string.exists(token_key)

class ACCESS_TOKEN_GRANT_TYPE:
    # The client provides the server with a username, password, and collection
    # id
    PASSWORD = "password"

def handle_password_token_grant(request: http.HttpRequest) -> http.HttpResponse:
    """
    The client indiciated they want to authenticate using username and password.
    They should have also provided a collection id to scope the token to.

    See Section 4.3 of RFC 6749 for more information about this specific grant
    type according to the OAuth 2.0 Framework:
        https://www.rfc-editor.org/info/rfc6749/#section-4.3
    """
    username = request.POST.get("username")
    password = request.POST.get("password")
    raw_collection_id = request.POST.get("collectionid")
    raw_expires_in = request.POST.get("expires", DEFAULT_AUTH_LIFESPAN_SECONDS)

    if None in (username, password, raw_collection_id):
        error_response = {
            "error": "invalid_request",
            "error_description": "username, password, and collectionid are required"
        }
        return http.JsonResponse(error_response, status=400)

    try:
        expires_in = int(raw_expires_in)
        if expires_in <= 0:
            error_response = {
                "error": "invalid_request",
                "error_description": "Token expiry time must be greater than 0"
            }
            return http.JsonResponse(error_response, status=400)
    except ValueError:
        error_response = {
            "error": "invalid_request",
            "error_description": "Expiry time could not be parsed as integer"
        }
        return http.JsonResponse(error_response, status=400)

    try:
        # We know that the raw_collection_id can not be NONE here as that was
        # caught by the first check for username, password, and collectionid
        # In the worst case scenario where the above check is changed and this
        # can be None, this will raise TypeError
        collection_id = int(cast(str, raw_collection_id))
    except ValueError:
        error_response = {
            "error": "invalid_request",
            "error_description": "Collection ID could not be parsed as integer"
        }
        return http.JsonResponse(error_response, status=400)

    try:
        collection = Collection.objects.get(id=collection_id)
    except Collection.DoesNotExist:
        error_response = {
            "error": "invalid_request",
            "error_description": f"Collection {collection_id} does not exist"
        }
        return http.JsonResponse(error_response, status=400)

    user: Specifyuser = authenticate(username=username, password=password)

    if user is None or not has_collection_access(collection.id, user.id):
        error_response = {
            "error": "invalid_client",
            "error_description": "Credentials were incorrect or user does not have access to the Collection"
        }
        return http.JsonResponse(error_response, status=401)

    token = generate_access_token(user, collection.id, expires_in=expires_in)

    # TODO: issue refresh tokens that can be used to re-issue auth tokens
    # Issue refresh tokens as HTTP-only cookies? Need to keep CSRF protection
    # and replay attacks in mind. Maybe just store them in Redis...
    response = {
        "access_token": token,
        "expires_in": expires_in
    }
    return http.JsonResponse(response)
