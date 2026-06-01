# Overview

Redis is a key-value in-memory database that can be used as a cache to store information that should be shared across Specify operations. Because of its in-memory nature, it is also suited to store short-lived/ephemeral state for different operations.

Redis should be considered when:

- You need to store ephemeral information/state that can generally be lost on container restart
- A Specify operation needs to be handled asynchronously and/or across multiple processes (as in, multiple Gunicorn or Celery workers)

Examples of how the Redis cache is already being used in Specify:

- [feat: add ALLOW_SUPPORT_LOGIN to Dockerfile
  #7399](https://github.com/specify/specify7/pull/7399)
  - Used to store access tokens keys for the Support Login feature
- [Consolidate Setup Tool, Configuration Tool, and Preloaded Tree Creation
  #7674](https://github.com/specify/specify7/pull/7674)
  - Used to track the overall state of the Setup Tool operations and allow communication between processes
- [Prevent broken transactions when autonumbering
  #7671](https://github.com/specify/specify7/pull/7671)
  - Used to store the highest value when autonumbering to allow multiple Specify processes

View the Redis docs at https://redis.io/docs/latest/commands/

# Using the Redis Cache

TODO: Expand upon these docs

## Setting a Simple Key with Value

```py
from specifyweb.backend.cache.redis.connect import RedisConnection, RedisString

# establish the connection to Redis.
# If you need to pass in any connection parameters, those are passed in here
connection = RedisConnection()

# RedisString is the adapter to work with Key-Value pairs in Redis
# We pass in the connection to make RedisString more modular and not care
# about the connection specifics
r_strings = RedisString(connection)

# Setting a simple key-value pair
r_strings.set("myKey", "my_value")

# You can pass in options like setting a time-to-live for the entry,
# or whether it should override an existing key with the same name
# Setting a key that overrides the existing value for the key of the same
# name and expires in 300 seconds
r_strings.set("myKey", "my_temporary_value", time_to_live=300, override_existing=True)

# Getting the value of a key
r_strings.get("myKey") # returns "my_temporary_value"

# You can optionally choose to delete the key after retrieving it
r_strings.get("myKey", delete_key=True) # returns "my_temporary_value"

# Calling 'get' on a key which doesn't exist will return None
r_strings.get("myKey") # returns None
```

## Working With Other Data Structures

There are currently simple adapters for Lists (RedisList) and Sets (RedisSet) that behave with the same principles as RedisString:

```py
from specifyweb.backend.cache.redis.connect import RedisConnection, RedisSet

connection = RedisConnection()

r_sets = RedisSet(connection)

# Adds "foo" and "bar" to the set defined by myKey
r_sets.add("myKey", "foo", "bar")
# Adds "baz" to the set defined by myOtherKey
r_sets.add("myOtherKey", "baz")

r_sets.is_member("myKey", "foo") # returns True
r_sets.is_member("myKey", "baz") # returns False
r_sets.size("myKey") # returns 2
# removes "bar" from the myKey set
r_sets.remove("myKey", "bar")
```

A more complex datastructure is demonstrated in specifyweb.backend.cache.redis.rqueue.RedisQueue built on top of RedisList which allows working with Queues that can contain any (serializable) data type.

## Working Directly with Redis

If there is not an adapter to fit your needs, you can pass commands directly to Redis through the connection attribute of the RedisConnection class

```py
from specifyweb.backend.cache.redis.connect import RedisConnection

connection_adapter = RedisConnection()

# https://redis.io/docs/latest/commands/hset/
connection_adapter.connection.hset("myHashKey", "someField", "foo")
connection_adapter.connection.hget("myHashKey", "someField") # returns "foo"
```
