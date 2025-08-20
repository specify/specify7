from specifyweb.specify.tests.test_api import ApiTests
from specifyweb.specify.utils import get_app_model, APP_MODELS

# These are done as part of tests.
from specifyweb.backend.accounts import models as acccounts_models
from specifyweb.backend.attachment_gw import models as attachment_gw_models
from specifyweb.backend.businessrules import models as businessrules_models
from specifyweb.backend.context import models as context_models
from specifyweb.backend.notifications import models as notifications_models
from specifyweb.backend.permissions import models as permissions_models
from specifyweb.backend.interactions import models as interactions_models
from specifyweb.backend.workbench import models as workbench_models
from specifyweb.specify import models as spmodels

class TestGetAppModel(ApiTests):
    
    def test_simple_get(self):

        models = [
            (spmodels, ['Absoluteage', 'Absoluteageattachment', 'Absoluteagecitation', 'Accession']),
            (acccounts_models, ['Specifyuser', 'Spuserexternalid']),
            (attachment_gw_models, ['Spattachmentdataset']),
            (businessrules_models, ['UniquenessRule', 'UniquenessRuleField']),
            (context_models, []),
            (notifications_models, ['AsyncTask', 'LocalityUpdate', 'LocalityUpdateRowResult', 'Message']),
            (permissions_models, ['LibraryRole', 'LibraryRolePolicy', 'Role', 'RolePolicy']),
            (interactions_models, []),
            (workbench_models, ['Spdataset'])
        ]

        for (model_class, model_strs) in models:
            for model_str in model_strs:
                self.assertIs(
                    getattr(model_class, model_str), 
                    get_app_model(model_str), 
                    f"Model not found for {model_str} in {model_class}"
                )
    
    def test_model_not_found(self):
        self.assertIsNone(get_app_model("TableThatDoesNotExist"))



