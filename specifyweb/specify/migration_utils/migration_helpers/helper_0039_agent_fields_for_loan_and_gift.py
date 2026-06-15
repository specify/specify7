
# ##########################################
# Used in 0039_agent_fields_for_loan_and_gift.py
# ##########################################

MIGRATION_0039_FIELDS = {
    'Loan': ['agent1', 'agent2', 'agent3', 'agent4', 'agent5'],
    'Gift': ['agent1', 'agent2', 'agent3', 'agent4', 'agent5'],
}

from specifyweb.specify.migration_utils.schema_writer import revert_table_field_schema_config, update_table_field_schema_config_with_defaults


def update_loan_and_gift_agent_fields(apps):
    Discipline = apps.get_model('specify', 'Discipline')
    field_defaults = {
        "ishidden": True
    }
    for discipline in Discipline.objects.all():
        for table, fields in MIGRATION_0039_FIELDS.items():
            for field_name in fields:
                update_table_field_schema_config_with_defaults(table, discipline.id, field_name, apps, defaults=field_defaults)

def revert_loan_and_gift_agent_fields(apps):
    for table, fields in MIGRATION_0039_FIELDS.items():
        for field_name in fields:
            revert_table_field_schema_config(table, field_name, apps)