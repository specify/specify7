# See edu.ku.brc.helpers.Encryption and rfc2898

from itertools import islice
from hashlib import md5
from Crypto.Cipher import DES
from Crypto.Random.random import randint

ITERATION_COUNT = 1000

def decrypt(text, password):
    key = password.encode() # since it could be a unicode object
    fromhex = text.decode('hex')
    salt, ciphertext = fromhex[:8], fromhex[8:]

    derivedkey = generate_derivedkey(key, salt)
    deskey, iv = derivedkey[:8], derivedkey[8:]

    des = DES.new(deskey, DES.MODE_CBC, iv)
    padded = des.decrypt(ciphertext)
    paddinglen = ord(padded[-1])
    return padded[:-paddinglen]

def encrypt(text, password):
    paddinglen = 8 - len(text) % 8
    padded = text + chr(paddinglen) * paddinglen

    key = password.encode()
    salt = make_salt()

    derivedkey = generate_derivedkey(key, salt)
    deskey, iv = derivedkey[:8], derivedkey[8:]

    des = DES.new(deskey, DES.MODE_CBC, iv)
    ciphertext = des.encrypt(padded)
    return str(salt + ciphertext).encode('hex')

def rand_byte():
    return randint(0, 0xff)

def make_salt():
    return str(bytearray(islice(iter(rand_byte, None), 8)))

def generate_derivedkey(key, salt, iterations=ITERATION_COUNT):
    out = key + salt
    for i in xrange(iterations):
        md = md5()
        md.update(out)
        out = md.digest()
    return out
