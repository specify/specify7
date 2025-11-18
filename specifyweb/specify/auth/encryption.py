"""
Handles Specify user passowrd crypto

See src/edu.ku.brc.helpers.Encryption in github.edu/specify/specify6 and rfc2898
"""

from Crypto.Cipher import DES
from Crypto.Random.random import randint
from hashlib import md5
from itertools import islice

ITERATION_COUNT = 1000

def decrypt(text: str, password: str) -> str:
    key = password.encode('utf-8')
    fromhex = bytes.fromhex(text)
    salt, ciphertext = fromhex[:8], fromhex[8:]

    derivedkey = generate_derivedkey(key, salt)
    deskey, iv = derivedkey[:8], derivedkey[8:]

    des = DES.new(deskey, DES.MODE_CBC, iv)
    padded = des.decrypt(ciphertext)
    paddinglen = padded[-1]
    return padded[:-paddinglen].decode('utf-8')

def encrypt(text: str, password: str) -> str:
    text_encoded = text.encode('utf-8')
    paddinglen = 8 - len(text_encoded) % 8
    padded = text_encoded + bytes([paddinglen]) * paddinglen

    key = password.encode('utf-8')
    salt = make_salt()

    derivedkey = generate_derivedkey(key, salt)
    deskey, iv = derivedkey[:8], derivedkey[8:]

    des = DES.new(deskey, DES.MODE_CBC, iv)
    ciphertext = des.encrypt(padded)
    return (salt + ciphertext).hex().upper()

def rand_byte() -> int:
    return randint(0, 0xff)

def make_salt() -> bytes:
    return bytes(islice(iter(rand_byte, None), 8))

def generate_derivedkey(key: bytes, salt: bytes, iterations: int = ITERATION_COUNT) -> bytes:
    out = key + salt
    for i in range(iterations):
        md = md5()
        md.update(out)
        out = md.digest()
    return out
