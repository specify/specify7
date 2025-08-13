from typing import Tuple, List

from specifyweb.businessrules.uniqueness_rules import create_uniqueness_rule


def catnum_rule_editable(apps, schema_editor=None):
    """ Find any CollectionObject catalogNumber must be unique to Collection 
    rules which are readonly on the frontend (have isDatabaseConstraint=True)
    and set their isDatabaseConstraint=False.
    
    Generally should be run only after migration businessrules/0003 has been 
    applied
    """
    UniquenessRule = apps.get_model("businessrules", "UniquenessRule")
    
    model_rules = UniquenessRule.objects.filter(modelName="Collectionobject", isDatabaseConstraint=True)

    catalog_number_rules: List[int] = []
    for rule in model_rules: 
        rule_fields = rule.uniquenessrulefield_set.all()

        fields = rule_fields.filter(isScope=False)
        scopes = rule_fields.filter(isScope=True)

        # We're only interested in the rule "CollectionObject catalogNumber 
        # must be unique to Collection"
        # We check for length of fields and scopes because get() raises an 
        # exception if more than one result is returned
        if (len(fields) == 1 and len(scopes) == 1) and (fields.get().fieldPath.lower() == "catalognumber" and scopes.get().fieldPath.lower() == "collection"):
            catalog_number_rules.append(rule.id)
    
    rules_to_update = UniquenessRule.objects.filter(id__in=catalog_number_rules)
    rules_to_update.update(isDatabaseConstraint=False)


def catnum_rule_uneditable(apps, schema_editor=None):
    """ Find any CollectionObject catalogNumber must be unique to Collection 
    rules which are editable on the frontend (have isDatabaseConstraint=False)
    and set their isDatabaseConstraint=True.
    
    Generally should be run when migration businessrules/0003 is being reverted
    """
    Discipline = apps.get_model("specify", "Discipline")
    UniquenessRule = apps.get_model("businessrules", "UniquenessRule")

    for discipline in Discipline.objects.all():
        model_rules = UniquenessRule.objects.filter(modelName="Collectionobject", discipline_id=discipline.id, isDatabaseConstraint=False)

        has_catalognumber_rule = False
        for rule in model_rules: 
            rule_fields = rule.uniquenessrulefield_set.all()

            fields = rule_fields.filter(isScope=False)
            scopes = rule_fields.filter(isScope=True)

            # We're only interested in the rule "CollectionObject catalogNumber 
            # must be unique to Collection"
            # We check for length of fields and scopes because get() raises an 
            # exception if more than one result is returned
            if (len(fields) == 1 and len(scopes) == 1) and (fields.get().fieldPath.lower() == "catalognumber" and scopes.get().fieldPath.lower() == "collection"):
                has_catalognumber_rule = True

        if not has_catalognumber_rule:
            create_uniqueness_rule(
                "Collectionobject",
                discipline=discipline,
                is_database_constraint=True,
                fields=["catalogNumber"],
                scopes=["collection"],
                registry=apps,
            )
