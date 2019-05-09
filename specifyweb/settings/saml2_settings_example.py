SAML2_AUTH = {
    # Pysaml2 Saml client settings (https://pysaml2.readthedocs.io/en/latest/howto/config.html)
    'SAML_CLIENT_SETTINGS': {
        # The optional entity ID string to be passed in the 'Issuer'
        # element of authn request, if required by the IDP.
        'entityid': 'https://demo.specifycloud.org/saml2_auth/acs/',
        'metadata': {
            'local': ['/home/specify/servers/demo/spmetadata.xml'],
            'remote': [{'url': 'https://samltest.id/saml/idp'}]
        },
        'service': {
            "sp": {
                "want_response_signed": False,
                "want_assertions_signed": False,
            }
        }
    },
    # Custom target redirect URL after the user get logged
    # in. Default to /admin if not set. This setting will be
    # overwritten if you have parameter ?next= specificed in the
    # login URL.
    'DEFAULT_NEXT_URL': '/accounts/choose_collection/',

    # Change Email/UserName/FirstName/LastName to corresponding SAML2
    # userprofile attributes.
    'ATTRIBUTES_MAP': {
        'username': 'uid', # Required.
        'email': 'mail',
        'first_name': 'givenName',
        'last_name': 'sn',
    },
    'TRIGGER': {
        'FIND_USER': 'specifyweb.specify.model_extras.get_user_for_saml',
        # 'NEW_USER': 'path.to.your.new.user.hook.method',
        # 'CREATE_USER': 'path.to.your.create.user.hook.method',
        # 'BEFORE_LOGIN': 'path.to.your.login.hook.method',
    },

    # Custom URL to validate incoming SAML requests against.
    # 'ASSERTION_URL': 'http://demo.specifycloud.org/saml2_auth/acs',

    # 'NEW_USER_PROFILE': {
    #     'USER_GROUPS': [],  # The default group name when a new user logs in
    #     'ACTIVE_STATUS': True,  # The default active status for new users
    #     'STAFF_STATUS': True,  # The staff status for new users
    #     'SUPERUSER_STATUS': False,  # The superuser status for new users
    # },
}

