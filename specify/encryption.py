from hashlib import md5
from Crypto.Cipher import DES

ITERATION_COUNT = 1000

def decrypt(text, password):
    key = password.encode() # since it could be a unicode object
    fromhex = text.decode('hex')
    salt = fromhex[:8]
    ciphertext = fromhex[8:]
    derivedkey = generate_derivedkey(key, salt)
    deskey, iv = derivedkey[:8], derivedkey[8:]
    des = DES.new(deskey, DES.MODE_CBC, iv)
    padded = des.decrypt(ciphertext)
    paddinglen = ord(padded[-1])
    return padded[:-paddinglen]

def generate_derivedkey(key, salt, iterations=ITERATION_COUNT):
    out = key + salt
    for i in xrange(iterations):
        md = md5()
        md.update(out)
        out = md.digest()
    return out
