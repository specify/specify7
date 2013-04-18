Quick Start Instructions
========================

After completing these instructions you will be able to run the test
server and interact with the Django based Specify webapp in your
browser on your local machine.


Install system Python dependencies.
-----------------------------------
The code is known to work with Python2.7. It might also work with
2.6. Python3 support is contingent on the MySQL drivers being ported.

On Ubuntu:

    sudo apt-get install python-mysqldb python-crypto python-virtualenv

On Fedora (these need to be checked):

    sudo yum install MySQL-python python-crypto python-virtualenv


Get the specifyweb source code.
----------------------------------
Clone this repository:

    git clone git://github.com/specify/specifyweb.git

You will now have a specifyweb directory containing the source
tree. From this point all commands will be with respect to that as the
working directory.

    cd specifyweb

Setup the development environment.
----------------------------------
The following command will setup the Python virtual environment for
the project:

    ./setup.sh

Set up the settings file.
-------------------------
Copy the `settings/specify_settings.py` file to `settings/local_specify_settings.py` and
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

    ./manage.sh test

Sync the database:
------------------
Django keeps track of browser sessions using the `django_session` table. This table
must be created.

    ./manage.sh syncdb

If this step fails because the master user does not have `CREATE TABLE` privileges, you can
change the `specify_settings.py` file to use the 'IT user' as a temporary work-around.

Run the test server:
--------------------

    manage.sh runserver


Visit the running app with your browser.
----------------------------------------
Paste this URL in your browser's location bar:
[http://127.0.0.1:8000](http://127.0.0.1:8000)


