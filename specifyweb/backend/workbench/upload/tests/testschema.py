from typing import Dict
from jsonschema import validate, Draft7Validator, exceptions # type: ignore
import unittest
from hypothesis import given, infer, settings, HealthCheck
from hypothesis_jsonschema import from_schema

from ..upload_table import UploadTable
from ..column_options import ColumnOptions
from ..upload_plan_schema import schema, parse_plan, parse_column_options

from .base import UploadTestsBase
from . import example_plan

def set_plan_treeId():
    # Set the treeId in example_plan.json dynamically, so that the unit test doesn't depend on the static treeId to always be the same.
    def set_tree_id_for_ranks(ranks, model, name):
        tree_id = model.objects.filter(name=name).first().treedef_id
        for rank in ranks.keys():
            ranks[rank]['treeId'] = tree_id

    from specifyweb.specify.models import Taxontreedefitem, Geographytreedefitem
    
    example_plan_ranks = example_plan.json['uploadable']['uploadTable']['toMany']['determinations'][0]['toOne']['taxon']['treeRecord']['ranks']
    set_tree_id_for_ranks(example_plan_ranks, Taxontreedefitem, 'Species')

    geography_ranks = example_plan.json['uploadable']['uploadTable']['toOne']['collectingevent']['uploadTable']['toOne']['locality']['uploadTable']['toOne']['geography']['treeRecord']['ranks']
    set_tree_id_for_ranks(geography_ranks, Geographytreedefitem, 'Continent')

class SchemaTests(UploadTestsBase):
    maxDiff = None

    def test_schema_parsing(self) -> None:
        set_plan_treeId()
        Draft7Validator.check_schema(schema)
        validate(example_plan.json, schema)
        plan = parse_plan(example_plan.json).apply_scoping(self.collection) # keeping this same
        # have to test repr's here because NamedTuples of different
        # types can be equal if their fields are equal.
        self.assertEqual(repr(plan), repr(self.example_plan_scoped))

    def test_unparsing(self) -> None:
        set_plan_treeId()
        self.assertEqual(example_plan.json, parse_plan(example_plan.json).unparse())

    def test_reject_internal_tree_columns(self) -> None:
        def with_field(field: str) -> dict:
            return dict(
                baseTableName = 'Taxon',
                uploadable = { 'treeRecord': dict(
                    ranks = {
                        'Class': 'Class',
                        'Superfamily': 'Superfamily',
                        'Family': 'Family',
                        'Genus': 'Genus',
                        'Subgenus': 'Subgenus',
                        'Species': dict(
                            treeNodeCols = {
                                'name': 'Species',
                                'author': 'Species Author',
                                field: 'Reject!',
                            },
                        ),
                        'Subspecies': dict(
                            treeNodeCols = {
                                'name': 'Subspecies',
                                'author': 'Subspecies Author',
                            },
                        ),

                }
                )}
            )

        for field in "nodenumber highestchildnodenumber rankid".split():
            with self.assertRaises(exceptions.ValidationError, msg=f"should reject {field}"):
                validate(with_field(field), schema)


class OtherSchemaTests(unittest.TestCase):

    @settings(max_examples=100, deadline=None, suppress_health_check=(HealthCheck.too_slow,))
    @given(name=infer, wbcols=infer)
    def test_validate_upload_table_to_json(self, name: str, wbcols: dict[str, ColumnOptions]):
        upload_table = UploadTable(name=name, wbcols=wbcols, overrideScope=None, static={}, toOne={}, toMany={})
        validate(upload_table.unparse(), schema)

    @settings(max_examples=100, deadline=None, suppress_health_check=(HealthCheck.too_slow,))
    @given(column_opts=from_schema(schema['definitions']['columnOptions']))
    def test_column_options_parse(self, column_opts: dict):
        validate(column_opts, schema['definitions']['columnOptions'])
        parse_column_options(column_opts)

    @settings(max_examples=100, deadline=None, suppress_health_check=(HealthCheck.too_slow,))
    @given(column_opts=infer)
    def test_column_options_to_json(self, column_opts: ColumnOptions):
        j = column_opts.to_json()
        if not isinstance(j, str):
            validate(j, schema['definitions']['columnOptions'])
        self.assertEqual(column_opts, parse_column_options(j))
