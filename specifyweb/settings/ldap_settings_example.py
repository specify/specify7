"""
Example settings for LDAP authentication for Specify 7.

LDAP authentication uses the django-auth-ldap library.
See http://django-auth-ldap.readthedocs.io/en/stable/

Copy this file to ldap_settings.py and adjust the appropriate values to
enable LDAP authentication.
"""

import ldap
from django_auth_ldap.config import LDAPSearch, PosixGroupType
from .specify_ldap import UserTypeMap


# This section is LDAP server configuration and user search.
#
# See http://django-auth-ldap.readthedocs.io/en/stable/authentication.html
# for more information about how these and other settings are used.

AUTH_LDAP_SERVER_URI = "ldap://ldap-test.specifycloud.org"

AUTH_LDAP_BIND_DN = "cn=specify-auth,dc=ldap-test,dc=specifycloud,dc=org"
AUTH_LDAP_BIND_PASSWORD = "authpassword"

AUTH_LDAP_USER_SEARCH = LDAPSearch("ou=users,dc=ldap-test,dc=specifycloud,dc=org", ldap.SCOPE_SUBTREE, "(cn=%(user)s)")


# This section configures the interaction with LDAP groups.
#
# See http://django-auth-ldap.readthedocs.io/en/stable/groups.html

AUTH_LDAP_GROUP_SEARCH = LDAPSearch("ou=groups,dc=ldap-test,dc=specifycloud,dc=org", ldap.SCOPE_SUBTREE, "(objectClass=posixGroup)")
AUTH_LDAP_GROUP_TYPE = PosixGroupType()

AUTH_LDAP_REQUIRE_GROUP = "cn=specify-login,ou=groups,dc=ldap-test,dc=specifycloud,dc=org"


# The following are Specify specific settings.
#
# The django-auth-ldap configuration described in
# http://django-auth-ldap.readthedocs.io/en/stable/users.html is
# mostly not supported because the Specify user creation is largely
# constrained by legacy Specify 6 requirements.
#
# Users are matched through the user.name field. Existing Specify
# users may need their usernames adjusted to match the name used to
# authenticate with LDAP.
#
# If a user successfully authenticates with LDAP but is unknown to
# Specify, a new user will be created along with Specify agents for
# each division with first and last name taken from the LDAP givenName
# and sn attributes. This happens in ../specify/ldap_extras.py


# Set to true to allow login using existing Specify 6 passwords
# that are stored encrypted in the Specify database.

ALLOW_SPECIFY6_PASSWORDS = False


# At each successful LDAP login, the user's Specify usertype and admin
# status will be adjusted according to the following mapping to LDAP
# group names. If a user is in multiple groups, they will receive the
# most privileged usertype of the groups. If no groups match, the user
# will be given usertype Guest.
#
# The usertype assignment only occurs at the time of login. Changing
# a user's LDAP group membership will have no effect on logged in
# users until they login after the change.

SPECIFY_LDAP_USERTYPE_MAP = UserTypeMap(
    admin='specify-admin',
    manager='specify-manager',
    full_access='specify-full-access',
    limited_access='specify-limited-access',
)


