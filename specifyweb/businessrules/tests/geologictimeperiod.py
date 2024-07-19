
from unittest import skip
from django.db.models import ProtectedError

from specifyweb.specify import models
from specifyweb.specify.tests.test_api import ApiTests

class Geologictimeperiod(ApiTests):
    def setUp(self):
        super(Geologictimeperiod, self).setUp()

        self.rootgtp = models.Geologictimeperiod.objects.create(
            name="Eternity",
            definition=self.geologictimeperiodtreedef,
            definitionitem=self.geologictimeperiodtreedef.treedefitems.create(
                name="root",
                rankid=0))

    def test_delete_blocked_by_biostratspaleocontext(self):
        self.rootgtp.biostratspaleocontext.create(
            discipline=self.discipline)

        with self.assertRaises(ProtectedError):
            self.rootgtp.delete()

        self.rootgtp.biostratspaleocontext.all().delete()
        self.rootgtp.delete()

    def test_delete_blocked_by_chronosstratspaleocontext(self):
        self.rootgtp.chronosstratspaleocontext.create(
            discipline=self.discipline)

        with self.assertRaises(ProtectedError):
            self.rootgtp.delete()

        self.rootgtp.chronosstratspaleocontext.all().delete()
        self.rootgtp.delete()

    def test_delete_blocked_by_chronosstratendpaleocontext(self):
        t = models.Paleocontext.objects.create(
            discipline=self.discipline,
            chronosstratend=self.rootgtp)

        with self.assertRaises(ProtectedError):
            self.rootgtp.delete()

        t.delete()
        self.rootgtp.delete()

    @skip("this behavior was eliminated by https://github.com/specify/specify7/issues/136")
    def test_delete_cascades_to_deletable_children(self):
        age = self.rootgtp.definitionitem.children.create(
            name="Age",
            treedef=self.rootgtp.definition,
            rankid=self.rootgtp.definitionitem.rankid+100)

        first_age = self.rootgtp.children.create(
            name="First Age",
            definition=age.treedef,
            definitionitem=age)

        second_age = self.rootgtp.children.create(
            name="Second Age",
            definition=age.treedef,
            definitionitem=age)

        context = first_age.chronosstratspaleocontext.create(
            discipline=self.discipline)

        with self.assertRaises(ProtectedError):
            self.rootgtp.delete()

        context.delete()
        self.rootgtp.delete()
        self.assertEqual(models.Geologictimeperiod.objects.filter(id__in=(first_age.id, second_age.id)).count(), 0)

    @skip("not clear if this is correct.")
    def test_accepted_children_acceptedparent_set_to_null_on_delete(self):
        age = self.rootgtp.definitionitem.children.create(
            name="Age",
            treedef=self.rootgtp.definition,
            rankid=self.rootgtp.definitionitem.rankid+100)

        first_age = self.rootgtp.children.create(
            name="First Age",
            definition=age.treedef,
            definitionitem=age)

        second_age = self.rootgtp.children.create(
            name="Second Age",
            definition=age.treedef,
            definitionitem=age)

        age_of_magic = self.rootgtp.children.create(
            name="Age of Magic",
            definition=age.treedef,
            definitionitem=age,
            acceptedgeologictimeperiod=first_age)

        first_age.delete()

        self.assertEqual(
            models.Geologictimeperiod.objects.get(id=age_of_magic.id).acceptedgeologictimeperiod,
            None)
