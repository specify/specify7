from django.http import HttpResponse, HttpResponseForbidden
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_POST
from django.conf import settings

from .encryption import encrypt


def make_master_key(userpass):
    db_settings = settings.DATABASES['default']
    masteruser = db_settings['USER']
    masterpass = db_settings['PASSWORD']
    return encrypt(masteruser + ',' + masterpass, userpass)


@require_POST
@login_required
def master_key(request):
    password = request.POST['password']
    if request.specify_user.check_password(password):
        return HttpResponse(make_master_key(password), content_type='text/plain')
    else:
        return HttpResponseForbidden()
