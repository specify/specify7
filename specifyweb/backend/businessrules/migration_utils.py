from django.db.models.functions import Lower

def catnum_rule_editable(apps, schema_editor=None):
    """ Find any CollectionObject catalogNumber must be unique to Collection 
    rules which are readonly on the frontend (have isDatabaseConstraint=True)
    and set their isDatabaseConstraint=False.

    Generally should be run only after migration businessrules/0003 has been 
    applied
    """
    UniquenessRule = apps.get_model("businessrules", "UniquenessRule")

    model_rules = UniquenessRule.objects.filter(
        modelName__iexact="Collectionobject",
        isDatabaseConstraint=True
    )

    catalog_number_rules: list[int] = []
    for rule in model_rules:
        rule_fields = (rule
                       .uniquenessrulefield_set
                       .all()
                       .values_list(Lower("fieldPath"), "isScope"))

        fields = []
        scopes = []
        for field_path, is_scope in rule_fields:
            if is_scope:
                scopes.append(field_path)
            else:
                fields.append(field_path)

        # We're only interested in the rule "CollectionObject catalogNumber
        # must be unique to Collection"
        # There can be other rules which include Catalog Number and Collection
        # with other fields: ignore these
        if (len(fields) == 1 and len(scopes) == 1) and (fields[0] == "catalognumber" and scopes[0] == "collection"):
            catalog_number_rules.append(rule.id)

    rules_to_update = UniquenessRule.objects.filter(id__in=catalog_number_rules)
    rules_to_update.update(isDatabaseConstraint=False)
