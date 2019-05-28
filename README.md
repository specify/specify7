
  Specify 7
  =========
  
  The Specify Software Project is funded by the Advances in
  Biological Informatics Program, U.S. National Science Foundation
  (NSF/BIO: 1565098).
    
  Specify 7 Copyright © 2017 University of Kansas Center for
  Research. Specify comes with ABSOLUTELY NO WARRANTY.  This is
  free software licensed under GNU General Public License 2
  (GPL2).

 
    Specify Software Project
    Biodiversity Institute
    University of Kansas
    1345 Jayhawk Blvd.
    Lawrence, KS USA 66045
 




Developer Instructions
========================

After completing these instructions you will be able to run the test
server and interact with the Django based Specify webapp in your
browser on your local machine.

Intstructions for deployment follow.

**Note:** If updating from a previous version, some of the python
dependencies have changed. It is recommended to place the new version
in a separate directory next to the previous version and install all
the new dependencies in a Python virtualenv as described below. That
will avoid version conflicts and allow the previous version to
continue working while the new version is being set up. When the new
version is working satifactorily using the test server, the Apache
conf can be changed to point to it (or changed back to the old
version, if problems arise).


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
        libsasl2-dev libldap2-dev libssl-dev build-essential curl

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

When building the frontend, *Webpack* will issue the following
warnings that can be safely ignored:

```
WARNING in ./bower_components/handsontable/dist/handsontable.full.js
Critical dependencies:
41:48-74 This seems to be a pre-built javascript file. Though this is
possible, it's not recommended. Try to require the original source to
get better results.
 @ ./bower_components/handsontable/dist/handsontable.full.js 41:48-74

WARNING in ./bower_components/handsontable/dist/handsontable.full.js
Critical dependencies:
47:38-65 This seems to be a pre-built javascript file. Though this is
possible, it's not recommended. Try to require the original source to
get better results.
 @ ./bower_components/handsontable/dist/handsontable.full.js 47:38-65
```

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

When the server starts up, it will issue a warning that some
migrations have not been applied:

```
You have 11 unapplied migration(s). Your project may not work
properly until you apply the migrations for app(s): auth,
contenttypes, sessions.  Run 'python manage.py migrate' to apply them.
```

Specify 7 makes use of functions from the listed Django apps (auth,
contenttypes, and sessions) but does not need the corresponding tables
to be added to the database. Running `make django_migrations` will
apply only those migrations needed for Specify 7 to operate.


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


Updating Specify 7
===================
To update the Specify 7 server software follow this procedure.

0. Backup your Specify database using MySQL dump or the Specify backup and restore tool.

1. Clone or download a new copy of this repository in a directory 
next to your existing installation.

    `git clone git://github.com/specify/specify7.git specify7-new-version`

2. Copy the settings from the existing to the new installation.

    `cp specify7/specifyweb/settings/local* specify7-new-version/specifyweb/settings/`
    
3. Make sure to update the `THICK_CLIENT_LOCATION` setting in `local_specify_settings.py`,
if you are updating the Specify 6 version.

4. If you are using Python virtualenvs for your Specify 7 Python dependancies (recommended),
then create a new virtualenv for the new installation.

```
    virtualenv specify7-new-version/ve
    source specify7-new-version/ve/bin/activate
```

6. Run `make all` which will pull down the Python dependencies,
build the JS bundles, and apply any necessary database migrations.

    `make all`
    
7. Testing it out with the [development server](#the-development-server).

8. Deploy the new version by updating your Apache config to replace the old
installation paths with the new.
