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

Install the Python dependencies.
----------------------------------
Pip is used to install the required Python libraries. For development
purposes you may wish to use a Python virtual environment. On a
dedicated server for deployment, it is simpler to install the
requirements global which requires running pip as superuser.

    pip install -r specify7/requirements.txt


Generate the front end.
-----------------------
The Javascript dependencies and sources for the browser need to be
packaged.

    make -C specify7

When the Specify7 repository is updated, this step should be repeated.

Adjust settings files.
-------------------------
In the directory `specify7/specifyweb/settings` you will find the
`specify_settings.py` file. Make a copy of this file as
`local_specify_settings.py` and edit it. The file contains comments
explaining the various settings.
    

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

