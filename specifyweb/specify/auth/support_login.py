import time
import logging
import hmac
import jwt
from base64 import b64encode, b64decode, urlsafe_b64encode, urlsafe_b64decode
from collections.abc import Iterable
from hashlib import sha256

from jwt.exceptions import InvalidTokenError
from Crypto.Cipher import AES
from Crypto.Protocol.KDF import HKDF
from Crypto.Hash import SHA256
from Crypto.Random import get_random_bytes

from django.conf import settings
from django.core.exceptions import PermissionDenied

from specifyweb.specify.models import Specifyuser
from specifyweb.backend.workbench.upload.auditlog import str_to_bytes
from specifyweb.backend.redis_cache import set_bytes, get_bytes

logger = logging.getLogger(__name__)


TTL = settings.SUPPORT_LOGIN_TTL


def familiarize_digest(key: bytes):
    """Given a bytes object that may provided to the user, assoicate it with this instance
    by hashing it with the SECRET_KEY of the server.
    This should prevent malicious agents from just generating their own 
    token + key pair, as the encryption key and signing key both rely on this 
    value.
    """
    return hmac.new(settings.SECRET_KEY.encode(), key, sha256).digest()


def derive_key_pair(nonce: bytes, key_length: int, salt: bytes = b'') -> tuple[bytes, bytes]:
    """ Use a HKDF (HMAC-based Key Derivation Function) to deterministically 
    generate a cyrptographically secure pair of keys of a fixed length given 
    some pseudo-random inputs.

    See [Pycrptodome's HKDF](https://pycryptodome.readthedocs.io/en/latest/src/protocol/kdf.html#hkdf)
    and the orginal spec, [RFC 5869](https://datatracker.ietf.org/doc/html/rfc5869)

    Parameters:
    -   nonce: An initial value of bytes to "seed" new key generation
    -   key_length: The number of bytes to generate for each key pair
    -   salt: a preferably 32 byte number used to increase randomness

    Returns: A two-tuple of byte strings, each of length key_length
    """
    okm = HKDF(familiarize_digest(nonce), 2 * key_length, salt, SHA256)
    return okm[:key_length], okm[key_length:2*key_length]


def bytes_to_b64_string(input_bytes: bytes):
    return b64encode(input_bytes).decode("utf-8")


def bytes_to_b64_url(input_bytes: bytes) -> str:
    return urlsafe_b64encode(input_bytes).decode("utf-8")


def b64_url_to_bytes(url: str) -> bytes:
    # add padding back if needed
    padding = '=' * (-len(url) % 4)
    return urlsafe_b64decode(url + padding)


def make_token(user, key: bytes):
    # We randomly generate the salt value for the key pair generation.
    # This is later stored in memory via Redis with the configured TTL to
    # prevent attacks where the server SECRET_KEY is exposed
    salt = get_random_bytes(32)
    encryption_key, signing_key = derive_key_pair(key, 32, salt)
    cipher = AES.new(encryption_key, AES.MODE_GCM)
    issue_time = int(time.time())
    msg = f"{user.id}-{user.name}-{issue_time}"

    ciphertext, tag = cipher.encrypt_and_digest(msg.encode())
    payload = {
        "nonce": bytes_to_b64_string(cipher.nonce),
        "tag": bytes_to_b64_string(tag),
        "text": bytes_to_b64_string(ciphertext),

        # JWT options ---
        # Issued at time
        "iat": issue_time,
        # Expiry time
        "exp": issue_time + TTL
    }
    token: str = jwt.encode(payload, signing_key, algorithm="HS256")
    set_bytes(key, salt, time_to_live=TTL)

    return token


def decode_token(encoded_token: str, signing_key: bytes, required_keys: Iterable[str]) -> dict[str, str | bytes]:
    algorithms = ["HS256"]
    # See https://pyjwt.readthedocs.io/en/latest/api.html#jwt.decode
    jwt_decode_options = {
        "require": ["iat", "exp"],
        "verify_signature": True,
        "verify_iat": True,
        "verify_exp": True
    }
    try:
        decoded_payload = jwt.decode(
            encoded_token, signing_key, options=jwt_decode_options, algorithms=algorithms)
        # InvalidTokenError is a base class from which all decode exceptions
        # are derived.
        # See:
        # https://pyjwt.readthedocs.io/en/stable/api.html#jwt.exceptions.InvalidTokenError
        # https://github.com/jpadilla/pyjwt/blob/6293865c82ef24af76455c2522806ac2b1c75d6b/jwt/exceptions.py#L9
    except InvalidTokenError:
        raise PermissionDenied()

    payload = {k: b64decode(v) if k in required_keys
               else v for k, v in decoded_payload.items()}

    if not all(required_key in payload for required_key in required_keys):
        raise PermissionDenied()
    return payload


def decrypt_ciphertext(encryption_key, cipher_text, nonce, tag):
    cipher = AES.new(encryption_key, AES.MODE_GCM, nonce=nonce)

    try:
        # decrypt_and_verify can also raise a ValueError if the MAC tag is
        # invalid
        # See https://pycryptodome.readthedocs.io/en/latest/src/cipher/modern.html#decrypt_and_verify
        plain_text = cipher.decrypt_and_verify(
            cipher_text, tag).decode("utf-8")
        user_id, *user_name, timestamp = plain_text.split("-")
    except ValueError:
        return None, None, None
    return user_id, "-".join(user_name), timestamp


class SupportLoginBackend:
    def authenticate(self, request, token=None, key=None):
        logger.info("attempting support login")

        if token is None or key is None:
            return None

        # A key should always be "consumed" and deleted from Redis once used:
        # all suport login tokens are a one-time use
        salt = get_bytes(key, delete_key=True)
        if salt is None:
            return None

        encryption_key, signing_key = derive_key_pair(key, 32, salt)

        required_keys = ["nonce", "tag", "text"]
        payload = decode_token(token, signing_key, required_keys)

        user_id, user_name, timestamp = decrypt_ciphertext(
            encryption_key, payload["text"], payload["nonce"], payload["tag"])

        if user_id is None or user_name is None or timestamp is None:
            raise PermissionDenied()

        if int(timestamp) + TTL > time.time():
            return self.get_user(user_id, name=user_name)
        else:
            raise PermissionDenied()

    def get_user(self, user_id, name=None):
        filters = {}
        if name is not None:
            filters["name"] = name
        try:
            return Specifyuser.objects.get(pk=user_id, **filters)
        except Specifyuser.DoesNotExist:
            return None
