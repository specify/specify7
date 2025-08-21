from optparse import make_option

from django.core.management.base import BaseCommand, CommandError

from specifyweb.specify.models import Taxon, Taxontreedefitem

class Command(BaseCommand):
    help = 'Prints a specify tree.'

    def handle(self, **options):
        tdis = Taxontreedefitem.objects.all().order_by('-rankid')
        ranks = [r.rankid for r in tdis]

        rank_hhn = {}
        for r in tdis:
            rank_hhn[r.rankid] = None


        for t in Taxon.objects.all().order_by('nodenumber'):
            rank_hhn[t.rankid] = t.highestchildnodenumber
            nn = t.nodenumber
            line = ['*-' if t.rankid == r else
                    '| ' if rank_hhn[r] > nn else
                    '/ ' if rank_hhn[r] == nn else
                    '  '
                    for r in ranks]
            self.stdout.write(''.join(line) + ' %s %d %d' % (t.name, t.nodenumber, t.highestchildnodenumber))
