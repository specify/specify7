
Specify 7
=========

The Specify Collections Consortium is funded by its member
institutions. The Consortium web site is:
https://specifysoftware.org

Specify 7 Copyright © 2021 Specify Collections Consortium. Specify
comes with ABSOLUTELY NO WARRANTY.  This is free software licensed
under GNU General Public License 2 (GPL2).

    Specify Collections Consortium
    Biodiversity Institute
    University of Kansas
    1345 Jayhawk Blvd.
    Lawrence, KS 66045 USA

## Table of Contents

   * [Specify 7](#specify-7)
      * [Table of Contents](#table-of-contents)
   * [Installation](#installation)
      * [Installation with Docker](#installation-with-docker)
      * [Ordinary installation](#ordinary-installation)
         * [Installing system dependencies](#installing-system-dependencies)
         * [Installing Specify 6](#installing-specify-6)
         * [Cloning Specify 7 source repository](#cloning-specify-7-source-repository)
         * [Setting up Python Virtual Environment](#setting-up-python-virtual-environment)
         * [Building](#building)
         * [Adjusting settings files](#adjusting-settings-files)
         * [Turning on debugging](#turning-on-debugging)
         * [The development server](#the-development-server)
      * [Deployment to production](#deployment-to-production)
         * [Installing production requirements](#installing-production-requirements)
         * [Setting up Apache](#setting-up-apache)
         * [Restarting Apache](#restarting-apache)
   * [Updating Specify 7](#updating-specify-7)
   * [Updating the database (Specify 6) version](#updating-the-database-specify-6-version)

# Installation
After completing these instructions you will be able to run the test
server and interact with the Django based Specify webapp in your
browser on your local machine.

Instructions for deployment follow.

**Note:** If updating from a previous version, some of the python
dependencies have changed. It is recommended to place the new version
in a separate directory next to the previous version and install all
the new dependencies in a Python virtualenv as described below. That
will avoid version conflicts and allow the previous version to
continue working while the new version is being set up. When the new
version is working satisfactorily using the test server, the Apache
conf can be changed to point to it (or changed back to the old
version, if problems arise).


## Installation with Docker
If you would like to deploy Specify 7 in a
[Docker](https://www.docker.com/) container checkout the instructions
in this repository:
https://github.com/specify/specify7-docker


## Ordinary installation

### Installing system dependencies
Specify 7 requires Python 3.6. Ubuntu 18.04 LTS is recommended. For
other distributions these instructions will have to be adapted.

```shell
sudo apt-get -y install --no-install-recommends \
    build-essential \
    git \
    libldap2-dev \
    libmariadbclient-dev \
    libsasl2-dev \
    nodejs \
    npm \
    openjdk-11-jre-headless \
    python3-venv \
    python3.6 \
    python3.6-dev \
    unzip
```

### Installing Specify 6
A copy of the most recent Specify 6 release is required on the server
as Specify 7 makes use of resource files. Specify 6 code is also
executed by the server for Workbench validation and uploads.

```shell
wget https://update.specifysoftware.org/6800/Specify_unix_64.sh
sh Specify_unix_64.sh -q -dir ./Specify6.8.0
sudo ln -s $(pwd)/Specify6.8.0 /opt/Specify
```

### Cloning Specify 7 source repository
Clone this repository.

```shell
git clone git://github.com/specify/specify7.git
```

You will now have a specify7 directory containing the source
tree.


### Setting up Python Virtual Environment
Using a Python
[virtual environment](https://docs.python-guide.org/en/latest/dev/virtualenvs/)
will avoid version conflicts with other Python libraries on your
system. Also, it avoids having to use a superuser account to install
the Python dependencies.

```shell
python3.6 -m venv specify7/ve
specify7/ve/bin/pip install -r specify7/requirements.txt
```

### Building

To build Specify 7 use the default make target.

```shell
cd specify7
make
```

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

Other make targets:

#### make build
Runs all necessary build steps.

#### make frontend
Installs or updates Javascript dependencies and builds the Javascript
modules only.

#### make clean
Removes all generated files.


The following targets require the virualenv to be activated:

#### make pip_requirements
Install or updates Python dependencies.

#### make django_migrations
Applies Specify schema changes to the database named in the
settings. This step may fail if the master user configured in the
settings does not have DDL privileges. Changing the `MASTER_NAME` and
`MASTER_PASSWORD` settings to the MySQL root user will allow the
changes to be applied. Afterward, the master user settings can be
restored.

#### make runserver
A shortcut for running the Django development server.

#### make webpack_watch
Run webpack in watch mode so that changes to the frontend source code
will be automatically compiled. Useful during the development process.


### Adjusting settings files
In the directory `specify7/specifyweb/settings` you will find the
`specify_settings.py` file. Make a copy of this file as
`local_specify_settings.py` and edit it. The file contains comments
explaining the various settings.


### Turning on debugging
For development purposes, Django debugging should be turned on. It
will enable stack traces in responses that encounter exceptions, and
allow operation with the unoptimized Javascript files.

Debugging can be enabled by creating the file
`specify7/specifyweb/settings/debug.py` with the contents, `DEBUG =
True`.

### The development server
Specify7 can be run using the Django development server.

```shell
cd specify7
source ve/bin/activate
make runserver
```

This will start a development server for testing purposes on
`localhost:8000`.


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


## Deployment to production
Start by following the development instructions above, but don't
enable debugging (or disable it if you enabled it previously).

### Installing production requirements
For production environments, Specify7 can be hosted by Apache. The
following packages are needed:

* Apache
* mod-wsgi to connect Python to Apache

```shell
sudo apt-get install apache2 libapache2-mod-wsgi-py3
```

Warning: This will replace the Python 2.7 version of mod-wsgi that was
used by Specify 7.4.0 and prior. If executed on a production server
running one of those versions, Specify 7 will stop working until the
new deployment is configured.

### Setting up Apache
In the `specify7` directory you will find the `specifyweb_apache.conf`
file. Make a copy of the file as `local_specifyweb_apache.conf` and
edit the contents to reflect the location of Specify6 and Specify7 on
your system. There are comments showing what to change.

Then remove the default Apache welcome page and make a link to your
`local_specifyweb_apache.conf` file.

```shell
sudo rm /etc/apache2/sites-enabled/000-default.conf
sudo ln -s `pwd`/specify7/local_specifyweb_apache.conf /etc/apache2/sites-enabled/
```

### Restarting Apache
After changing Apache's config files restart the service.

```shell
sudo systemctl restart apache2.service
```

# Updating Specify 7
Specify 7.4.0 and prior versions were based on Python 2.7. If updating
from one of these versions, it will be necessary to install Python 3.6
by running the `apt-get` commands in the
[Install system dependencies](#install-system-dependencies) and the
[Production requirements](#production-requirements) steps. Then
proceed as follows:

0. Backup your Specify database using MySQL dump or the Specify backup
   and restore tool.

1. Clone or download a new copy of this repository in a directory next
   to your existing installation.

    `git clone git://github.com/specify/specify7.git specify7-new-version`

2. Copy the settings from the existing to the new installation.

    `cp specify7/specifyweb/settings/local* specify7-new-version/specifyweb/settings/`

3. Make sure to update the `THICK_CLIENT_LOCATION` setting in
   `local_specify_settings.py`, if you are updating the Specify 6
   version.

4. Create a new virtualenv for the new installation by following the
   [Python Virtual Environment](#python-virtual-environment) section
   for the new directory.

6. [Build](#building) the new version of Specify 7.

7. Testing it out with the [development server](#the-development-server).

8. Deploy the new version by updating your Apache config to replace
   the old installation paths with the new ones and restarting Apache.

# Updating the database (Specify 6) version
The Specify database is updated from one version to the next by the
Specify 6 application. To update the database version connect to the
database with a new version of Specify 6 and follow the Specify 6
update procedures.

Once the database version is updated, a corresponding copy of Specify
6 must be provided to the Specify 7 server by repeating the
[Installing Specify 6](#installing-specify-6) section of this guide
for the new version of Specify 6.

[![analytics](https://www.google-analytics.com/collect?v=1&t=pageview&dl=https%3A%2F%2Fgithub.com%2Fspecify%2Fspecify7&uid=readme&tid=UA-169822764-3)]()
