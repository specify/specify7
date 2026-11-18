from django.test import SimpleTestCase

from specifyweb.backend.discipline_names import get_discipline_names


class DisciplineNamesTests(SimpleTestCase):
    def test_loads_shared_discipline_names(self):
        discipline_names = get_discipline_names()

        self.assertEqual(discipline_names['fish'], 'Ichthyology')
        self.assertIs(discipline_names, get_discipline_names())
