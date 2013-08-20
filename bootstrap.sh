#!/usr/bin/env bash

export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y mysql-server python-mysqldb python-crypto python-pip openjdk-7-jre-headless apache2 libapache2-mod-wsgi

cd /vagrant

echo "Installing Specify 7 requirements..."
pip install -r requirements.txt

echo "Importing Specify Database..."
mysql -uroot -e "create user 'MasterUser'@'localhost' identified by 'MasterPassword';"
mysql -uroot -e "grant all on *.* to 'MasterUser'@'localhost';"
mysql -uMasterUser -pMasterPassword -e "create database SpecifyDB;"
mysql -uMasterUser -pMasterPassword SpecifyDB < testing/SpecifyDB.sql

echo "Downloading Specify 6...."
wget -nv -O testing/Specify_unix.sh http://update.specifysoftware.org/Specify_unix.sh
yes '' | sh testing/Specify_unix.sh

python manage.py syncdb
python manage.py runserver
