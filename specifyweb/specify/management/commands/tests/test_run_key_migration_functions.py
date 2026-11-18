from django.apps import apps
from django.test import TransactionTestCase
from django.db.models import Q

from specifyweb.backend.permissions.models import (
    LibraryRole,
    LibraryRolePolicy,
    Role,
    RolePolicy,
    UserPolicy,
    UserRole,
)
from specifyweb.specify.models import (
    Taxontreedefitem,
    Taxon,
    Locality
)
from specifyweb.specify.tests.test_api import ApiTests
from specifyweb.backend.patches.migration_utils import update_is_accepted, update_coordinates

from specifyweb.backend.businessrules.rules.cogtype_rules import SYSTEM_COGTYPES_PICKLIST

def create_taxon_ranks(treedef):
    root = Taxontreedefitem(
        treedef=treedef,
        parent=None,
        name="Taxonomy Root",
        rankid=0
    ).save()
    kingdom = Taxontreedefitem(
        treedef=treedef,
        parent=root,
        name="Kingdom",
        rankid=10
    ).save()
    phylum = Taxontreedefitem(
        treedef=treedef,
        parent=kingdom,
        name="Phylum",
        rankid=30
    ).save()
    class_rank = Taxontreedefitem(
        treedef=treedef,
        parent=phylum,
        name="Class",
        rankid=60
    ).save()

class RunKeyMigrationFunctionsTests(ApiTests, TransactionTestCase):
    def setUp(self):
        super().setUp()
        create_taxon_ranks(self.taxontreedef)

    def test_patches_updating_accepted(self):
        ranks = self.taxontreedef.treedefitems.all().order_by("rankid")
        root_node = Taxon.objects.create(
            name="Root",
            fullname="Root",
            rankid=0,
            parent=None,
            definition=self.taxontreedef,
            definitionitem=ranks[0]
        )
        Taxon.objects.bulk_create(
            [
                Taxon(
                    name="Kingdom1",
                    fullname="Kingdom1",
                    rankid=10,
                    parent=root_node,
                    definition=self.taxontreedef,
                    definitionitem=ranks[1]
                ),
                Taxon(
                    name="Kingdom2",
                    fullname="Kingdom2",
                    isaccepted=False,
                    acceptedtaxon=None,
                    rankid=10,
                    parent=root_node,
                    definition=self.taxontreedef,
                    definitionitem=ranks[1]
                ),
                Taxon(
                    name="Kingdom3",
                    fullname="Kingdom3",
                    isaccepted=False,
                    acceptedtaxon=None,
                    rankid=10,
                    parent=root_node,
                    definition=self.taxontreedef,
                    definitionitem=ranks[1]
                ),
                Taxon(
                    name="Kingdom4",
                    fullname="Kingdom4",
                    isaccepted=False,
                    acceptedtaxon=root_node,
                    rankid=10,
                    parent=root_node,
                    definition=self.taxontreedef,
                    definitionitem=ranks[1]
                )
            ]
        )
        self.assertExists(Taxon.objects.filter(isaccepted=False, acceptedtaxon__isnull=True))
        update_is_accepted(apps)
        self.assertNotExists(Taxon.objects.filter(isaccepted=False, acceptedtaxon__isnull=True))

        accepted_taxons = Taxon.objects.filter(isaccepted=True)
        self.assertEqual(len(accepted_taxons), 4)

    def test_patches_updating_coordinates(self):
        Locality.objects.bulk_create(
            [
                Locality(
                    localityname="Point Good",
                    latitude1=35.3450000000,
                    lat1text="35.345 N",
                    longitude1=-94.4500000000,
                    long1text="94.45 W",
                    srclatlongunit=0,
                    discipline=self.discipline
                ),
                Locality(
                    localityname="Dos Point",
                    latitude1=-12.5780000000,
                    lat1text="12.578 S",
                    latitude2=-12.9800000000,
                    lat2text="12.98 S",
                    longitude1=28.4500000000,
                    long1text="28.45 E",
                    longitude2=27.8790000000,
                    long2text="27.879 E",
                    srclatlongunit=0,
                    discipline=self.discipline
                ),
                Locality(
                    localityname="Point Mal",
                    latitude1=35.3450000000,
                    lat1text=None,
                    longitude1=-94.4500000000,
                    long1text="94.45 W",
                    srclatlongunit=0,
                    discipline=self.discipline
                ),
                Locality(
                    localityname="Foo",
                    latitude1=35.3450000000,
                    lat1text="35.345 N",
                    longitude1=-94.4500000000,
                    long1text=None,
                    srclatlongunit=0,
                    discipline=self.discipline
                ),
                Locality(
                    localityname="Bad",
                    latitude1=35.3450000000,
                    lat1text=None,
                    longitude1=-94.4500000000,
                    long1text=None,
                    srclatlongunit=0,
                    discipline=self.discipline
                ),
                Locality(
                    localityname="Bar Baz",
                    latitude1=-12.5780000000,
                    lat1text="12.578 S",
                    latitude2=-12.9800000000,
                    lat2text=None,
                    longitude1=28.4500000000,
                    long1text=None,
                    longitude2=27.8790000000,
                    long2text="27.879 E",
                    srclatlongunit=0,
                    discipline=self.discipline
                ),
                Locality(
                    localityname="Qux Quux",
                    latitude1=-12.5780000000,
                    lat1text=None,
                    latitude2=-12.9800000000,
                    lat2text="12.98 S",
                    longitude1=28.4500000000,
                    long1text="28.45 E",
                    longitude2=27.8790000000,
                    long2text=None,
                    srclatlongunit=0,
                    discipline=self.discipline
                ),
            ]
        )
        update_coordinates(apps)
        self.assertNotExists(
            Locality.objects.filter(
                Q(lat1text__isnull=True, latitude1__isnull=False) |
                Q(long1text__isnull=True, longitude1__isnull=False) |
                Q(lat2text__isnull=True, latitude2__isnull=False) |
                Q(long2text__isnull=True, longitude2__isnull=False)
            )
        )
