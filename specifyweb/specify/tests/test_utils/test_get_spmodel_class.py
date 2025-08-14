# These are done as part of tests.
from specifyweb.specify import models as spmodels
from specifyweb.specify.tests.test_api import ApiTests
from specifyweb.specify.utils import get_spmodel_class

class TestGetSpmodelClass(ApiTests):
    
    def test_model_exists(self):
        model_lists = [
            ('Collectionobject', spmodels.Collectionobject),
            ('Agent', spmodels.Agent),
        ]

        for model_name, model in model_lists:
            self.assertIs(get_spmodel_class(model_name), model)

    def test_model_case_insensitive(self):
        model_lists = [
            (spmodels.Collectionobject, [
                'Collectionobject', 
                'collectionobject',
                'COLLectionobject', 
                'collectionObject'
                ]
            ),
            (spmodels.Agent, [
                'Agent', 
                'agent',
                'aGEnt'
                ]
            )
        ]

        for model, model_aliases in model_lists:
            for model_name in model_aliases:
                self.assertIs(get_spmodel_class(model_name), model)

    def test_model_does_not_exist(self):
        with self.assertRaises(AttributeError) as error:
            get_spmodel_class("SpdataSet")
        
        self.assertTrue(
            "Model 'SpdataSet' not found in models module." in str(error.exception)
        )

