from django.http import HttpResponse, HttpResponseForbidden
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_POST
from django.conf import settings

from specifyweb.specify.views import openapi
from ...specify.auth.encryption import encrypt


def make_master_key(userpass):
    db_settings = settings.DATABASES['default']
    masteruser = db_settings['USER']
    masterpass = db_settings['PASSWORD']
    return encrypt(masteruser + ',' + masterpass, userpass)


@openapi(schema={
    'post': {
        "requestBody": {
            "required": True,
            "description": "User's password",
            "content": {
                "application/x-www-form-urlencoded": {
                    "schema": {
                        "type": "object",
                        "properties": {
                            "password": {
                                "type": "string",
                                "description": "User's password",
                            },
                        },
                        "required": ['password'],
                        'additionalProperties': False
                    }
                }
            }
        },
        "responses": {
            "200": {
                "description": "Master key",
                "content": {
                    "text/plain": {
                        "schema": {
                            "type": "string",
                        }
                    }
                }
            },
            "403": {"description": "Password was incorrect."}
        }
    },
})
@require_POST
@login_required
def master_key(request):
    "Returns a master key for Specify 6 logins. Requires the user's 'password' as a POST parameter."
    password = request.POST['password']
    if request.specify_user.check_password(password):
        return HttpResponse(make_master_key(password), content_type='text/plain')
    else:
        return HttpResponseForbidden()
