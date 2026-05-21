from specifyweb.backend.businessrules.models import UniquenessRule, UniquenessRuleField
from specifyweb.specify.utils.autonumbering import get_tables_to_lock
from specifyweb.specify.tests.test_api import ApiTests


class TestGetTablesToLock(ApiTests):

    def test_collection_object(self):
        tables = get_tables_to_lock(
            self.collection, self.collectionobjects[0], ["catalognumber", "text1"]
        )
        self.assertEqual(
            tables,
            {
                "collection",
                "django_migrations",
                "collectionobject",
                "discipline",
                "uniquenessrule",
            },
        )

    def test_collecting_event(self):
        rule = UniquenessRule.objects.create(
            modelName="Collectingevent", discipline=self.discipline
        )
        UniquenessRuleField.objects.create(uniquenessrule=rule, fieldPath="text1")
        UniquenessRuleField.objects.create(
            uniquenessrule=rule,
            fieldPath="locality__geography__parent__definition__discipline",
            isScope=True,
        )

        integer_rule = UniquenessRule.objects.create(
            modelName="Collectingevent", discipline=self.discipline
        )

        UniquenessRuleField.objects.create(
            uniquenessrule=integer_rule, fieldPath="integer1"
        )
        UniquenessRuleField.objects.create(
            uniquenessrule=integer_rule, fieldPath="discipline", isScope=True
        )

        tables = get_tables_to_lock(
            self.collection, self.collectingevent, ["text1", "integer1"]
        )
        self.assertEqual(
            tables,
            {
                "django_migrations",
                "geography",
                "geographytreedef",
                "collectingevent",
                "locality",
                "discipline",
                "uniquenessrule",
            },
        )
