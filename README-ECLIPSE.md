Eclipse Quick Start Instructions
================================
(warning: These instructions have not been tested in some time.)

These instructions assume you have installed the required dependencies
as outlined in the first part of the [generic
instructions](README.md).

After following these steps you will have the Specify webapp set up
and runnable as an Eclipse project.

Install the PyDev and EGit Eclipse plug-ins.
--------------------------------------------
In the 'Eclipse -> Help -> Install New Software...' dialog add
[http://pydev.org/updates](http://pydev.org/updates) for PyDev and
[http://download.eclipse.org/egit/updates](http://download.eclipse.org/egit/updates)
for EGit. Restart Eclipse after the plug-ins are installed.

Make sure PyDev has found your Python runtime.
----------------------------------------------
Open the 'Eclipse -> Window -> Preferences' dialog. Open the 'PyDev >
Interpreter - Python' resource and verify that there is a 'python'
entry under 'Python Interpreters' and that the 'Libraries' tab
contains a 'System libs' entry. If these are not present, use the
'Auto Config' button. If your Python installation is still not found,
consult the PyDev documentation.

Use EGit to checkout the specifyweb source tree.
---------------------------------------------------
Open the 'Eclipse -> File -> Import...' dialog and choose the 'Git ->
Projects from Git' option and click 'Next >'.

In the 'Select a Git Repository' dialog click the 'Clone...' button on
the right. Paste `https://github.com/specify/specifyweb.git`
into the 'URI' field on the 'Source Git Repository' dialog. Several
fields will auto-fill.

Make sure 'Store in Secure Store' is unchecked. Then click 'Next >' to
proceed to the 'Branch Selection' dialog.

Choose 'Select All' and click 'Next >' to proceed to the 'Local
Destination' dialog. All fields will be auto-filled with reasonable
values, so click 'Finish' to return to the 'Select a Git Repository'
dialog.

The dialog will now contain 'specifyweb' as an option. Select it
and click 'Next >' to proceed to 'Select a wizard to use for importing
projects'.

Choose 'Import Existing Projects', click 'Next >', and then choose
'Select All' on the 'Import Projects' dialog. Click 'Finish' to
complete the import.

Set database, username, and password.
-------------------------------------
Edit the `settings.py` file in the specifyweb project and configure
the `DATABASES` section as follows, choosing appropriate values for
`NAME`, `USER`, and `PASSWORD`:

    DATABASES = {
        'default': {
            'ENGINE': 'specifyweb.hibernateboolsbackend.backends.mysql',
            'NAME': 'kuplant',   # name of a Specify 6.4 mysql database
            'USER': 'Master',    # mysql user with full privileges to that DB
            'PASSWORD': 'MasterPassword',
            'HOST': '',    # Set to empty string for localhost.
            'PORT': '',    # Set to empty string for default.
        }
    }


Sync the database:
------------------
The authentication system in django makes use of a couple extra tables. Run
this command from the `specifyweb` directory to generate them:

    python manage.py syncdb
    
Alternatively, you could add an Eclipse run configuration based on 'PyDev: Django'
with the syncdb argument.
    
Run the specifyweb project to start the test server.
-------------------------------------------------------
Select the specifyweb project from the Package Explorer and then
'Run -> Run As -> PyDev: Django'.

Visit the running app with your browser.
----------------------------------------
Paste this URL in your browser's location bar:
[http://127.0.0.1:8000](http://127.0.0.1:8000)
