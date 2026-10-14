import multiprocessing

"""
Common configuraion options that are read by Gunicorn when the Specify
instance starts.
These settings should be modified when:
- You expect to have or experience a significant amount of concurrent traffic
- Memory usage and/or CPU utilization is approaching a bottleneck/ceiling and
using too much server resources
- The Specify instance does not receive a large amount of concurrent traffic and you wish to decrease its Memory Usage/CPU Utilization

See https://gunicorn.org/configure/ and
https://gunicorn.org/reference/settings/#config-file 

All options are available at https://gunicorn.org/reference/settings/ 
"""

# The total number of worker processes Gunicorn will spawn to handle requests
# See https://gunicorn.org/reference/settings/#workers
workers = 2
# The total number of threads within each worker process Gunicorn will spawn
# See https://gunicorn.org/reference/settings/#threads
threads = multiprocessing.cpu_count() + 1
# Gunicorn reccomends the value of Workers * Threads to be in somewhere in the
# range of (2 * CPU Cores) + 1
# Specify is generally constrained by memory over time, not CPU Utilization.
# Becuase of this, the memory overhead of having multiple worker processes can
# be significant and strain system resources.
# The tradeoff for having fewer processes, however, is that threads are bound
# by the Python Global Interperter Lock (GIL)
# See https://gunicorn.org/design/#scaling and 
# https://gunicorn.org/design/#comparison

# The amount of seconds a worker process is unrepsonsive to heartbeats from the
# master process before it is killed and restarted
# See https://gunicorn.org/reference/settings/#timeout
timeout = 300

# The number of requests a worker process can handle before it is restarted.
# This would help alleviate memory leaks or continued high-memory usage within
# Specify instances
# What to set this value at is heavily dependent on how many worker processes
# are available on the server, as well as the request volume/throughput on
# the instance. 
# If set to a value that is too low, the workers will restart very frequently:
# potentially causing reponse delays/latency while the workers are restarting.
# Similarly, if you have a low amount of workers, response time may be impacted
# if there is not an available worker to pick up requests from the worker while
# it is being restarted.
# A value of 0 (the default) means automatic worker restarts are disabled.
# See https://gunicorn.org/reference/settings/#max_requests
max_requests = 0
# The max requests jitter causes the requests required to restart each worker
# to require an additional number of requests randomized from
# 0-max_requests_jitter.
# This is intended to stagger the worker restarts and avoid scenarios where
# most or all workers restart at the same time.
# See https://gunicorn.org/reference/settings/#max_requests_jitter
max_requests_jitter = 0

# The socket to bind on the server that allows communication with the reverse
# proxy (NGINX).
# You should only have to touch this setting if you're building a custom image
# for Specify 7 and/or making heavy modifications to the NGINX configuraiton
# See https://gunicorn.org/reference/settings/#bind
bind = ['0.0.0.0:8000']
