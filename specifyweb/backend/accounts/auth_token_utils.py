import uuid

import jwt

from datetime import datetime, timezone, timedelta
from typing import Literal

from django.conf import settings

from specifyweb.backend.redis_cache.store import set_string, key_exists

DEFAULT_AUTH_LIFESPAN_SECONDS = 1800

# See https://pyjwt.readthedocs.io/en/latest/api.html#jwt.decode
AUTH_JWT_DECODE_OPTIONS = {
    "require": ["iat", "exp", "jti"],
    "verify_signature": True,
    "verify_iat": True,
    "verify_exp": True
}

AUTH_TOKEN_ALGORITHMS = ["HS256"]

def generate_access_token(user, collection_id: int, expires_in: int = DEFAULT_AUTH_LIFESPAN_SECONDS):
    jti = str(uuid.uuid4())

    jwt_payload = {
        "sub": user.id,
        "username": user.name,
        "collection": collection_id,
        "jti": jti,
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(seconds=expires_in)
    }
    token = jwt.encode(jwt_payload, settings.SECRET_KEY, algorithm=AUTH_TOKEN_ALGORITHMS[0])
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
    set_string(f"revoked:{jti}", "true", time_to_live=blacklist_ttl)

def get_token_from_request(request) -> Literal[False] | None | dict:
    auth_header = request.headers.get("Authorization")
    if auth_header is None or not auth_header.startswith("Bearer "):
        return None

    encoded_token = auth_header.split(" ")[1]

    try:
        token = jwt.decode(encoded_token, settings.SECRET_KEY, options=AUTH_JWT_DECODE_OPTIONS, algorithms=AUTH_TOKEN_ALGORITHMS)
    except jwt.exceptions.InvalidTokenError:
        return False
    return token


def token_is_revoked(token: dict):
    token_identifier = token["jti"]
    return key_exists(f"revoked:{token_identifier}")
