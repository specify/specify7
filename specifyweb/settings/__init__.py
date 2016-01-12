import os
import sys
sys.dont_write_bytecode = True

from .specify_settings import *

try:
    from .local_specify_settings import *
except ImportError:
    pass

try:
    from .debug import DEBUG
except ImportError:
    DEBUG = False

try:
    from .build_version import VERSION
except ImportError:
    raise Exception('Specify 7 needs to be built. Run make.')

if DEBUG:
    VERSION += "(debug)"

from .secret_key import SECRET_KEY

TEMPLATE_DEBUG = DEBUG

ALLOWED_HOSTS = ['*']

ADMINS = (
    # ('Your Name', 'your_email@example.com'),
)

MANAGERS = ADMINS

DATABASES = {
    'default': {
        'ENGINE': 'specifyweb.hibernateboolsbackend.backends.mysql',
        'NAME': DATABASE_NAME,
        'USER': MASTER_NAME,
        'PASSWORD': MASTER_PASSWORD,
        'HOST': DATABASE_HOST,
        'PORT': DATABASE_PORT,
     }
 }


TESTING_DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
#        'ENGINE': 'hibernateboolsbackend.backends.mysql',
        'NAME': "specifytest",
        'USER': "Master",
        'PASSWORD': "Master",
        'HOST': '127.0.0.1',
        'PORT': '3307',
    }
}

if 'test' in sys.argv:
    TESTING = True
    DATABASES = TESTING_DATABASES
    SA_DATABASE_URL = 'sqlite:///:memory:'
else:
    TESTING = False
    SA_DATABASE_URL = 'mysql://%s:%s@%s:%s/%s?charset=utf8' % (
        MASTER_NAME,
        MASTER_PASSWORD,
        DATABASE_HOST,
        DATABASE_PORT or 3306,
        DATABASE_NAME)

# Prevent MySQL connection timeouts
SA_POOL_RECYCLE = 3600

SPECIFY_THICK_CLIENT = os.path.expanduser(THICK_CLIENT_LOCATION)

SPECIFY_CONFIG_DIR = os.path.join(SPECIFY_THICK_CLIENT, "config")

RO_MODE = False

# Local time zone for this installation. Choices can be found here:
# http://en.wikipedia.org/wiki/List_of_tz_zones_by_name
# although not all choices may be available on all operating systems.
# On Unix systems, a value of None will cause Django to use the same
# timezone as the operating system.
# If running in a Windows environment this must be set to the same as your
# system time zone.
TIME_ZONE = 'America/Chicago'

# Language code for this installation. All choices can be found here:
# http://www.i18nguy.com/unicode/language-identifiers.html
LANGUAGE_CODE = 'en-us'

SITE_ID = 1

# If you set this to False, Django will make some optimizations so as not
# to load the internationalization machinery.
USE_I18N = True

# If you set this to False, Django will not format dates, numbers and
# calendars according to the current locale
USE_L10N = True

# Absolute filesystem path to the directory that will hold user-uploaded files.
# Example: "/home/media/media.lawrence.com/media/"
MEDIA_ROOT = ''

# URL that handles the media served from MEDIA_ROOT. Make sure to use a
# trailing slash.
# Examples: "http://media.lawrence.com/media/", "http://example.com/media/"
MEDIA_URL = ''

# Absolute path to the directory static files should be collected to.
# Don't put anything in this directory yourself; store your static files
# in apps' "static/" subdirectories and in STATICFILES_DIRS.
# Example: "/home/media/media.lawrence.com/static/"
STATIC_ROOT = ''

# URL prefix for static files.
# Example: "http://media.lawrence.com/static/"
STATIC_URL = '/static/'

# URL prefix for admin static files -- CSS, JavaScript and images.
# Make sure to use a trailing slash.
# Examples: "http://foo.com/static/admin/", "/static/admin/".
ADMIN_MEDIA_PREFIX = '/static/admin/'

# Additional locations of static files
STATICFILES_DIRS = (
    # Put strings here, like "/home/html/static" or "C:/www/django/static".
    # Always use forward slashes, even on Windows.
    # Don't forget to use absolute paths, not relative paths.
    ('config', SPECIFY_CONFIG_DIR),
)

# List of finder classes that know how to find static files in
# various locations.
STATICFILES_FINDERS = (
    'django.contrib.staticfiles.finders.FileSystemFinder',
    'django.contrib.staticfiles.finders.AppDirectoriesFinder',
#    'django.contrib.staticfiles.finders.DefaultStorageFinder',
)

# List of callables that know how to import templates from various sources.
TEMPLATE_LOADERS = (
    'django.template.loaders.filesystem.Loader',
    'django.template.loaders.app_directories.Loader',
#     'django.template.loaders.eggs.Loader',
)

MIDDLEWARE_CLASSES = (
#    'middleware.profilemiddleware.ProfileMiddleware',
    'django.middleware.gzip.GZipMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'specifyweb.context.middleware.ContextMiddleware'
)

ROOT_URLCONF = 'specifyweb.settings.urls'

TEMPLATE_DIRS = (
    # Put strings here, like "/home/html/django_templates" or "C:/www/django/templates".
    # Always use forward slashes, even on Windows.
    # Don't forget to use absolute paths, not relative paths.
)

INSTALLED_APPS = (
    'django.contrib.sessions',
    'django.contrib.staticfiles',
    'specifyweb.specify',
    'specifyweb.stored_queries',
    'specifyweb.businessrules',
    'specifyweb.express_search',
    'specifyweb.context',
    'specifyweb.attachment_gw',
    'specifyweb.frontend',
    'specifyweb.barvis',
    'specifyweb.report_runner',
    'specifyweb.interactions',
    'specifyweb.workbench',
    'specifyweb.raven_placeholder' if RAVEN_CONFIG is None else 'raven.contrib.django.raven_compat',
)

AUTH_USER_MODEL = 'specify.Specifyuser'

AUTHENTICATION_BACKENDS = (
    'specifyweb.specify.support_login.SupportLoginBackend',
    'django.contrib.auth.backends.ModelBackend',
)

LOGIN_REDIRECT_URL = '/'

SESSION_ENGINE = 'django.contrib.sessions.backends.file'
SESSION_EXPIRE_AT_BROWSER_CLOSE = True

JAVA_PATH = '/usr/bin/java'

try:
    from .local_logging_settings import LOGGING
except ImportError:
    from .logging_settings import LOGGING

try:
    from .local_settings import *
except ImportError:
    pass

