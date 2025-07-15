from specifyweb.backend.interactions.cog_preps import is_consolidated_cog
from specifyweb.backend.interactions.tests.test_cog import TestCogInteractions


class TestIsConsolidatedCog(TestCogInteractions):

    def test_not_consolidated_on_empty_cog(self):
        self.assertFalse(is_consolidated_cog(None))

    def test_consolidated_correctly_inferred(self):
        self.assertTrue(is_consolidated_cog(self.test_cog_consolidated))
        self.assertFalse(is_consolidated_cog(self.test_cog_discrete))
