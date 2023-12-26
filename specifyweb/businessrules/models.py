from django.db import models

from specifyweb.specify import models as spmodels

from . import (
    recordset_rules,
    collector_rules,
    author_rules,
    collectionobject_rules,
    determination_rules,
    locality_rules,
    tree_rules,
    address_rules,
    discipline_rules,
    agent_rules,
    agentspecialty_rules,
    groupperson_rules,
    attachment_rules,
    guid_rules,
    interaction_rules,
    workbench_rules,
    user_rules,
    accessionagent_rules,
    fundingagent_rules,
    determiner_rules,
    extractor_rules,
)


class UniquenessRule(models.Model):
    isDatabaseConstraint = models.BooleanField(
        default=False, db_column='isDatabaseConstraint')
    splocalecontaineritems = models.ManyToManyField(
        spmodels.Splocalecontaineritem, through="UniquenessRule_Splocalecontaineritem", related_name="+")
    discipline = models.ForeignKey(
        spmodels.Discipline, on_delete=models.PROTECT, db_column="DisciplineID")

    class Meta:
        db_table = 'uniquenessrule'


class UniquenessRule_Splocalecontaineritem(models.Model):
    uniquenessrule = models.ForeignKey(
        UniquenessRule, on_delete=models.CASCADE)
    splocalecontaineritem = models.ForeignKey(
        spmodels.Splocalecontaineritem, null=True, blank=True, db_column="splocalecontaineritemid", on_delete=models.PROTECT)
    isScope = models.BooleanField(default=False)

    class Meta:
        db_table = "uniquenessrule_splocalecontaineritem"
