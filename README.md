Quick Start Instructions
========================

After completing these instructions you will be able to run the test
server and interact with the Django based Specify webapp in your
browser on your local machine.


Install the Python MySQL drivers, Crypto package, and the package installer, pip.
---------------------------------------------------------------------------------
On Ubuntu:

    sudo apt-get install python-mysqldb python-pip python-crypto

On Fedora:

    sudo yum install MySQL-python python-pip python-crypto

Install Django 1.4.5
--------------------
On Ubuntu:

    sudo pip install Django==1.4.5

On Fedora:

    sudo pip-python install Django==1.4.5

Get the specifyweb source code.
----------------------------------
Clone this repository:

    git clone git://github.com/specify/specifyweb.git

You will now have a specifyweb directory containing the source
tree. From this point all commands will be with respect to that as the
working directory.

    cd specifyweb

Set up the settings file.
-------------------------
Copy the `specify_settings.py` file to `local_specify_settings.py` and
configure the settings according to your system.

```python
# The webapp server piggy backs on the thick client.
# Set the path to a thick client installation.
THICK_CLIENT_LOCATION = '~/Specify'

# Set the database name to the mysql database you
# want to access.
DATABASE_NAME = 'SpecifyDB'

# The master user login. Use the same values as
# you did setting up the thick client.
MASTER_NAME = 'MasterUser'
MASTER_PASSWORD = 'MasterPassword'
```

You can edit `specify_settings.py` directly but then it will always show
up as a modified file in version control and generally make a nuisance
of itself.

Run the test suite.
-------------------
There is a preliminary test suite which can be ran as follows:

    python manage.py test

Sync the database:
------------------
The authentication system in django makes use of a couple extra tables. This
command will generate them:

    python manage.py syncdb

Django will ask whether it should create a superuser. It is safe to answer 'no',
since the superuser for the Django admin system which is not being used.

If this step fails because the master user does not have `CREATE TABLE` privileges, you can
change the `specify_settings.py` file to use the 'IT user' as a temporary work-around.

Run the test server:
--------------------

    python manage.py runserver


Visit the running app with your browser.
----------------------------------------
Paste this URL in your browser's location bar:
[http://127.0.0.1:8000](http://127.0.0.1:8000)


