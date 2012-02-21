Install the Python MySQL drivers and the PyQuery library.
---------------------------------------------------------
On Ubuntu:

    sudo apt-get install python-mysqldb python-pyquery

Install the Python package installer, pip:
------------------------------------------
On Ubuntu:

    sudo apt-get install python-pip

Install Django 1.3
------------------
On Ubuntu 11.10 or later:

    sudo apt-get install python-django

On others, use pip:

    sudo pip install Django

Install tastypie:
-----------------

    sudo pip install django-tastypie

Set database, username and password:
------------------------------------
Edit the settings.py and configure the DATABASES section:

    DATABASES = {
        'default': {
            'ENGINE': 'djangospecify.hibernateboolsbackend.backends.mysql',
            'NAME': 'kuplant', # name of a Specify 6.4 database
            'USER': 'root',    # user with access to that DB
            'PASSWORD': 'root',
            'HOST': '',    # Set to empty string for localhost. Not used with sqlite3.
            'PORT': '',    # Set to empty string for default. Not used with sqlite3.
        }
    }

Run the test server:
--------------------

    python manage.py runserver

