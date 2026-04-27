from django.db import IntegrityError
from django.test import TestCase

from specifyweb.specify.tests.test_api import MainSetupTearDown
from specifyweb.specify.models import Spquery, Spqueryfield
from specifyweb.backend.export.models import (
    SchemaMapping, ExportDataSet, ExportDataSetExtension, CacheTableMeta,
)


class SchemaMappingTests(MainSetupTearDown, TestCase):

    def _make_query(self, name='test query'):
        return Spquery.objects.create(
            name=name,
            contextname='CollectionObject',
            contexttableid=1,
            createdbyagent=self.agent,
            specifyuser=self.specifyuser,
        )

    def test_create_schema_mapping(self):
        query = self._make_query()
        mapping = SchemaMapping.objects.create(
            query=query,
            mapping_type='Core',
            name='DwC Core Mapping',
            createdbyagent=self.agent,
            specifyuser=self.specifyuser,
        )
        mapping.refresh_from_db()
        self.assertEqual(mapping.query_id, query.pk)
        self.assertEqual(mapping.mapping_type, 'Core')
        self.assertEqual(mapping.name, 'DwC Core Mapping')
        self.assertFalse(mapping.is_default)

    def test_schema_mapping_query_onetoone(self):
        query = self._make_query()
        SchemaMapping.objects.create(
            query=query,
            mapping_type='Core',
            name='First',
            specifyuser=self.specifyuser,
        )
        with self.assertRaises(IntegrityError):
            SchemaMapping.objects.create(
                query=query,
                mapping_type='Extension',
                name='Second',
                specifyuser=self.specifyuser,
            )

    def test_schema_mapping_cascade_delete(self):
        query = self._make_query()
        SchemaMapping.objects.create(
            query=query,
            mapping_type='Core',
            name='Cascade Test',
            specifyuser=self.specifyuser,
        )
        self.assertEqual(SchemaMapping.objects.count(), 1)
        query.delete()
        self.assertEqual(SchemaMapping.objects.count(), 0)

    def test_spqueryfield_term_nullable(self):
        query = self._make_query()

        # Field without DwC term — backward compatible
        field_no_term = Spqueryfield.objects.create(
            query=query,
            fieldname='catalogNumber',
            operstart=0,
            sorttype=0,
            position=0,
            startvalue='',
            stringid='1.collectionobject.catalogNumber',
            tablelist='1',
        )
        field_no_term.refresh_from_db()
        self.assertIsNone(field_no_term.term)
        self.assertFalse(field_no_term.isstatic)
        self.assertIsNone(field_no_term.staticvalue)

        # Field with DwC term
        field_with_term = Spqueryfield.objects.create(
            query=query,
            fieldname='catalogNumber',
            operstart=0,
            sorttype=0,
            position=1,
            startvalue='',
            stringid='1.collectionobject.catalogNumber',
            tablelist='1',
            term='http://rs.tdwg.org/dwc/terms/catalogNumber',
            isstatic=False,
        )
        field_with_term.refresh_from_db()
        self.assertEqual(
            field_with_term.term,
            'http://rs.tdwg.org/dwc/terms/catalogNumber',
        )

        # Static field
        field_static = Spqueryfield.objects.create(
            query=query,
            fieldname='catalogNumber',
            operstart=0,
            sorttype=0,
            position=2,
            startvalue='',
            stringid='1.collectionobject.catalogNumber',
            tablelist='1',
            term='http://rs.tdwg.org/dwc/terms/basisOfRecord',
            isstatic=True,
            staticvalue='PreservedSpecimen',
        )
        field_static.refresh_from_db()
        self.assertTrue(field_static.isstatic)
        self.assertEqual(field_static.staticvalue, 'PreservedSpecimen')


class ExportDataSetTests(MainSetupTearDown, TestCase):

    def _make_mapping(self, name='test mapping'):
        query = Spquery.objects.create(
            name='q',
            contextname='CollectionObject',
            contexttableid=1,
            createdbyagent=self.agent,
            specifyuser=self.specifyuser,
        )
        return SchemaMapping.objects.create(
            query=query, mapping_type='Core', name=name,
            specifyuser=self.specifyuser,
        )

    def test_create_export_dataset(self):
        mapping = self._make_mapping()
        ds = ExportDataSet.objects.create(
            exportname='My Export',
            filename='export.zip',
            coremapping=mapping,
            collection=self.collection,
        )
        ds.refresh_from_db()
        self.assertEqual(ds.exportname, 'My Export')
        self.assertEqual(ds.filename, 'export.zip')
        self.assertFalse(ds.rss)
        self.assertIsNone(ds.frequency)
        self.assertIsNone(ds.lastexported)
        self.assertEqual(ds.coremapping_id, mapping.pk)
        self.assertEqual(ds.collection_id, self.collection.pk)

    def test_export_dataset_extension(self):
        core = self._make_mapping('core')
        ext_mapping = self._make_mapping('ext')
        ds = ExportDataSet.objects.create(
            exportname='DS', filename='ds.zip',
            coremapping=core, collection=self.collection,
        )
        ext = ExportDataSetExtension.objects.create(
            exportdataset=ds, schemamapping=ext_mapping, sortorder=1,
        )
        ext.refresh_from_db()
        self.assertEqual(ext.exportdataset_id, ds.pk)
        self.assertEqual(ext.schemamapping_id, ext_mapping.pk)
        self.assertEqual(ext.sortorder, 1)

        # unique_together enforced
        with self.assertRaises(IntegrityError):
            ExportDataSetExtension.objects.create(
                exportdataset=ds, schemamapping=ext_mapping, sortorder=2,
            )

    def test_cache_table_meta(self):
        mapping = self._make_mapping()
        meta = CacheTableMeta.objects.create(
            schemamapping=mapping,
            collection=self.collection,
            tablename='dwc_cache_1_4',
        )
        meta.refresh_from_db()
        self.assertEqual(meta.schemamapping_id, mapping.pk)
        self.assertEqual(meta.tablename, 'dwc_cache_1_4')
        self.assertIsNone(meta.lastbuilt)
        self.assertIsNone(meta.rowcount)
        self.assertEqual(meta.buildstatus, 'idle')
