
# [Specify 7](https://www.specifysoftware.org/products/specify-7/)

The [Specify Collections Consortium](https://www.specifysoftware.org) is pleased
to offer Specify 7, a web implementation of our biological collections data
management platform.

We encourage members to use
our [Dockerized compositions](https://github.com/specify/docker-compositions) of
Specify 7. You can choose a version, make the necessary adjustments and then run
a single command to get everything working. It is very simple and can be easily
updated when new versions are released. Members can contact us
at [support@specifysoftware.org](mailto:support@specifysoftware.org) to gain
access to this repository.

The new generation of Specify combines the interface design components and data
management foundation of Specify 6 with the efficiency and ease-of-use of
web-based data access and cloud computing. The Specify 7 web application uses
the same interface layout language as Specify 6, so any user interface
customization made in one product is mirrored in the other. Also Specify 6 and
Specify 7 use the same data model and can work from the same Specify MySQL
database, which means they can be run simultaneously with any Specify
collection. By providing an easy migration path to the web, Specify 7 helps
transition Specify 6 collections to cloud computing. It is also a great starting
platform for collections which prefer zero workstation software installation and
ubiquitous web browser access.

Specify 7’s server/browser architecture open the door for computing support of
collaborative digitization projects and for remote hosting of institutional or
project specimen databases. Without the need for a local area or campus network
to connect to the MySQL data server, Specify 7 gives you and your collaborators
access to a shared specimen database through any web browser. Without adequate
IT support to maintain a secure database server? With the Specify 7 server
software supported on generic Linux servers, museums can utilize a server
hosting service to provide support for the technical complexities of systems
administration, security management, and backing-up. Want to create a joint
database with remote collaborators for a collaborative digitizing effort? No
problem! Host, hire a hosting service or use
our [Specify Cloud](https://www.specifysoftware.org/products/cloud/) service for
your Specify database, set up accounts and go. We provide the same efficient
user interface and printed reports and labels customization, and help desk
support for Specify 7 as we do for Specify 6.

**Secure.**
Support for Single Sign-On (SSO) integrates Specify 7 with a campus or
institutional identity providers. It supports all identity providers (IdPs) that
have an OpenID endpoints.

The Security and Accounts tool allows administrators to give access based on
roles and policies. Create, edit, and copy roles among collections and
databases. Administrators can give users as many or few permissions as desired,
from guest accounts to collection managers.

**Accessible.**
It is important that web applications work for people with disabilities. Specify
7 is developed with this top of mind, not only meeting international
accessibility standards but also providing a better experience for everyone.

Specify 7 is largely compliant with the main WWW accessibility standard – **WCAG
2.1 (AA)**. It supports screen readers and allows each user to customize their
color scheme and appearance as well as reduce motion and resize all elements.

This accessible design respects system and web browser preferences for date
formats, language, theme, and animations.

---

The Specify Collections Consortium is funded by its member
institutions. The Consortium web site is:
https://specifysoftware.org

Specify 7 Copyright © 2022 Specify Collections Consortium. Specify
comes with ABSOLUTELY NO WARRANTY. This is free software licensed
under GNU General Public License 2 (GPL2).

    Specify Collections Consortium
    Biodiversity Institute
    University of Kansas
    1345 Jayhawk Blvd.
    Lawrence, KS 66045 USA

## Table of Contents

- [Specify 7](#specify-7)
    - [Table of Contents](#table-of-contents)
    - [Changelog](#changelog)
    - [Installation](#installation)
        - [Docker installation](#docker-installation-recommended)
          (**Recommended**)
        - [Local installation](#local-installation)
            - [Installing system dependencies](#installing-system-dependencies)
            - [Installing Specify 6](#installing-specify-6)
            - [Cloning Specify 7 source repository](#cloning-specify-7-source-repository)
            - [Setting up Python Virtual Environment](#setting-up-python-virtual-environment)
            - [Building](#building)
            - [Adjusting settings files](#adjusting-settings-files)
            - [Turning on debugging](#turning-on-debugging)
            - [The development server](#the-development-server)
            - [The Specify 7 worker](#the-specify-7-worker)
            - [Installing production requirements](#installing-production-requirements)
            - [Setting up Apache](#setting-up-apache)
            - [Restarting Apache](#restarting-apache)
    - [Updating Specify 7](#updating-specify-7)
    - [Updating the database (Specify 6) version](#updating-the-database-specify-6-version)
    - [Localizing Specify 7](#localizing-specify-7)

## Changelog

Changelog is available in [CHANGELOG.md](./CHANGELOG.md)

# Installation

We encourage all users to read our documentation on the Community Forum
regarding installing and deploying Specify –
[**Specify 7 Installation Instructions**](https://discourse.specifysoftware.org/t/specify-7-installation-instructions/755).

If you are an existing Specify 6 user who is looking to evaluate Specify 7, you
can contact [support@specifysoftware.org](mailto:support@specifysoftware.org)
along with a copy of your database and we can configure a temporary deployment
for evaluation purposes.

## Docker Installation (Recommended)

### Specify Collections Consortium (SCC) Members:

We encourage members to use
our  [Dockerized compositions](https://github.com/specify/docker-compositions)
of Specify 7. You can choose your desired version, make the necessary
adjustments and then run a single command to get everything
working. It is very simple and can be easily updated when new versions are
released. Documentation for deploying Specify
using Docker is available within the repository.

[**📨 Click here to request
access
**](mailto:support@specifysoftware.org?subject=Requesting%20Docker%20Repository%20Access&body=My%20GitHub%20username%20is%3A%20%0D%0AMy%20Specify%20Member%20Institution%20is%3A%20%0D%0AAdditional%20Questions%20or%20Notes%3A%20)
or email  [support@specifysoftware.org](mailto:support@specifysoftware.org)
with your GitHub username, member
institution or collection, and any additional questions you have for us.

### Non-Members:

If your institution is not a member of the Specify Collections Consortium, you
can follow
the [local installation instructions](#local-installation) below or
contact [membership@specifysoftware.org](mailto:membership@specifysoftware.org)
to learn more about joining the SCC to
receiving configuration assistance, support, and hosting services if you are
interested.

## Local Installation

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

### Installing system dependencies

Specify 7 requires Python 3.8. Ubuntu 20.04 LTS is recommended. For
other distributions these instructions will have to be adapted.

Ubuntu 20.04 LTS:

```shell
sudo apt install -y curl
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get -y install --no-install-recommends \
  build-essential \
  git \
  libldap2-dev \
  libmariadbclient-dev \
  libsasl2-dev \
  nodejs \
  python3-venv \
  python3.8 \
  python3.8-dev \
  redis \
  unzip
```

CentOS 7 / Red Hat 7:

```shell
yum install -y epel-release sudo wget
yum install -y \
  gcc make \
  git \
  openldap-devel \
  mariadb-devel \
  nodejs \
  npm \
  java-11-openjdk-headless \
  python36-virtualenv \
  python36 \
  python36u-devel \
  redis \
  unzip
```

Afterward, please make sure you have Node.js 18 installed:

```
node -v
```

### Installing Specify 6

A copy of the most recent Specify 6 release is required on the server
as Specify 7 makes use of resource files. A Java runtime is required
to execute the Specify 6 installer, but is not needed to run
Specify 7. It is possible to copy the Specify 6 install from another
Linux system to avoid the need to install Java on the server.

```shell
wget https://update.specifysoftware.org/6802/Specify_unix_64.sh
sh Specify_unix_64.sh -q -dir ./Specify6.8.03
sudo ln -s $(pwd)/Specify6.8.03 /opt/Specify
```

### Cloning Specify 7 source repository

Clone this repository.

```shell
git clone https://github.com/specify/specify7.git
```

You will now have a specify7 directory containing the source
tree.

Note, by default, `git clone` checks out the `production` branch of Specify 7.
That branch contains the latest tested features and bug fixes. If you prefer a
more stable release, you can switch to one of our tagged released.

```shell
cd specify7
git checkout tags/v7.8.6
```

Tagged releases are coming out every other week and undergo more testing.

See [the list of tags](https://github.com/specify/specify7/tags) to check what's
the latest stable release.

### Adjusting settings files

In the directory `specify7/specifyweb/settings` you will find the
`specify_settings.py` file. Make a copy of this file as
`local_specify_settings.py` and edit it. The file contains comments
explaining the various settings.

### Setting up Python Virtual Environment

Using a Python
[virtual environment](https://docs.python-guide.org/en/latest/dev/virtualenvs/)
will avoid version conflicts with other Python libraries on your
system. Also, it avoids having to use a superuser account to install
the Python dependencies.

```shell
python3.8 -m venv specify7/ve
specify7/ve/bin/pip install wheel
specify7/ve/bin/pip install --upgrade -r specify7/requirements.txt
```

### Building

To build Specify 7 use the default make target.

```shell
cd specify7
source ve/bin/activate
make
```

> Note, if `source` command is not available on your system, try running
> `. ve/bin/activate` instead

Other make targets:

#### `make build`

Runs all necessary build steps.

#### `make frontend`

Installs or updates Javascript dependencies and builds the Javascript
modules only.

#### `make clean`

Removes all generated files.

The following targets require the virualenv to be activated:

#### `make pip_requirements`

Install or updates Python dependencies.

#### `make django_migrations`

Applies Specify schema changes to the database named in the
settings. This step may fail if the master user configured in the
settings does not have DDL privileges. Changing the `MASTER_NAME` and
`MASTER_PASSWORD` settings to the MySQL root user will allow the
changes to be applied. Afterward, the master user settings can be
restored.

#### `make runserver`

A shortcut for running the Django development server.

#### `make webpack_watch`

Run webpack in watch mode so that changes to the frontend source code
will be automatically compiled. Useful during the development process.

### Turning on debugging

For development purposes, Django debugging should be turned on. It
will enable stack traces in responses that encounter exceptions, and
allow operation with the unoptimized Javascript files.

Debugging can be enabled by creating the file
`specify7/specifyweb/settings/debug.py` with the contents, `DEBUG = True`.

### The development server

> NOTE: development server should only be run in debug mode. See previous
> section for instructions on how to turn on debugging.

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

### The Specify 7 worker

Beginning with v7.6.0 the Specify WorkBench upload and validate
operations are carried out by a separate worker process using a
[Celery](https://docs.celeryproject.org/en/master/index.html) job
queue with
[Reddis](https://docs.celeryproject.org/en/master/getting-started/backends-and-brokers/redis.html)
as the broker. The worker process can be started from the commandline
by executing:

```shell
cd specify7
celery -A specifyweb worker -l INFO --concurrency=1
```

For deployment purposes it is recommended to configure a systemd unit
to automatically start the Specify 7 worker process on system start up
by executing the above command within the installation directory. It
is possible to run Redis and worker process on a separate server and
to provision multiple worker processes for high volume
scenarios. Contact the Specify team about these use cases.

### Installing production requirements

For production environments, Specify7 can be hosted by Apache. The
following packages are needed:

- Apache
- mod-wsgi to connect Python to Apache

Ubuntu:

```shell
sudo apt-get install apache2 libapache2-mod-wsgi-py3
```

CentOS / Red Hat:

```shell
yum install httpd python3-mod_wsgi
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

Ubuntu:

```shell
sudo rm /etc/apache2/sites-enabled/000-default.conf
sudo ln -s $(pwd)/specify7/local_specifyweb_apache.conf /etc/apache2/sites-enabled/
```

CentOS / Red Hat:

```shell
sudo ln -s $(pwd)/specify7/local_specifyweb_apache.conf /etc/httpd/conf.d/
```

### Restarting Apache

After changing Apache's config files restart the service.

Ubuntu:

```shell
sudo systemctl restart apache2.service
```

CentOS / Red Hat:

```shell
sudo systemctl restart httpd.service
```

### Nginx configuration

Specify 7 is web-server agnostic.
Example [nginx.conf](https://github.com/specify/specify7/blob/production/nginx.conf)
(note, you would have to adjust the host names and enable HTTPs).

## Updating Specify 7

Specify 7.4.0 and prior versions were based on Python 2.7. If updating
from one of these versions, it will be necessary to install Python 3.8
by running the `apt-get` commands in the
[Install system dependencies](#install-system-dependencies) and the
[Production requirements](#production-requirements) steps. Then
proceed as follows:

0. Backup your Specify database using MySQL dump or the Specify backup
   and restore tool.

1. Clone or download a new copy of this repository in a directory next
   to your existing installation.

   `git clone https://github.com/specify/specify7.git specify7-new-version`

2. Copy the settings from the existing to the new installation.

   `cp specify7/specifyweb/settings/local* specify7-new-version/specifyweb/settings/`

3. Make sure to update the `THICK_CLIENT_LOCATION` setting in
   `local_specify_settings.py`, if you are updating the Specify 6
   version.

4. Update the system level dependencies by executing the _apt-get_
   command in the [Installing system
   dependencies](#installing-system-dependencies) section.

5. Create a new virtualenv for the new installation by following the
   [Python Virtual Environment](#python-virtual-environment) section
   for the new directory.

6. [Build](#building) the new version of Specify 7.

7. Test it out with the [development server](#the-development-server).

8. Deploy the new version by updating your Apache config to replace
   the old installation paths with the new ones and restarting Apache.

9. Configure the Specify 7 worker process to execute at system start
   up as described in [The Specify 7 worker](#the-specify-7-worker) section.

## Updating the database (Specify 6) version

The Specify database is updated from one version to the next by the
Specify 6 application. To update the database version connect to the
database with a new version of Specify 6 and follow the Specify 6
update procedures.

Once the database version is updated, a corresponding copy of Specify
6 must be provided to the Specify 7 server by repeating
the [Installing Specify 6](#installing-specify-6) section of this guide for the
new version of Specify 6.

[![analytics](https://www.google-analytics.com/collect?v=1&t=pageview&dl=https%3A%2F%2Fgithub.com%2Fspecify%2Fspecify7&uid=readme&tid=UA-169822764-3)]()

## Localizing Specify 7

Specify 7 interface is localized to a few languages out of the box. We welcome
contributions of new translations. We are using
[Weblate](https://hosted.weblate.org/projects/specify-7/) continuous
localization
platform.
[Instructions on how you can contribute](https://discourse.specifysoftware.org/t/get-started-with-specify-7-localization/956)
