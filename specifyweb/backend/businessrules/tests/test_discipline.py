from specifyweb.specify import models
from specifyweb.specify.tests.test_api import ApiTests
from ..exceptions import BusinessRuleException

class DisciplineTests(ApiTests):
    def test_name_unique_in_division(self):
        models.Discipline.objects.create(
            name='foobar',
            geologictimeperiodtreedef=self.geologictimeperiodtreedef,
            geographytreedef=self.geographytreedef,
            division=self.division,
            datatype=self.datatype)

        with self.assertRaises(BusinessRuleException):
            models.Discipline.objects.create(
                name='foobar',
                geologictimeperiodtreedef=self.geologictimeperiodtreedef,
                geographytreedef=self.geographytreedef,
                division=self.division,
                datatype=self.datatype)

    def test_create_taxontreedef_if_null(self):
        discipline = models.Discipline.objects.create(
            name='foobar',
            geologictimeperiodtreedef=self.geologictimeperiodtreedef,
            geographytreedef=self.geographytreedef,
            division=self.division,
            datatype=self.datatype,
            taxontreedef=None)

        self.assertNotEqual(discipline.taxontreedef, None)
