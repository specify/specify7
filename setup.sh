#!/bin/bash

if [ -d virtenv ]
then
echo "Python virtual environment is already present."
echo "Delete the 'virtenv' directory if you wish to reinstall the dependencies."
exit
fi

virtualenv --system-site-packages virtenv
virtenv/bin/pip install -r requirements.txt
