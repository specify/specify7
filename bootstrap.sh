#!/usr/bin/env bash

export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y make nodejs git mysql-server python-mysqldb python-crypto python-pip openjdk-7-jre-headless apache2 libapache2-mod-wsgi

echo "Installing Specify 7 requirements..."
pip install -r /vagrant/specifyweb/requirements.txt

mysql -uroot -e "create user 'MasterUser'@'localhost' identified by 'MasterPassword';"
mysql -uroot -e "grant all on *.* to 'MasterUser'@'localhost';"

if mysql -uMasterUser -pMasterPassword -e "create database SpecifyDB;"
then
    echo "Importing Specify Database..."
    mysql -uMasterUser -pMasterPassword SpecifyDB < /vagrant/testing/SpecifyDB.sql
fi

if [ ! -e /vagrant/testing/Specify_unix.sh ]; then
    echo "Downloading Specify 6...."
    wget -nv -O /vagrant/testing/Specify_unix.sh http://update.specifysoftware.org/Specify_unix.sh
fi

if [ ! -d /opt/Specify ]; then
    yes '' | sh /vagrant/testing/Specify_unix.sh
fi

make -C /vagrant/specifyweb

rm /etc/apache2/sites-enabled/*
ln -sf /vagrant/specify_apache.conf /etc/apache2/sites-enabled/
invoke-rc.d apache2 restart

echo "Test server is up and running at http://localhost:8000/"
