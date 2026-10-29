import uuid

from datetime import datetime, timezone, timedelta
from typing import Literal, Generator, Any, cast
from enum import StrEnum

import jwt
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


def revoke_access_token(token: dict[str, Any]):
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
    if blacklist_ttl < 1:
        return
    redis_string = RedisString(RedisConnection())
    token_key = f"revoked:{jti}"
    redis_string.set(token_key, "true", time_to_live=max(blacklist_ttl, 1))


def get_token_from_request(request: http.HttpRequest) -> Literal[False] | None | dict:
    """
    Attempts to get an Access Token from a HTTP Request.
    Currently, we only support using access tokens with an Authorization
    Header.

    Particularly, clients should provide an access token like the following as
    a Header:
        Authorization: Bearer <token>

    For more information, see Section 2.1 of RFC 6750:
        https://www.rfc-editor.org/info/rfc6750/#section-2.1
    """
    auth_header = request.headers.get("Authorization")
    if auth_header is None or not auth_header.lower().startswith("bearer "):
        return None

    auth_fields = auth_header.strip().split(" ")
    # If there is more than one space in the Authorization header, consider it
    # invalid
    if len(auth_fields) != 2:
        return False

    encoded_token = auth_fields[1]

    token = decode_access_token(encoded_token)

    if token is None:
        return False

    return token

def decode_access_token(encoded_token: str) -> dict[str, Any] | None:
    """
    Attempts to decode an Access Token. Returns the token if it's valid and
    None otherwise
    """
    try:
        token = jwt.decode(
            encoded_token,
            settings.SECRET_KEY,
            options=AUTH_JWT_DECODE_OPTIONS,
            algorithms=AUTH_TOKEN_ALGORITHMS
        )
    except jwt.exceptions.InvalidTokenError:
        return None
    return token

def token_is_revoked(token: dict):
    token_identifier = token["jti"]
    redis_string = RedisString(RedisConnection())
    token_key = f"revoked:{token_identifier}"
    return redis_string.exists(token_key)

class ACCESS_TOKEN_GRANT_TYPE(StrEnum):
    # The client provides the server with a username, password, and collection
    # id
    PASSWORD = "password"

    @classmethod
    def types(cls) -> Generator[str, None, None]:
        return (item.value for item in cls)


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
    raw_expires_in = request.POST.get("expires_in", DEFAULT_AUTH_LIFESPAN_SECONDS)

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

    untyped_user = authenticate(username=username, password=password)
    # authenticate should always return a Specifyuser, as that's our only Auth
    # User Model
    user = cast(Specifyuser | None, untyped_user)

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
        "expires_in": expires_in,
        "token_type": "Bearer"
    }
    return http.JsonResponse(response)
