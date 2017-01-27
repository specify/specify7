Developer Instructions
========================

After completing these instructions you will be able to run the test
server and interact with the Django based Specify webapp in your
browser on your local machine.

Intstructions for deployment follow.


Install system dependencies.
-----------------------------------
Specify 7 requires Python 2.7 which is the default for recent Linux
distributions.

Other required software:

* Git to obtain the Specify 7 repository
* Python-pip to install Python dependencies
* Python and MySQL development packages to compile the Python MySQL
  driver
* The build-essential packages for compiling the Python MySQL driver
* NodeJS to execute the Javascript minimization tool
* Specify6 for common resource files

On Ubuntu:

    sudo apt-get install \
        git python-pip python-dev libmysqlclient-dev \
        build-essential curl

    curl -sL https://deb.nodesource.com/setup_4.x | sudo -E bash -

    sudo apt-get install nodejs

To install Specify6, follow the Specify6 installation instructions, or
copy an existing installation if you have one.


Get the specifyweb source code.
----------------------------------
Clone this repository.

    git clone git://github.com/specify/specify7.git

You will now have a specify7 directory containing the source
tree.

Adjust settings files.
-------------------------
In the directory `specify7/specifyweb/settings` you will find the
`specify_settings.py` file. Make a copy of this file as
`local_specify_settings.py` and edit it. The file contains comments
explaining the various settings.
    

Python Virtual Environment.
---------------------------
Using a Python
[virtual environment](http://docs.python-guide.org/en/latest/dev/virtualenvs/)
will avoid version conflicts with other Python libraries on your
system. Also it avoids having to use a superuser account to install
the Python dependencies.

### Installing *virtualenv*
First make sure a reasonably up-to-date *virtualenv* tool is installed
on your system.

    virtualenv --version

If *virtualenv* is not installed, I recommend installing it using
*pip*.

    sudo pip install virtualenv

### Creating and activating the virtualenv
I generally create a virtualenv inside the the `specify7` directory
named simply `ve`.

    virtualenv specify7/ve
    source specify7/ve/bin/activate

The shell prompt will be modified to indicate the virtualenv is
active. It can be deactivated by invoking `deactivate` from the shell
prompt.

Building.
---------
The *Makefile* contains several targets for building and preparinge
Specify 7. If a virtualenv is active when *make* is invoked, it will
be detected and used installing Python dependencies or invoking Python
scripts.

### make all
The default make target *all* will invoke the steps necessary to run
Specfy 7.

### make build
Installs or updates dependencies and executes all build steps.

### make frontend
Installs or updates Javascript dependencies and builds the Javascript
modules only.

### make python_prep
Installs or updates Python dependencies and generates
`build_version.py` and `secret_key.py` files.

### make pip_requirements
Install or updates Python dependencies.

### make django_migrations
Applies Specify schema changes to the database named in the
settings. This step may fail if the master user configured in the
settings does not have DDL privileges. Changing the `MASTER_NAME` and
`MASTER_PASSWORD` settings to the MySQL root user will allow the
changes to be applied. Afterwards the master user settings can be
restored.

### make clean
Removes all generated files.

### make runserver
A shortcut for running the Django development server.

### make webpack_watch
Run webpack in watch mode so that changes to the frontend source code
will be automatically compiled. Useful during the development process.

Turn on debugging.
------------------
For development purposes, Django debugging should be turned on. It
will enable stacktraces in responses that encounter exceptions, and
allow operation with the unoptimized Javascript files. 

Debugging can be enabled by creating the file
`specify7/specifyweb/settings/debug.py` with the contents, `DEBUG =
True`.

The development server.
-----------------------
Specify7 can be run using the Django development server. If you are
using Python virtual environment, you will of course need to activate
it first.

    python specify7/specifyweb/manage.py runserver

This will start a development server for testing purposes on
`localhost:8000`.

The *Makefile* contains a shortcut target to start the development
server.

    make runserver


Deployment to production.
==========================

Start by following the development instructions above, but don't
enable debugging (or disable it if you enabled it previously).

Production requirements.
------------------------
For production environments, Specify7 can be hosted by Apache. The
following packages are needed:

* Apache
* mod-wsgi to connect Python to Apache

On Ubuntu:

    sudo apt-get install apache2 libapache2-mod-wsgi

Setup Apache.
-------------
In the `specify7` directory you will find the `specifyweb_apache.conf`
file. Make a copy of the file as `local_specifyweb_apache.conf` and
edit the contents to reflect the location of Specify6 and Specify7 on
your system. There are comments showing what to change.

Then, remove the default Apache welcome page.

    sudo rm /etc/apache2/sites-enabled/000-default.conf

And make a link to your `local_specifyweb_apache.conf` file.

    sudo ln -s `pwd`/specify7/local_specifyweb_apache.conf /etc/apache2/sites-enabled/

Restart Apache.
--------------
After changing Apache's config files, restart it.

    sudo invoke-rc.d apache2 restart

