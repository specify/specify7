#!/usr/bin/env bash
# Sets up and runs a MySQL instance using a ramdisk.
#
# This can dramatically speed up things like running tests (The
# Django test suite takes 455 secs with this, 7843 secs without
# it on my machine - that's almost factor 20).
# 
# Written and tested on Ubuntu Karmic. 
# 
# TODO: Possible things could be even faster; options to consider:
# * DELAY_KEY_WRITE
# * Disable logging
# * Disable binary logging
# * Possibly small memory caches in MySQL help performance here.

set -o nounset
set -o errexit

# You probably want to bind to somewhere non-default so you
# don't have to shutdown your standard MySQL instance.
# TODO: Make those options.
BIND_SOCKET=/var/run/mysqld/mysqld-ram.sock
BIND_HOST=127.0.0.1
BIND_PORT=3307


DATA_DIR=/var/lib/mysql-ram
PID_FILE=/var/run/mysqld/mysqld-ram.pid
USER=mysql
GROUP=mysql
MYSQL_APPARMOR_PROFILE=/etc/apparmor.d/usr.sbin.mysqld


get_bind_args() {
    # pass "server" for use with mysqld    
    host_option='--host'
    if [ ${1?"get_bind_args() needs one argument"} = "server" ]; then 
        host_option="--bind"; 
    fi
    
    args=""
    if [ -n "${BIND_SOCKET:+x}" ]; then args="$args --socket=${BIND_SOCKET}"; fi    
    if [ -n "${BIND_HOST:+x}" ]; then args="$args $host_option=${BIND_HOST}"; fi
    if [ -n "${BIND_PORT:+x}" ]; then args="$args --port=${BIND_PORT}"; fi
    echo $args
}


# If not yet done, setup a ram disk in the data directory.
if [ ! -d $DATA_DIR ]; then
    echo "Creating directory at $DATA_DIR"
    mkdir $DATA_DIR
    chown -R $USER:$GROUP $DATA_DIR
fi

# We're now going to do stuff we don't want to be persistent,
# so make sure we are going to properly cleanup.
cleanup() {
    # Run without errexit, we want to do as much cleanup 
    # as possible.
    set +e
    
    # Unmount ramdisk
    if mountpoint -q $DATA_DIR; then
        echo "Unmounting ramdisk..." 
        umount $DATA_DIR 
    fi
    
    set -e
    exit
}
trap cleanup INT TERM EXIT

# If the ram disk is not yet mounted, do so now.
if ! mountpoint -q $DATA_DIR; then
    echo "Mounting ramdisk at $DATA_DIR"
    mount -t tmpfs none $DATA_DIR
fi

# If AppArmor protects MySQL, it'll have to stop doing that
# for the time being.
if [ -f $MYSQL_APPARMOR_PROFILE ]; then
    echo "Disabling AppArmor..."
    apparmor_parser -R $MYSQL_APPARMOR_PROFILE
fi

# Setup the new mysql data directory
mysql_install_db --user $USER --datadir=$DATA_DIR > /dev/null

# Run mysqld; we need to workaround it not reacting to CTRL+C.
# Let's setup traps to shut it down ourselves.
trap '/usr/bin/mysqladmin $(get_bind_args client) refresh & wait' 1 # HUP
trap '/usr/bin/mysqladmin $(get_bind_args client) shutdown & wait' 2 3 15 # INT QUIT and TERM
# Run MySQL in the background.
mysqld $(get_bind_args server) --datadir="$DATA_DIR" --pid-file="$PID_FILE" --console &

# Enable apparmor again right away; it's enough that we
# started up the mysqld without the profile.
if [ -f $MYSQL_APPARMOR_PROFILE ]; then
    echo "Re-enabling AppArmor..."
    apparmor_parser -a $MYSQL_APPARMOR_PROFILE
fi

# Wait for the MySQL background process to end.
wait

# Call cleanup manually
trap - INT TERM EXIT
cleanup