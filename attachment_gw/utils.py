import sh
import os

from specify import models
from specify.models import Attachment

from views import ATTACHMENT_DIR, ATTACHMENT_THUMBS

def fetch():
    for attachment in Attachment.objects.all():
        url = 'http://anza.nhm.ku.edu/specifyassets/Ichthyology/originals/' + attachment.attachmentlocation
        filename = os.path.join(ATTACHMENT_DIR, attachment.attachmentlocation)
        sh.curl(url, o=filename)

def cleanup_tables():
    attachment_tables = [t for t in dir(models) if t.endswith('attachment')]
    to_delete = Attachment.objects
    for t in attachment_tables:
        exclude = getattr(models, t).objects.all().values_list('attachment_id')
        to_delete = to_delete.exclude(id__in=exclude)
    to_delete.delete()

def cleanup_files():
    removed = 0
    seen = 0
    for f in os.listdir(ATTACHMENT_DIR):
        seen += 1
        if Attachment.objects.filter(attachmentlocation=f).count() < 1:
            os.remove(os.path.join(ATTACHMENT_DIR, f))
            removed += 1

        print "removed %d / %d" % ( removed, seen )

def generate_thumbs():
    for attachment in Attachment.objects.filter(mimetype__istartswith='image'):
        generate_thumb(attachment.attachmentlocation)

def generate_thumb(filename):
    infile = os.path.join(ATTACHMENT_DIR, filename)
    basename = os.path.splitext(filename)[0]
    outfile = os.path.join(ATTACHMENT_THUMBS, basename + '.png')
    if os.path.exists(outfile): return
    try:
        sh.convert(infile, '-thumbnail', '160x160>', outfile)
    except sh.ErrorReturnCode as e:
        print e
