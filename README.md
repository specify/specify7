

Developer Instructions
========================

After completing these instructions you will be able to run the test
server and interact with the Django based Specify webapp in your
browser on your local machine.


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
        build-essential nodejs-legacy

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


Adjust settings files.
-------------------------
In the directory `specify7/specifyweb/settings` you will find the
`specify_settings.py` file. Make a copy of this file as
`local_specify_settings.py` and edit it. The file contains comments
explaining the various settings.
    

The development server.
-----------------------
Specify7 can be run using the Django development server. If you are
using Python virtual environment, you will of course need to activate
it first.

    python specify7/specifyweb/manage.py runserver

This will start a development server for testing purposes on
`localhost:8000`.  Debugging can be enabled by creating the file
`specify7/specifyweb/settings/debug.py` with the contents, `DEBUG =
True`.


Optimizing JS and CSS files.
----------------------------

The Javascript and CSS files that comprise the web app can be
optimized by `requirejs`. Then, instead of serving each file
separately, they are packaged into single optimized `main-built.js`
and `main-built.css` files.

    make -C specify7

When the Specify7 repository is updated, this step should be repeated.
