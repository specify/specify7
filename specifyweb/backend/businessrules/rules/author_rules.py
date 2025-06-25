from django.db.models import Max
from specifyweb.businessrules.orm_signal_handler import orm_signal_handler
from specifyweb.specify.models import Author


@orm_signal_handler('pre_save', 'Author')
def author_pre_save(author):
    if author.id is None:
        if author.ordernumber is None:
            # this should be atomic, but whatever
            others = Author.objects.filter(referencework=author.referencework)
            top = others.aggregate(Max('ordernumber'))['ordernumber__max'] or 0
            author.ordernumber = top + 1
