"""
Example settings for LDAP authentication for Specify 7.

LDAP authentication uses the django-auth-ldap library.
See http://django-auth-ldap.readthedocs.io/en/stable/

Copy this file to ldap_settings.py and adjust the appropriate values to
enable LDAP authentication.
"""

import ldap
from django_auth_ldap.config import LDAPSearch, PosixGroupType


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

AUTH_LDAP_GROUP_SEARCH = LDAPSearch(
    "ou=groups,dc=ldap-test,dc=specifycloud,dc=org",
    ldap.SCOPE_SUBTREE,
    "(objectClass=posixGroup)")

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
# status will be adjusted according to the following mapping function.

def SPECIFY_LDAP_USERTYPE_MAP(specify_usertype, ldap_user):
    """Map the LDAP user to a Specify user type.

    specify_usertype - A namedtuple of the possible user types.
    ldap_user - The LDAP user object that was authenticated.

    Must return one entry from specify_usertype.

    The usertype assignment only occurs at the time of login. Changing
    a user's LDAP group membership will have no effect on logged in
    users until they login after the change.
    """

    # (ldap_group, specify_usertype) in order of decreasing privilege
    mapping = (
        ('specify-admin', specify_usertype.admin),
        ('specify-manager', specify_usertype.manager),
        ('specify-full-access', specify_usertype.full_access),
        ('specify-limited-access', specify_usertype.limited_access),
    )

    # Return the most privileged user type that is mapped to a group
    # the user belongs to.
    for group, usertype in mapping:
        if group in ldap_user.group_names:
            return usertype

    return specify_usertype.guest


# At each successful LDAP login, the user's collection access will be
# updated according to the following function.

def SPECIFY_LDAP_COLLECTIONS(specify_collections, ldap_user):
    """Return a list of collections the user should have access to.

    specify_collections - A list of all collections in the database.
    ldap_user - The LDAP user object that was authenticated.

    The granting and removal of collection access only occurs at the
    time of login.
    """

    # This implementation will grant users access to any collection
    # when they are a member of the LDAP group named
    # "specify-collection-{COLLECTION-CODE}" where {COLLECTION-CODE}
    # is one of the values from the code field of the collection table.

    return [
        collection
        for collection in specify_collections
        if "specify-collection-" + collection.code in ldap_user.group_names
    ]
