# Main Specify Settings file

import os
import sys
sys.dont_write_bytecode = True

ALLOW_SPECIFY6_PASSWORDS = True

from .specify_settings import *

try:
    from .local_specify_settings import *
except ImportError:
    pass

try:
    from .ldap_settings import *
except ImportError:
    AUTH_LDAP_SERVER_URI = None

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
        'OPTIONS': DATABASE_OPTIONS,
        'TEST': {
            }
    },
 }

def get_sa_db_url(db_name):
    return 'mysql://%s:%s@%s:%s/%s?charset=utf8' % (
        MASTER_NAME,
        MASTER_PASSWORD,
        DATABASE_HOST,
        DATABASE_PORT or 3306,
        db_name)

SA_DATABASE_URL = get_sa_db_url(DATABASE_NAME)

SA_TEST_DB_URL = get_sa_db_url(f'test_{DATABASE_NAME}')

# Prevent MySQL connection timeouts
SA_POOL_RECYCLE = 3600

SPECIFY_THICK_CLIENT = os.path.expanduser(THICK_CLIENT_LOCATION)

SPECIFY_CONFIG_DIR = os.path.join(SPECIFY_THICK_CLIENT, "config")

RO_MODE = False

# Local time zone for this installation. All choices can be found here:
# https://en.wikipedia.org/wiki/List_of_tz_zones_by_name (although not all
# systems may support all possibilities). When USE_TZ is True, this is
# interpreted as the default user time zone.
TIME_ZONE = os.environ.get('TIME_ZONE', 'America/Chicago')

# If you set this to True, Django will use timezone-aware datetimes.
USE_TZ = os.environ.get('USE_TZ', False)

# Language code for this installation. All choices can be found here:
# http://www.i18nguy.com/unicode/language-identifiers.html
LANGUAGE_CODE = 'en-us'

LOCALE_PATHS = (
    os.path.join(
        os.path.abspath(os.path.dirname(__name__)),
        'frontend','locale'
    ),
)

# On any changes here, also update languageCodeMapper in
# /specifyweb/frontend/js_src/lib/localization/utils/config.ts
# Available language codes:
# http://www.i18nguy.com/unicode/language-identifiers.html
LANGUAGES = [
    ('en-us', 'English'),
    ('ru-ru', 'русский'),
    ('uk-ua', 'українська'),
    ('fr-fr', 'français'),
    ('es-es', 'español'),
    ('de-ch', 'deutsch (schweiz)'),
    ('pt-br', 'português (brasil)'),
]

SITE_ID = 1

# If you set this to False, Django will make some optimizations so as not
# to load the internationalization machinery.
USE_I18N = True

# If you set this to False, Django will not format dates, numbers and
# calendars according to the current locale
USE_L10N = True

LANGUAGE_COOKIE_NAME='language'

# Absolute filesystem path to the directory that will hold user-uploaded files.
# Example: "/home/media/media.lawrence.com/media/"
MEDIA_ROOT = ''

# URL that handles the media served from MEDIA_ROOT. Make sure to use a
# trailing slash.
# Examples: "https://media.lawrence.com/media/", "https://example.com/media/"
MEDIA_URL = ''

# Absolute path to the directory static files should be collected to.
# Don't put anything in this directory yourself; store your static files
# in apps' "static/" subdirectories and in STATICFILES_DIRS.
# Example: "/home/media/media.lawrence.com/static/"
STATIC_ROOT = ''

# URL prefix for static files.
# Example: "https://media.lawrence.com/static/"
STATIC_URL = '/static/'

# URL prefix for admin static files -- CSS, JavaScript and images.
# Make sure to use a trailing slash.
# Examples: "https://foo.com/static/admin/", "/static/admin/".
ADMIN_MEDIA_PREFIX = '/static/admin/'

# Additional locations of static files
STATICFILES_DIRS = (
    # Put strings here, like "/home/html/static" or "C:/www/django/static".
    # Always use forward slashes, even on Windows.
    # Don't forget to use absolute paths, not relative paths.
    ('config', SPECIFY_CONFIG_DIR),
)

# Add web app manifest
WEBPACK_LOADER = {
    'MANIFEST_FILE': os.path.join(SPECIFY_CONFIG_DIR, "/static/manifest.json"),
}

# List of finder classes that know how to find static files in
# various locations.
STATICFILES_FINDERS = (
    'django.contrib.staticfiles.finders.FileSystemFinder',
    'django.contrib.staticfiles.finders.AppDirectoriesFinder',
#    'django.contrib.staticfiles.finders.DefaultStorageFinder',
)

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [
            # insert your TEMPLATE_DIRS here
        ],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                # Insert your TEMPLATE_CONTEXT_PROCESSORS here or use this
                # list if you haven't customized them:
                'django.contrib.auth.context_processors.auth',
                'django.template.context_processors.debug',
                'django.template.context_processors.i18n',
                'django.template.context_processors.media',
                'django.template.context_processors.static',
                'django.template.context_processors.tz',
                'django.contrib.messages.context_processors.messages',
                'django.template.context_processors.request',
            ],
        },
    },
]

MIDDLEWARE = [
#    'middleware.profilemiddleware.ProfileMiddleware',
    'django.middleware.gzip.GZipMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.locale.LocaleMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'specifyweb.context.middleware.ContextMiddleware',
    'specifyweb.permissions.middleware.PermissionsMiddleware',
    'specifyweb.middleware.general.GeneralMiddleware',
]

ROOT_URLCONF = 'specifyweb.urls'

INSTALLED_APPS = (
    'django.contrib.sessions',
    'django.contrib.staticfiles',
    'django.contrib.contenttypes',
    'django.contrib.auth',
    'specifyweb.specify',
    'specifyweb.permissions',
    'specifyweb.accounts',
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
    'specifyweb.notifications',
    'specifyweb.export',
    'specifyweb.raven_placeholder' if RAVEN_CONFIG is None else 'raven.contrib.django.raven_compat',
)

AUTH_USER_MODEL = 'specify.Specifyuser'

DEFAULT_AUTO_FIELD = 'django.db.models.AutoField'

AUTHENTICATION_BACKENDS = []
if ALLOW_SUPPORT_LOGIN:
    AUTHENTICATION_BACKENDS.append('specifyweb.specify.support_login.SupportLoginBackend')

if ALLOW_SPECIFY6_PASSWORDS:
    AUTHENTICATION_BACKENDS.append('django.contrib.auth.backends.ModelBackend')

if AUTH_LDAP_SERVER_URI is not None:
    AUTHENTICATION_BACKENDS.append('django_auth_ldap.backend.LDAPBackend')

LOGIN_REDIRECT_URL = '/'

SESSION_ENGINE = 'django.contrib.sessions.backends.file'
SESSION_EXPIRE_AT_BROWSER_CLOSE = True

JAVA_PATH = '/usr/bin/java'

DATA_UPLOAD_MAX_MEMORY_SIZE = 419430400  # 300mb
FILE_UPLOAD_MAX_MEMORY_SIZE = 104857600  # 100mb

try:
    from .local_logging_settings import LOGGING
except ImportError:
    from .logging_settings import LOGGING

try:
    from .local_settings import *
except ImportError:
    pass

SILENCED_SYSTEM_CHECKS = [
    "fields.W342", # Allow ForeignKey(unique=True) instead of OneToOneField without gettig a warning
]
