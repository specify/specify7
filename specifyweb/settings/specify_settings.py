import os

# A list of strings representing the host/domain names that Specify can serve
# This is a security measure to prevent HTTP Host header attacks.
# Values in the list can be fully qualified domain names (like www.example.com)
# or a portion of a domain name beginning with a period (like .example.com).
# Values beginning with a period are treated as subdomain wildcards.
# So .example.com would match any subdomain of example.com: www.example.com,
# test.example.com, etc.
#
# See https://docs.djangoproject.com/en/4.2/ref/settings/#allowed-hosts
#
# WARNING: the default setting of '*' is potentially insecure: allowing all
# hosts, essentially disabling Host header validation.
ALLOWED_HOSTS = ['*']

# A list of trusted origins for unsafe requests (POST, PUT, DELETE) to help
# protect against Cross Site Request Forgery attacks.
# An unsafe request that did not originate from one of these trusted origins
# will be rejected.
# * can be used as a wildcard to match against subdomains.
# For instance, https://*.example.com allows all subdomains of example.com.
#
# The scheme (http, https) MUST be included in each origin.
#
# See https://docs.djangoproject.com/en/4.2/ref/settings/#csrf-trusted-origins
#
# To learn more about CSRF protection in Specify (Django apps in general), see:
# https://docs.djangoproject.com/en/4.2/ref/csrf/
#
# WARNING: the default setting of https://* and http://* is potentially
# insecure and trusts all origins (the request must still be an ALLOWED_HOST
# and have the CSRF cookie set)
CSRF_TRUSTED_ORIGINS = ['https://*', 'http://*']


# Specify 7 requires the files from a Specify 6 install.
# This setting should point to a directory containing an installation
# of Specify 6 of the same version as the Specify database.
THICK_CLIENT_LOCATION = '/opt/Specify'
SPECIFY_CONFIG_DIR = os.environ.get(
    'SPECIFY_CONFIG_DIR', os.path.join(THICK_CLIENT_LOCATION, "config"))

# Set the database name to the MySQL database you
# want to access which must be a Specify database already
# be initialized from a backup or by using the Specify Wizard
# from a Specify 6 installation.
DATABASE_NAME = 'SpecifyDB'

# Database hostname or IP. Will use localhost:3306 by default.
DATABASE_HOST = ''
DATABASE_PORT = ''

# Any extra options for the database connection
# https://docs.djangoproject.com/en/4.2/ref/settings/#std-setting-OPTIONS
DATABASE_OPTIONS = {}

# The master user login. This is the MySQL user used to connect to the
# database. This can be the same as the Specify 6 master user.
MASTER_NAME = 'MasterUser'
MASTER_PASSWORD = 'MasterPassword'
MIGRATOR_NAME = 'MasterUser'
MIGRATOR_PASSWORD = 'MasterPassword'
APP_USER_NAME = 'MasterUser'
APP_USER_PASSWORD = 'MasterPassword'

# MASTER_NAME = os.environ.get('MASTER_NAME', 'root')
# MASTER_PASSWORD = os.environ.get('MASTER_NAME', 'password')
# MIGRATOR_NAME = os.environ.get('MIGRATOR_NAME', MASTER_NAME)
# MIGRATOR_PASSWORD = os.environ.get('MIGRATOR_PASSWORD', MASTER_PASSWORD)
# APP_USER_NAME = os.environ.get('APP_USER_NAME', MIGRATOR_NAME)
# APP_USER_PASSWORD = os.environ.get('APP_USER_PASSWORD', MIGRATOR_PASSWORD)

# The Specify web attachment server URL.
WEB_ATTACHMENT_URL = None

# The Specify web attachment server key.
WEB_ATTACHMENT_KEY = None

# The collection name to use with the web attachment server.
WEB_ATTACHMENT_COLLECTION = None

# If True, and WEB_ATTACHMENT_COLLECTION is None, attachments for each
# collection would be stored in separate folders
# Note, this is not recommended. See:
# https://github.com/specify/specify7/pull/2375/commits/5cb767121b135fc8ce1bcf0b3cd1724b1d452725#diff-688a4b186646bf0680896b3dc52d2c8c4c1f0fa7c510b482cc7671ed170def7eR28-R42
SEPARATE_WEB_ATTACHMENT_FOLDERS = False

# Set to true if the asset server requires auth token to get files.
WEB_ATTACHMENT_REQUIRES_KEY_FOR_GET = False

# Report runner service
REPORT_RUNNER_HOST = ''
REPORT_RUNNER_PORT = ''

# The message queue for the Specify 7 worker(s).
# This should point to a Redis server for sending jobs
# and retrieving results from the worker.
CELERY_BROKER_URL = "redis://localhost/0"
CELERY_RESULT_BACKEND = "redis://localhost/1"

# To allow anonymous use, set ANONYMOUS_USER to a Specify username
# to use for anonymous access.
ANONYMOUS_USER = None

# For exception logging using Sentry (https://github.com/getsentry/sentry).
RAVEN_CONFIG = None

# Support login mechanism.
ALLOW_SUPPORT_LOGIN = False
SUPPORT_LOGIN_TTL = 300

# Usage stats are transmitted to the following address.
# Set to None to disable.
STATS_URL = "https://stats.specifycloud.org/capture"
# STATS_2_URL = "https://stats-2.specifycloud.org/prod/AggrgatedSp7Stats"
STATS_2_URL = "pj9lpoo1pc.execute-api.us-east-1.amazonaws.com"

# Workbench uploader log directory.
# Must exist and be writeable by the web server process.
WB_UPLOAD_LOG_DIR = "/home/specify/wb_upload_logs"

# Asynchronously generated exports are placed in
# the following directory. This includes query result
# exports and Darwin Core archives.
DEPOSITORY_DIR = '/home/specify/specify_depository'

# Old notifications are deleted after this many days.
# If DEPOSITORY_DIR is being cleaned out with a
# scheduled job, this interval should be shorter
# than the clean out time, so that notifications
# are not left that refer to deleted exports.
NOTIFICATION_TTL_DAYS = 7

DISABLE_AUDITING = False

# Configure OpenID Connect SSO by defining
# identity providers below. An empty dict
# disables OIC login.
OAUTH_LOGIN_PROVIDERS = {
    # # Provider key represents the provider in the Specify system.
    # 'google': {
    #     # The title is displayed to the user in the UI.
    #     'title': "Google",

    #     # Obtain the client id and secret during the identity provider setup.
    #     'client_id': "**********.apps.googleusercontent.com",
    #     'client_secret': "*********************",

    #     # Specify will look for the OIC discovery endpoint at the below
    #     # url + '.well-known/openid-configuration'.
    #     'config': "https://accounts.google.com",

    #     # The OIC scopes to requests. Should include at least openid and email.
    #     'scope': "openid email",
    # },

    # # A working Phantauth config for test purposes only.
    # 'phantauth': {
    #     'title': "Phantauth",
    #     'config': "https://phantauth.net",
    #     'scope': "openid profile email",
    #     'client_id': "latlux~mqs8zoig_5e",
    #     'client_secret': "82yHd4XA",
    # },
}
