Quick Start Instructions Using Vagrant
======================================

[Vagrant](http://www.vagrantup.com) can be used to deploy a test environment
running the Specify 7 server on any machine.

1. Download and install [Vagrant 1.2.7](http://downloads.vagrantup.com/tags/v1.2.7).
2. Clone this repository or download it using the "Download ZIP" button to the right.
3. In the top level directory where `Vagrantfile` is located create a new directory called `testing`.
4. Copy a Specify 6.5.05 database dump into the `testing` directory with the filename `SpecifyDB.sql`.
5. Run `vagrant up` in the top level directory.
6. The system will build and configure a virtual machine and setup a Specify 7 server
   with the database you provided.
7. When the 'Test server is up and running...' message appears, the system is ready.
8. Use `vagrant halt` to stop the test system without deleting anything, or
   `vagrant destroy` to remove the test system completely. To bring it back again,
   reissue `vagrant up`.



Developer Instructions
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

Run the test server:
--------------------

    manage.sh runserver


Visit the running app with your browser.
----------------------------------------
Paste this URL in your browser's location bar:
[http://127.0.0.1:8000](http://127.0.0.1:8000)


Optimizing JS and CSS files.
----------------------------
The Js and CSS files that comprise the web app can be optimized by
`requirejs`. For this to work `nodejs` and `make` must be installed.

    cd specifyweb/frontend/
    make

Thereafter the web app will automatically use the optimized files. If
any JS or CSS files are updated, `make` should be ran again.
