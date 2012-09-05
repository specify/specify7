from django.db import connection, transaction

ATTEMPTS = 5

def do_autonumbering(bundle, request):
    autonumber(bundle.obj)
    return bundle

@transaction.commit_on_success
def autonumber(obj):
    if obj.__class__.__name__ != "Collectionobject":
        return

    print connection.is_managed()
    try:
        connection.cursor().execute('lock tables collectionobject write')
        max_catnum = obj.__class__.objects.all().order_by('-catalognumber')[0].catalognumber
        new_catnum = '%0.9d' % (int(max_catnum) + 1)
        obj.catalognumber = new_catnum 
        obj.save()
    finally:
        connection.cursor().execute('unlock tables')

    print obj.catalognumber

