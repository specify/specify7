from uuid import uuid4
from os.path import join as join_path, dirname, abspath
from mimetypes import guess_type, guess_all_extensions

from django.http import HttpResponse
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import csrf_exempt

from specify.models import Attachment

ATTACHMENT_DIR = join_path(abspath(dirname(__file__)), 'static', 'attachments') 

@login_required
@require_POST
@csrf_exempt
def upload(request):
    assert len(request.FILES) == 1
    f = request.FILES.values()[0]
    filename = make_attachment_filename(f.name)
    with open(join_path(ATTACHMENT_DIR, filename), 'wb') as fp:
        for chunk in f.chunks():
            fp.write(chunk)

    attachment = Attachment.objects.create(
        attachmentlocation=filename,
        mimetype=f.content_type,
        origfilename=f.name)

    return HttpResponse(str(attachment.id), content_type='text/plain')

def make_attachment_filename(filename):
    uuid = str(uuid4())
    mimetype, encoding = guess_type(filename)
    for extension in guess_all_extensions(mimetype):
        if filename.lower().endswith(extension): break
    else:
        extension = ''
    return uuid + extension
