import csv
import io
import re
import unittest
from datetime import date

from hypothesis import given, strategies as st
from jsonschema import validate  # type: ignore

from specifyweb.specify import auditcodes
from specifyweb.specify.datamodel import datamodel
from specifyweb.stored_queries.format import LDLM_TO_MYSQL, MYSQL_TO_MONTH, \
    MYSQL_TO_YEAR
from .base import UploadTestsBase, get_table
from ..column_options import ColumnOptions
from ..parsing import parse_coord, parse_date, ParseResult as PR
from ..treerecord import TreeRecord
from ..upload import do_upload, do_upload_csv
from ..upload_plan_schema import parse_column_options
from ..upload_result import Uploaded, Matched, NullRecord, ParseFailures, \
    ParseFailure
from ..upload_results_schema import schema as upload_results_schema
from ..upload_table import UploadTable

co = datamodel.get_table_strict('Collectionobject')

class DateParsingTests(unittest.TestCase):

    def test_bad1(self) -> None:
        result = parse_date(co, 'catalogeddate', '%d/%m/%Y', 'foobar', 'catdate')
        self.assertEqual(ParseFailure(message='invalidYear', payload={'value':'foobar'}, column='catdate'), result)

    def test_bad2(self) -> None:
        result = parse_date(co, 'catalogeddate', '%d/%m/%Y', '1978-7-24', 'catdate')
        self.assertEqual(ParseFailure(message='badDateFormat', payload={'value':'1978-7-24', 'format':'%d/%m/%Y'}, column='catdate'), result)

    @given(st.dates(min_value=date(1000,1,1)), st.sampled_from([f for f in LDLM_TO_MYSQL.values() if '%Y' in f]))
    def test_full_date(self, date, format) -> None:
        datestr = date.strftime(format)
        result = parse_date(co, 'catalogeddate', format, datestr, 'catdate')
        self.assertIsInstance(result, PR)
        assert isinstance(result, PR)
        self.assertEqual({'catalogeddate': date, 'catalogeddateprecision': 1}, result.upload)

    @given(st.dates(min_value=date(1000,1,1)), st.sampled_from([f for f in LDLM_TO_MYSQL.values() if '%Y' in f]))
    def test_month(self, date, format) -> None:
        datestr = date.strftime(MYSQL_TO_MONTH[format])
        result = parse_date(co, 'catalogeddate', format, datestr, 'catdate')
        self.assertIsInstance(result, PR)
        assert isinstance(result, PR)
        self.assertEqual({'catalogeddate': date.replace(day=1), 'catalogeddateprecision': 2}, result.upload)

    @given(st.dates(min_value=date(1000,1,1)), st.sampled_from([f for f in LDLM_TO_MYSQL.values() if '%Y' in f]))
    def test_year(self, date, format) -> None:
        datestr = date.strftime(MYSQL_TO_YEAR[format])
        result = parse_date(co, 'catalogeddate', format, datestr, 'catdate')
        self.assertIsInstance(result, PR)
        assert isinstance(result, PR)
        self.assertEqual({'catalogeddate': date.replace(day=1, month=1), 'catalogeddateprecision': 3}, result.upload)

    @given(st.dates(min_value=date(1000,1,1)), st.sampled_from([f for f in LDLM_TO_MYSQL.values() if '%Y' in f]))
    def test_zero_day(self, date, format) -> None:
        datestr = date.strftime(re.sub('%d', '00', format))
        self.assertTrue('00' in datestr)
        result = parse_date(co, 'catalogeddate', format, datestr, 'catdate')
        self.assertIsInstance(result, PR)
        assert isinstance(result, PR)
        self.assertEqual({'catalogeddate': date.replace(day=1), 'catalogeddateprecision': 2}, result.upload)

    @given(st.dates(min_value=date(1000,1,1)), st.sampled_from([f for f in LDLM_TO_MYSQL.values() if '%Y' in f and '%b' not in f]))
    def test_zero_month(self, date, format) -> None:
        datestr = date.strftime(re.sub('(%d)|(%m)', '00', format))
        self.assertIn('00', datestr)
        result = parse_date(co, 'catalogeddate', format, datestr, 'catdate')
        self.assertIsInstance(result, PR)
        assert isinstance(result, PR)
        self.assertEqual({'catalogeddate': date.replace(day=1,month=1), 'catalogeddateprecision': 3}, result.upload)

class ParsingTests(UploadTestsBase):
    def setUp(self) -> None:
        super().setUp()

        agent = get_table('Splocalecontainer').objects.create(
            name='agent',
            schematype=0,
            discipline=self.discipline,
            ishidden=False,
            issystem=False,
        )

        agent.items.create(
            name='title',
            ishidden=False,
            issystem=False,
            picklistname='AgentTitle',
        )

        agenttitle = get_table('Picklist').objects.create(
            name='AgentTitle',
            type=0,
            collection=self.collection,
            readonly=True,
        )

        agenttitle.picklistitems.create(title='Mr.', value='mr')
        agenttitle.picklistitems.create(title='Ms.', value='ms')
        agenttitle.picklistitems.create(title='Dr.', value='dr')

        co = get_table('Splocalecontainer').objects.create(
            name='collectionobject',
            schematype=0,
            discipline=self.discipline,
            ishidden=False,
            issystem=False
        )

        co.items.create(
            name='text1',
            ishidden=False,
            issystem=False,
            picklistname='Habitat',
            isrequired=True,
        )

        co.items.create(
            name='catalognumber',
            ishidden=False,
            issystem=False,
            isrequired=True,
        )

        habitat = get_table('Picklist').objects.create(
            name='Habitat',
            type=0,
            collection=self.collection,
            readonly=False,
            sizelimit=4,
        )

        habitat.picklistitems.create(title='Marsh', value='marsh')

    def test_nonreadonly_picklist(self) -> None:
        plan = UploadTable(
            name='Collectionobject',
            wbcols={'catalognumber': parse_column_options('catno'), 'text1': parse_column_options('habitat')},
            static={},
            toOne={},
            toMany={}
        ).apply_scoping(self.collection)
        data = [
            {'catno': '1', 'habitat': 'River'},
            {'catno': '2', 'habitat': 'Lake'},
            {'catno': '3', 'habitat': 'Marsh'},
            {'catno': '4', 'habitat': 'Lake'},
            {'catno': '5', 'habitat': 'marsh'},
            {'catno': '6', 'habitat': 'lake'},
        ]

        self.assertEqual(0, get_table('Spauditlog').objects.filter(tablenum=get_table('Picklistitem').specify_model.tableId).count(), "No picklistitems in audit log yet.")

        results = do_upload(self.collection, data, plan, self.agent.id)
        for result in results:
            validate([result.to_json()], upload_results_schema)
            self.assertIsInstance(result.record_result, Uploaded)

        for i, v in enumerate('River Lake marsh Lake marsh Lake'.split()):
            r = results[i].record_result
            assert isinstance(r, Uploaded)
            self.assertEqual(v, get_table('Collectionobject').objects.get(id=r.get_id()).text1)

        self.assertEqual(3, get_table('Picklistitem').objects.filter(picklist__name='Habitat').count())

        for i, v in enumerate('River Lake None None None None'.split()):
            r = results[i].record_result
            assert isinstance(r, Uploaded)
            if v == 'None':
                self.assertEqual([], r.picklistAdditions)
            else:
                self.assertEqual(['habitat'], [a.caption for a in r.picklistAdditions])
                self.assertEqual([v], [get_table('Picklistitem').objects.get(id=a.id).value for a in r.picklistAdditions])
                for a in r.picklistAdditions:
                    self.assertEqual(1, get_table('Spauditlog').objects.filter(recordid=a.id, action=auditcodes.INSERT, tablenum=get_table('Picklistitem').specify_model.tableId).count(), "New picklistitem recorded in audit log.")

    def test_uiformatter_match(self) -> None:
        plan = UploadTable(
            name='Collectionobject',
            wbcols={'catalognumber': parse_column_options('catno')},
            static={},
            toOne={},
            toMany={}
        ).apply_scoping(self.collection)
        data = [
            {'catno': '123'},
            {'catno': '234'},
            {'catno': 'foo'},
            {'catno': 'bar'},
            {'catno': '567'},
        ]
        results = do_upload(self.collection, data, plan, self.agent.id)
        for result, expected in zip(results, [Uploaded, Uploaded, ParseFailures, ParseFailures, Uploaded]):
            self.assertIsInstance(result.record_result, expected)

    def test_numeric_types(self) -> None:
        plan = UploadTable(
            name='Collectionobject',
            wbcols={
                'catalognumber': parse_column_options('catno'),
                'yesno1': parse_column_options('bool'),
                'integer1': parse_column_options('integer'),
                'number1': parse_column_options('float'),
                'totalvalue': parse_column_options('decimal')
            },
            static={},
            toOne={},
            toMany={}
        ).apply_scoping(self.collection)
        data = [
            {'catno': '1', 'bool': 'true', 'integer': '10', 'float': '24.5', 'decimal': '10.23'},
            {'catno': '2', 'bool': 'bogus', 'integer': '10', 'float': '24.5', 'decimal': '10.23'},
            {'catno': '3', 'bool': 'true', 'integer': 'bogus', 'float': '24.5', 'decimal': '10.23'},
            {'catno': '4', 'bool': 'true', 'integer': '10', 'float': '24.5bogus', 'decimal': '10.23'},
            {'catno': '5', 'bool': 'true', 'integer': '10', 'float': '24.5', 'decimal': '10.23bogus'},
            {'catno': '6', 'bool': 'true', 'integer': '10.5', 'float': '24.5', 'decimal': '10.23'},
        ]
        results = do_upload(self.collection, data, plan, self.agent.id)
        self.assertIsInstance(results[0].record_result, Uploaded)
        for result in results[1:]:
            self.assertIsInstance(result.record_result, ParseFailures)

    def test_required_field(self) -> None:
        plan = UploadTable(
            name='Collectionobject',
            wbcols={'catalognumber': parse_column_options('catno'), 'text1': parse_column_options('habitat')},
            static={},
            toOne={},
            toMany={}
        ).apply_scoping(self.collection)
        data = [
            {'catno': '1', 'habitat': 'River'},
            {'catno': '', 'habitat': 'River'},
            {'catno': '3', 'habitat': ''},
            {'catno': '', 'habitat': ''},
            {'catno': '5', 'habitat': 'Lagoon'},
        ]
        results = do_upload(self.collection, data, plan, self.agent.id)
        for result, expected in zip(results, [Uploaded, ParseFailures, ParseFailures, NullRecord, Uploaded]):
            self.assertIsInstance(result.record_result, expected)

    def test_readonly_picklist(self) -> None:
        plan = UploadTable(
            name='Agent',
            wbcols={
                'title': parse_column_options('title'),
                'lastname': parse_column_options('lastname'),
            },
            static={'agenttype': 1},
            toOne={},
            toMany={}
        ).apply_scoping(self.collection)
        data = [
            {'title': "Mr.", 'lastname': 'Doe'},
            {'title': "Dr.", 'lastname': 'Zoidberg'},
            {'title': "Hon.", 'lastname': 'Juju'},
        ]
        results = do_upload(self.collection, data, plan, self.agent.id)

        result0 = results[0].record_result
        assert isinstance(result0, Uploaded)
        self.assertEqual('mr', get_table('agent').objects.get(id=result0.get_id()).title)

        result1 = results[1].record_result
        assert isinstance(result1, Uploaded)
        self.assertEqual('dr', get_table('agent').objects.get(id=result1.get_id()).title)

        result2 = results[2].record_result
        assert isinstance(result2, ParseFailures)
        self.assertEqual([ParseFailure(
            message='failedParsingPickList',
            payload={'value': 'Hon.'},
            column='title'
        )], result2.failures)


    def test_parse_latlong(self) -> None:
        tests = {
            '34.123 N': (34.123, 0),
            '36:07 N': (36 + 7/60, 2),
            '39:51:41 N': (39 + 51/60 + 41/60/60, 1),
            '00.07152778 N': (0.07152778, 0),
            '17:22.88 N': (17 + 22.88/60, 2),
            '39:51:41.02 N': (39 + 51/60 + 41.02/60/60, 1),
            '-39:51:41': (-(39 + 51/60 + 41/60/60), 1),
            '39:51:41 s': (-(39 + 51/60 + 41/60/60), 1),
            '39:51.41 w': (-(39 + 51.41/60), 2),
            '.34': (0.34, 0),
            '-.34': (-0.34, 0),
            '17:22.88 E': (17 + 22.88/60, 2),
            '28° N': (28, 0),
            '28° 19\' N': (28 + 19/60, 2),
            '28° 19\' 0.121" N': (28 + 19/60 + 0.121/60/60, 1),
            '115° 34\' 59.872" W': (-(115 + 34/60 + 59.872/60/60), 1),
            '1 01 S': (-(1 + 1/60), 2),
            '1 01 W': (-(1 + 1/60), 2),
            '0 01 S': (-(0 + 1/60), 2),
            '0 01 W': (-(0 + 1/60), 2),
            '-1 01': (-(1 + 1/60), 2),
            '-0 01': (-(0 + 1/60), 2),
            'foobar': None,
            '-': None,
        }

        for k, v in tests.items():
            self.assertEqual(parse_coord(k), v)

    def test_parsing_errors_reported(self) -> None:
        reader = csv.DictReader(io.StringIO(
'''BMSM No.,Class,Superfamily,Family,Genus,Subgenus,Species,Subspecies,Species Author,Subspecies Author,Who ID First Name,Determiner 1 Title,Determiner 1 First Name,Determiner 1 Middle Initial,Determiner 1 Last Name,ID Date Verbatim,ID Date,ID Status,Country,State/Prov/Pref,Region,Site,Sea Basin,Continent/Ocean,Date Collected,Start Date Collected,End Date Collected,Collection Method,Verbatim Collecting method,No. of Specimens,Live?,W/Operc,Lot Description,Prep Type 1,- Paired valves,for bivalves - Single valves,Habitat,Min Depth (M),Max Depth (M),Fossil?,Stratum,Sex / Age,Lot Status,Accession No.,Original Label,Remarks,Processed by,Cataloged by,DateCataloged,Latitude1,Latitude2,Longitude1,Longitude2,Lat Long Type,Station No.,Checked by,Label Printed,Not for publication on Web,Realm,Estimated,Collected Verbatim,Collector 1 Title,Collector 1 First Name,Collector 1 Middle Initial,Collector 1 Last Name,Collector 2 Title,Collector 2 First Name,Collector 2 Middle Initial,Collector 2 Last name,Collector 3 Title,Collector 3 First Name,Collector 3 Middle Initial,Collector 3 Last Name,Collector 4 Title,Collector 4 First Name,Collector 4 Middle Initial,Collector 4 Last Name
1365,Gastropoda,Fissurelloidea,Fissurellidae,Diodora,,meta,,"(Ihering, 1927)",,,,,,, , ,,USA,LOUISIANA,,[Lat-long site],Gulf of Mexico,NW Atlantic O.,Date unk'n,,,,,6,0,0,Dry; shell,Dry,,,,71,74,0,,,,313,,Dredged,JSG,MJP,22/01/2003,28° 03.44' N,,92° 26.98' W,,Point,,JSG,19/06/2003,0,Marine,0,Emilio Garcia,,Emilio,,Garcia,,,,,,,,,,,,
1366,Gastropoda,Fissurelloidea,Fissurellidae,Emarginula,,phrixodes,,"Dall, 1927",,,,,,, , ,,USA,LOUISIANA,,[Lat-long site],Gulf of Mexico,NW Atlantic O.,Date unk'n,,,,,3,0,0,Dry; shell,Dry,,,In coral rubble,57,65,0,,,,313,,,JSG,MJP,22/01/2003,28° 06.07' N,,91° 02.42' W,,Point,D-7(1),JSG,19/06/2003,0,Marine,0,Emilio Garcia,,Emilio,,Garcia,,,,,,,,,,,,
1367,Gastropoda,Fissurelloidea,Fissurellidae,Emarginula,,sicula,,"J.E. Gray, 1825",,,,,,, , ,,USA,Foobar,,[Lat-long site],Gulf of Mexico,NW Atlantic O.,Date unk'n,foobar,,,,1,0,0,Dry; shell,Dry,,,In coral rubble,57,65,0,,,,313,,,JSG,MJP,22/01/2003,28° 06.07' N,,91° 02.42' W,,Point,D-7(1),JSG,19/06/2003,0,Marine,0,Emilio Garcia,,Emilio,,Garcia,,,,,,,,,,,,
1368,Gastropoda,Fissurelloidea,Fissurellidae,Emarginula,,tuberculosa,,"Libassi, 1859",,Emilio Garcia,,Emilio,,Garcia,Jan 2002,00/01/2002,,USA,LOUISIANA,off Louisiana coast,[Lat-long site],Gulf of Mexico,NW Atlantic O.,Date unk'n,,,,,11,0,0,Dry; shell,Dry,,,"Subtidal 65-91 m, in coralline [sand]",65,91,0,,,,313,,Dredged.  Original label no. 23331.,JSG,MJP,22/01/2003,27° 59.14' N,,91° 38.83' W,,Point,D-4(1),JSG,19/06/2003,0,Marine,0,Emilio Garcia,,Emilio,,Garcia,,,,,,,,,,,,
'''))
        upload_results = do_upload_csv(self.collection, reader, self.example_plan, self.agent.id)
        failed_result = upload_results[2]
        self.assertIsInstance(failed_result.record_result, ParseFailures)
        for result in upload_results:
            if result is not failed_result:
                self.assertIsInstance(result.record_result, Uploaded)
                self.assertEqual(1, get_table('collectionobject').objects.filter(id=result.get_id()).count())


    def test_multiple_parsing_errors_reported(self) -> None:
        reader = csv.DictReader(io.StringIO(
'''BMSM No.,Class,Superfamily,Family,Genus,Subgenus,Species,Subspecies,Species Author,Subspecies Author,Who ID First Name,Determiner 1 Title,Determiner 1 First Name,Determiner 1 Middle Initial,Determiner 1 Last Name,ID Date Verbatim,ID Date,ID Status,Country,State/Prov/Pref,Region,Site,Sea Basin,Continent/Ocean,Date Collected,Start Date Collected,End Date Collected,Collection Method,Verbatim Collecting method,No. of Specimens,Live?,W/Operc,Lot Description,Prep Type 1,- Paired valves,for bivalves - Single valves,Habitat,Min Depth (M),Max Depth (M),Fossil?,Stratum,Sex / Age,Lot Status,Accession No.,Original Label,Remarks,Processed by,Cataloged by,DateCataloged,Latitude1,Latitude2,Longitude1,Longitude2,Lat Long Type,Station No.,Checked by,Label Printed,Not for publication on Web,Realm,Estimated,Collected Verbatim,Collector 1 Title,Collector 1 First Name,Collector 1 Middle Initial,Collector 1 Last Name,Collector 2 Title,Collector 2 First Name,Collector 2 Middle Initial,Collector 2 Last name,Collector 3 Title,Collector 3 First Name,Collector 3 Middle Initial,Collector 3 Last Name,Collector 4 Title,Collector 4 First Name,Collector 4 Middle Initial,Collector 4 Last Name
1367,Gastropoda,Fissurelloidea,Fissurellidae,Emarginula,,sicula,,"J.E. Gray, 1825",,,,,,, ,bad date,,USA,Foobar,,[Lat-long site],Gulf of Mexico,NW Atlantic O.,Date unk'n,foobar,,,,1,0,0,Dry; shell,Dry,,,In coral rubble,57,65,0,,,,313,,,JSG,MJP,22/01/2003,28° 06.07' N,,91° 02.42' W,,Point,D-7(1),JSG,19/06/2003,0,Marine,0,Emilio Garcia,,Emilio,,Garcia,,,,,,,,,,,,
'''))
        upload_results = do_upload_csv(self.collection, reader, self.example_plan, self.agent.id)
        failed_result = upload_results[0].record_result
        self.assertIsInstance(failed_result, ParseFailures)
        assert isinstance(failed_result, ParseFailures) # make typechecker happy
        self.assertEqual([ParseFailure(message='invalidYear', payload={'value':'foobar'}, column='Start Date Collected'), ParseFailure(message='invalidYear', payload={'value': 'bad date'}, column='ID Date')], failed_result.failures)

    def test_out_of_range_lat_long(self) -> None:
        reader = csv.DictReader(io.StringIO(
'''BMSM No.,Class,Superfamily,Family,Genus,Subgenus,Species,Subspecies,Species Author,Subspecies Author,Who ID First Name,Determiner 1 Title,Determiner 1 First Name,Determiner 1 Middle Initial,Determiner 1 Last Name,ID Date Verbatim,ID Date,ID Status,Country,State/Prov/Pref,Region,Site,Sea Basin,Continent/Ocean,Date Collected,Start Date Collected,End Date Collected,Collection Method,Verbatim Collecting method,No. of Specimens,Live?,W/Operc,Lot Description,Prep Type 1,- Paired valves,for bivalves - Single valves,Habitat,Min Depth (M),Max Depth (M),Fossil?,Stratum,Sex / Age,Lot Status,Accession No.,Original Label,Remarks,Processed by,Cataloged by,DateCataloged,Latitude1,Latitude2,Longitude1,Longitude2,Lat Long Type,Station No.,Checked by,Label Printed,Not for publication on Web,Realm,Estimated,Collected Verbatim,Collector 1 Title,Collector 1 First Name,Collector 1 Middle Initial,Collector 1 Last Name,Collector 2 Title,Collector 2 First Name,Collector 2 Middle Initial,Collector 2 Last name,Collector 3 Title,Collector 3 First Name,Collector 3 Middle Initial,Collector 3 Last Name,Collector 4 Title,Collector 4 First Name,Collector 4 Middle Initial,Collector 4 Last Name
1367,Gastropoda,Fissurelloidea,Fissurellidae,Emarginula,,sicula,,"J.E. Gray, 1825",,,,,,, ,,,USA,,,[Lat-long site],Gulf of Mexico,NW Atlantic O.,Date unk'n,,,,,1,0,0,Dry; shell,Dry,,,In coral rubble,57,65,0,,,,313,,,JSG,MJP,22/01/2003,128° 06.07' N,,191° 02.42' W,,Point,D-7(1),JSG,19/06/2003,0,Marine,0,Emilio Garcia,,Emilio,,Garcia,,,,,,,,,,,,
'''))
        upload_results = do_upload_csv(self.collection, reader, self.example_plan, self.agent.id)
        failed_result = upload_results[0].record_result
        self.assertIsInstance(failed_result, ParseFailures)
        assert isinstance(failed_result, ParseFailures) # make typechecker happy
        self.assertEqual([ParseFailure(message='latitudeOutOfRange', payload={'value':'128° 06.07\' N'}, column='Latitude1'), ParseFailure(message='longitudeOutOfRange', payload={'value': '191° 02.42\' W'}, column='Longitude1')], failed_result.failures)

    def test_agent_type(self) -> None:
        plan = UploadTable(
            name='Agent',
            wbcols={
                'agenttype': parse_column_options('agenttype'),
                'lastname': parse_column_options('lastname'),
            },
            static={},
            toOne={},
            toMany={}
        ).apply_scoping(self.collection)
        data = [
            {'agenttype': "Person", 'lastname': 'Doe'},
            {'agenttype': "Organization", 'lastname': 'Ministry of Silly Walks'},
            {'agenttype': "Extra terrestrial", 'lastname': 'Zoidberg'},
            {'agenttype': "other", 'lastname': 'Juju'},
            {'agenttype': "group", 'lastname': 'Van Halen'},
        ]
        results = do_upload(self.collection, data, plan, self.agent.id)

        result0 = results[0].record_result
        assert isinstance(result0, Uploaded)
        self.assertEqual(1, get_table('agent').objects.get(id=result0.get_id()).agenttype)

        result1 = results[1].record_result
        assert isinstance(result1, Uploaded)
        self.assertEqual(0, get_table('agent').objects.get(id=result1.get_id()).agenttype)

        result2 = results[2].record_result
        assert isinstance(result2, ParseFailures)
        self.assertEqual([ParseFailure(message='failedParsingAgentType',payload={'badType':'Extra terrestrial','validTypes':['Organization', 'Person', 'Other', 'Group']}, column='agenttype')], result2.failures)

        result3 = results[3].record_result
        assert isinstance(result3, Uploaded)
        self.assertEqual(2, get_table('agent').objects.get(id=result3.get_id()).agenttype)

        result4 = results[4].record_result
        assert isinstance(result4, Uploaded)
        self.assertEqual(3, get_table('agent').objects.get(id=result4.get_id()).agenttype)

    def test_tree_cols_without_name(self) -> None:
        plan = TreeRecord(
            name='Taxon',
            ranks=dict(
                Genus=dict(name=parse_column_options('Genus')),
                Species=dict(name=parse_column_options('Species'), author=parse_column_options('Species Author'))
            )
        ).apply_scoping(self.collection)
        data  = [
            {'Genus': 'Eupatorium', 'Species': 'serotinum', 'Species Author': 'Michx.'},
            {'Genus': 'Eupatorium', 'Species': '', 'Species Author': 'L.'},
        ]
        results = do_upload(self.collection, data, plan, self.agent.id)

        self.assertIsInstance(results[0].record_result, Uploaded)
        self.assertEqual(results[1].record_result, ParseFailures(failures=[ParseFailure(message='invalidPartialRecord', payload={'column':'Species'}, column='Species Author')]))

    def test_value_too_long(self) -> None:
        plan = TreeRecord(
            name='Taxon',
            ranks=dict(
                Genus=dict(name=parse_column_options('Genus')),
                Species=dict(name=parse_column_options('Species'), author=parse_column_options('Species Author'))
            )
        ).apply_scoping(self.collection)
        data  = [
            {'Genus': 'Eupatorium', 'Species': 'serotinum', 'Species Author': 'Michx.'},
            {'Genus': 'Eupatorium', 'Species': 'barelyfits', 'Species Author': 'x'*128},
            {'Genus': 'Eupatorium', 'Species': 'toolong', 'Species Author': 'x'*129},
        ]
        results = do_upload(self.collection, data, plan, self.agent.id)

        self.assertIsInstance(results[0].record_result, Uploaded)
        self.assertIsInstance(results[1].record_result, Uploaded)
        self.assertEqual(results[2].record_result, ParseFailures(failures=[ParseFailure(message='valueTooLong', payload={'maxLength': 128}, column='Species Author')]))


class MatchingBehaviorTests(UploadTestsBase):

    def test_tree_cols_with_ignoreWhenBlank(self) -> None:
        plan = TreeRecord(
            name='Taxon',
            ranks=dict(
                Genus=dict(name=parse_column_options('Genus')),
                Species=dict(name=parse_column_options('Species'),
                             author=ColumnOptions(column='Species Author', matchBehavior="ignoreWhenBlank", nullAllowed=True, default=None))
            )
        ).apply_scoping(self.collection)
        data  = [
            {'Genus': 'Eupatorium', 'Species': 'serotinum', 'Species Author': 'Michx.'},
            {'Genus': 'Eupatorium', 'Species': 'serotinum', 'Species Author': ''},
            {'Genus': 'Eupatorium', 'Species': 'serotinum', 'Species Author': 'Bogus'},
        ]
        results = do_upload(self.collection, data, plan, self.agent.id)

        self.assertIsInstance(results[0].record_result, Uploaded)
        self.assertIsInstance(results[1].record_result, Matched, "Second record matches first despite blank author.")
        self.assertEqual(results[0].get_id(), results[1].get_id(), "Second record matched the first specifically.")
        self.assertIsInstance(results[2].record_result, Uploaded, "Third record doesn't match due to different author.")


    def test_higher_tree_cols_with_ignoreWhenBlank(self) -> None:
        plan = TreeRecord(
            name='Taxon',
            ranks=dict(
                Genus=dict(name=parse_column_options('Genus')),
                Species=dict(name=parse_column_options('Species'),
                             author=ColumnOptions(column='Species Author', matchBehavior="ignoreWhenBlank", nullAllowed=True, default=None)),
                Subspecies=dict(name=parse_column_options('Subspecies')),
            )
        ).apply_scoping(self.collection)
        data  = [
            {'Genus': 'Eupatorium', 'Species': 'serotinum', 'Species Author': 'Michx.', 'Subspecies': 'a'},
            {'Genus': 'Eupatorium', 'Species': 'serotinum', 'Species Author': '', 'Subspecies': 'a'},
            {'Genus': 'Eupatorium', 'Species': 'serotinum', 'Species Author': 'Bogus', 'Subspecies': 'a'},
        ]
        results = do_upload(self.collection, data, plan, self.agent.id)

        self.assertIsInstance(results[0].record_result, Uploaded)
        self.assertIsInstance(results[1].record_result, Matched, "Second record matches first despite blank author.")
        self.assertEqual(results[0].get_id(), results[1].get_id(), "Second record matched the first specifically.")
        self.assertIsInstance(results[2].record_result, Uploaded, "Third record doesn't match due to different author.")

    def test_tree_cols_with_ignoreNever(self) -> None:
        plan = TreeRecord(
            name='Taxon',
            ranks=dict(
                Genus=dict(name=parse_column_options('Genus')),
                Species=dict(name=parse_column_options('Species'),
                             author=ColumnOptions(column='Species Author', matchBehavior="ignoreNever", nullAllowed=True, default=None))
            )
        ).apply_scoping(self.collection)
        data  = [
            {'Genus': 'Eupatorium', 'Species': 'serotinum', 'Species Author': 'Michx.'},
            {'Genus': 'Eupatorium', 'Species': 'serotinum', 'Species Author': ''},
            {'Genus': 'Eupatorium', 'Species': 'serotinum', 'Species Author': 'Bogus'},
        ]
        results = do_upload(self.collection, data, plan, self.agent.id)

        self.assertIsInstance(results[0].record_result, Uploaded)
        self.assertIsInstance(results[1].record_result, Uploaded, "Second record doesn't match first due to blank author.")
        self.assertIsInstance(results[2].record_result, Uploaded, "Third record doesn't match due to different author.")

    def test_tree_cols_with_required(self) -> None:
        plan = TreeRecord(
            name='Taxon',
            ranks=dict(
                Genus=dict(name=parse_column_options('Genus')),
                Species=dict(name=parse_column_options('Species'),
                             author=ColumnOptions(column='Species Author', matchBehavior="ignoreNever", nullAllowed=False, default=None))
            )
        ).apply_scoping(self.collection)
        data  = [
            {'Genus': 'Eupatorium', 'Species': 'serotinum', 'Species Author': 'Michx.'},
            {'Genus': 'Eupatorium', 'Species': 'serotinum', 'Species Author': ''},
            {'Genus': 'Eupatorium', 'Species': 'serotinum', 'Species Author': 'Bogus'},
            {'Genus': 'Eupatorium', 'Species': '', 'Species Author': ''},
        ]
        results = do_upload(self.collection, data, plan, self.agent.id)

        self.assertIsInstance(results[0].record_result, Uploaded)
        self.assertIsInstance(results[1].record_result, ParseFailures, "Second record fails due to blank author.")
        self.assertIsInstance(results[2].record_result, Uploaded, "Third record doesn't match due to different author.")
        self.assertIsInstance(results[3].record_result, Matched, "Fourth record matches at genus level due to null species record.")

    def test_tree_cols_with_ignoreAlways(self) -> None:
        plan = TreeRecord(
            name='Taxon',
            ranks=dict(
                Genus=dict(name=parse_column_options('Genus')),
                Species=dict(name=parse_column_options('Species'),
                             author=ColumnOptions(column='Species Author', matchBehavior="ignoreAlways", nullAllowed=True, default=None))
            )
        ).apply_scoping(self.collection)
        data  = [
            {'Genus': 'Eupatorium', 'Species': 'serotinum', 'Species Author': 'Michx.'},
            {'Genus': 'Eupatorium', 'Species': 'serotinum', 'Species Author': 'Bogus'},
            {'Genus': 'Eupatorium', 'Species': 'serotinum', 'Species Author': ''},
        ]
        results = do_upload(self.collection, data, plan, self.agent.id)

        self.assertIsInstance(results[0].record_result, Uploaded)
        self.assertIsInstance(results[1].record_result, Matched, "Second record matches first despite different author.")
        self.assertEqual(results[0].get_id(), results[1].get_id(), "Second record matched the first specifically.")
        self.assertIsInstance(results[2].record_result, Matched, "Third record matches despite different author.")
        self.assertEqual(results[0].get_id(), results[2].get_id(), "Third record matched the first specifically.")

    def test_wbcols_with_ignoreWhenBlank(self) -> None:
        plan = UploadTable(
            name='Agent',
            wbcols={
                'lastname': parse_column_options('lastname'),
                'firstname': ColumnOptions(column='firstname', matchBehavior="ignoreWhenBlank", nullAllowed=True, default=None),
            },
            static={},
            toOne={},
            toMany={}
        ).apply_scoping(self.collection)
        data = [
            {'lastname': 'Doe', 'firstname': 'River'},
            {'lastname': 'Doe', 'firstname': ''},
            {'lastname': 'Doe', 'firstname': 'Stream'},
        ]
        results = do_upload(self.collection, data, plan, self.agent.id)
        for result in results:
            validate([result.to_json()], upload_results_schema)

        self.assertIsInstance(results[0].record_result, Uploaded)
        self.assertIsInstance(results[1].record_result, Matched, "Second record matches first despite blank value.")
        self.assertEqual(results[0].get_id(), results[1].get_id(), "Second record matched the first specifically.")
        self.assertIsInstance(results[2].record_result, Uploaded)

    def test_wbcols_with_ignoreWhenBlank_and_default(self) -> None:
        plan = UploadTable(
            name='Agent',
            wbcols={
                'lastname': parse_column_options('lastname'),
                'firstname': ColumnOptions(column='firstname', matchBehavior="ignoreWhenBlank", nullAllowed=True, default="John"),
            },
            static={},
            toOne={},
            toMany={}
        ).apply_scoping(self.collection)
        data = [
            {'lastname': 'Doe', 'firstname': 'River'},
            {'lastname': 'Doe', 'firstname': ''},
            {'lastname': 'Doe', 'firstname': 'Stream'},
            {'lastname': 'Smith', 'firstname': ''},
        ]
        results = do_upload(self.collection, data, plan, self.agent.id)
        for result in results:
            validate([result.to_json()], upload_results_schema)

        self.assertIsInstance(results[0].record_result, Uploaded)
        self.assertIsInstance(results[1].record_result, Matched, "Second record matches first despite default value.")
        self.assertEqual(results[0].get_id(), results[1].get_id(), "Second record matched the first specifically.")
        self.assertIsInstance(results[2].record_result, Uploaded)
        self.assertIsInstance(results[3].record_result, Uploaded)

        for r, name in zip(results, "River Doe,River Doe,Stream Doe,John Smith".split(',')):
            a = get_table('Agent').objects.get(id=r.record_result.get_id())
            self.assertEqual(name, f"{a.firstname} {a.lastname}")

    def test_wbcols_with_ignoreNever(self) -> None:
        plan = UploadTable(
            name='Agent',
            wbcols={
                'lastname': parse_column_options('lastname'),
                'firstname': ColumnOptions(column='firstname', matchBehavior="ignoreNever", nullAllowed=True, default=None),
            },
            static={},
            toOne={},
            toMany={}
        ).apply_scoping(self.collection)
        data = [
            {'lastname': 'Doe', 'firstname': 'River'},
            {'lastname': 'Doe', 'firstname': ''},
            {'lastname': 'Doe', 'firstname': 'Stream'},
        ]
        results = do_upload(self.collection, data, plan, self.agent.id)
        for result in results:
            validate([result.to_json()], upload_results_schema)

        self.assertIsInstance(results[0].record_result, Uploaded)
        self.assertIsInstance(results[1].record_result, Uploaded, "Second record doesn't match first due to blank value.")
        self.assertIsInstance(results[2].record_result, Uploaded)

    def test_wbcols_with_ignoreAlways(self) -> None:
        plan = UploadTable(
            name='Agent',
            wbcols={
                'lastname': parse_column_options('lastname'),
                'firstname': ColumnOptions(column='firstname', matchBehavior="ignoreAlways", nullAllowed=True, default=None),
            },
            static={},
            toOne={},
            toMany={}
        ).apply_scoping(self.collection)
        data = [
            {'lastname': 'Doe', 'firstname': 'River'},
            {'lastname': 'Doe', 'firstname': ''},
            {'lastname': 'Doe', 'firstname': 'Stream'},
        ]
        results = do_upload(self.collection, data, plan, self.agent.id)
        for result in results:
            validate([result.to_json()], upload_results_schema)

        self.assertIsInstance(results[0].record_result, Uploaded)
        self.assertIsInstance(results[1].record_result, Matched, "Second record matches first despite blank value.")
        self.assertEqual(results[0].get_id(), results[1].get_id(), "Second record matched the first specifically.")
        self.assertIsInstance(results[2].record_result, Matched, "Third record matches first despit different value.")
        self.assertEqual(results[0].get_id(), results[2].get_id(), "Third record matched the first specifically.")

class DefaultTests(UploadTestsBase):
    def test_wbcols_with_default(self) -> None:
        plan = UploadTable(
            name='Agent',
            wbcols={
                'lastname': parse_column_options('lastname'),
                'firstname': ColumnOptions(column='firstname', matchBehavior="ignoreNever", nullAllowed=True, default="John"),
            },
            static={},
            toOne={},
            toMany={}
        ).apply_scoping(self.collection)
        data = [
            {'lastname': 'Doe', 'firstname': 'River'},
            {'lastname': 'Doe', 'firstname': ''},
            {'lastname': 'Doe', 'firstname': 'Stream'},
        ]
        results = do_upload(self.collection, data, plan, self.agent.id)
        for result in results:
            validate([result.to_json()], upload_results_schema)

        self.assertIsInstance(results[0].record_result, Uploaded)
        self.assertIsInstance(results[1].record_result, Uploaded)
        self.assertIsInstance(results[2].record_result, Uploaded)

        for r, name in zip(results, "River John Stream".split()):
            self.assertEqual(name, get_table('Agent').objects.get(id=r.record_result.get_id()).firstname)

    def test_wbcols_with_default_matching(self) -> None:
        plan = UploadTable(
            name='Agent',
            wbcols={
                'lastname': parse_column_options('lastname'),
                'firstname': ColumnOptions(column='firstname', matchBehavior="ignoreNever", nullAllowed=True, default="John"),
            },
            static={},
            toOne={},
            toMany={}
        ).apply_scoping(self.collection)
        data = [
            {'lastname': 'Doe', 'firstname': 'John'},
            {'lastname': 'Doe', 'firstname': 'River'},
            {'lastname': 'Doe', 'firstname': ''},
            {'lastname': 'Doe', 'firstname': 'Stream'},
        ]
        results = do_upload(self.collection, data, plan, self.agent.id)
        for result in results:
            validate([result.to_json()], upload_results_schema)

        self.assertIsInstance(results[0].record_result, Uploaded)
        self.assertIsInstance(results[1].record_result, Uploaded)
        self.assertIsInstance(results[2].record_result, Matched)
        self.assertEqual(results[0].get_id(), results[2].get_id(), "Third record matched the first specifically.")
        self.assertIsInstance(results[3].record_result, Uploaded)

        for r, name in zip(results, "John River John Stream".split()):
            self.assertEqual(name, get_table('Agent').objects.get(id=r.record_result.get_id()).firstname)

    def test_wbcols_with_default_and_null_disallowed(self) -> None:
        plan = UploadTable(
            name='Agent',
            wbcols={
                'lastname': parse_column_options('lastname'),
                'firstname': ColumnOptions(column='firstname', matchBehavior="ignoreNever", nullAllowed=False, default="John"),
            },
            static={},
            toOne={},
            toMany={}
        ).apply_scoping(self.collection)
        data = [
            {'lastname': 'Doe', 'firstname': 'River'},
            {'lastname': 'Doe', 'firstname': ''},
            {'lastname': 'Doe', 'firstname': 'Stream'},
        ]
        results = do_upload(self.collection, data, plan, self.agent.id)
        for result in results:
            validate([result.to_json()], upload_results_schema)

        self.assertIsInstance(results[0].record_result, Uploaded)
        self.assertIsInstance(results[1].record_result, Uploaded)
        self.assertIsInstance(results[2].record_result, Uploaded)

        for r, name in zip(results, "River John Stream".split()):
            self.assertEqual(name, get_table('Agent').objects.get(id=r.record_result.get_id()).firstname)


    def test_wbcols_with_default_blank(self) -> None:
        plan = UploadTable(
            name='Agent',
            wbcols={
                'lastname': parse_column_options('lastname'),
                'firstname': ColumnOptions(column='firstname', matchBehavior="ignoreNever", nullAllowed=False, default=""),
            },
            static={},
            toOne={},
            toMany={}
        ).apply_scoping(self.collection)
        data = [
            {'lastname': 'Doe', 'firstname': 'River'},
            {'lastname': 'Doe', 'firstname': ''},
            {'lastname': 'Doe', 'firstname': 'Stream'},
        ]
        results = do_upload(self.collection, data, plan, self.agent.id)
        for result in results:
            validate([result.to_json()], upload_results_schema)

        self.assertIsInstance(results[0].record_result, Uploaded)
        self.assertIsInstance(results[1].record_result, Uploaded)
        self.assertIsInstance(results[2].record_result, Uploaded)

        for r, name in zip(results, "River,,Stream".split(',')):
            self.assertEqual(name, get_table('Agent').objects.get(id=r.record_result.get_id()).firstname)

class NullAllowedTests(UploadTestsBase):

    def test_wbcols_with_null_disallowed(self) -> None:
        plan = UploadTable(
            name='Agent',
            wbcols={
                'lastname': parse_column_options('lastname'),
                'firstname': ColumnOptions(column='firstname', matchBehavior="ignoreNever", nullAllowed=False, default=None),
            },
            static={},
            toOne={},
            toMany={}
        ).apply_scoping(self.collection)
        data = [
            {'lastname': 'Doe', 'firstname': 'River'},
            {'lastname': 'Doe', 'firstname': ''},
            {'lastname': 'Doe', 'firstname': 'Stream'},
        ]
        results = do_upload(self.collection, data, plan, self.agent.id)
        for result in results:
            validate([result.to_json()], upload_results_schema)

        self.assertIsInstance(results[0].record_result, Uploaded)
        self.assertEqual(results[1].record_result, ParseFailures(failures=[ParseFailure(message='field is required by upload plan mapping', payload={}, column='firstname')]))
        self.assertIsInstance(results[2].record_result, Uploaded)

    def test_wbcols_with_null_disallowed_and_ignoreWhenBlank(self) -> None:
        plan = UploadTable(
            name='Agent',
            wbcols={
                'lastname': parse_column_options('lastname'),
                'firstname': ColumnOptions(column='firstname', matchBehavior="ignoreWhenBlank", nullAllowed=False, default=None),
            },
            static={},
            toOne={},
            toMany={}
        ).apply_scoping(self.collection)
        data = [
            {'lastname': 'Doe1', 'firstname': 'River'},
            {'lastname': 'Doe2', 'firstname': ''},
            {'lastname': 'Doe3', 'firstname': 'Stream'},
            {'lastname': 'Doe1', 'firstname': ''},
            {'lastname': 'Doe1', 'firstname': 'Stream'},
        ]
        results = do_upload(self.collection, data, plan, self.agent.id)
        for result in results:
            validate([result.to_json()], upload_results_schema)

        self.assertIsInstance(results[0].record_result, Uploaded)
        self.assertEqual(results[1].record_result, ParseFailures(failures=[ParseFailure(message='field is required by upload plan mapping', payload={}, column='firstname')]))
        self.assertIsInstance(results[2].record_result, Uploaded)
        self.assertIsInstance(results[3].record_result, Matched)
        self.assertIsInstance(results[4].record_result, Uploaded)

    def test_wbcols_with_null_disallowed_and_ignoreAlways(self) -> None:
        plan = UploadTable(
            name='Agent',
            wbcols={
                'lastname': parse_column_options('lastname'),
                'firstname': ColumnOptions(column='firstname', matchBehavior="ignoreAlways", nullAllowed=False, default=None),
            },
            static={},
            toOne={},
            toMany={}
        ).apply_scoping(self.collection)
        data = [
            {'lastname': 'Doe1', 'firstname': 'River'},
            {'lastname': 'Doe2', 'firstname': ''},
            {'lastname': 'Doe3', 'firstname': 'Stream'},
            {'lastname': 'Doe1', 'firstname': ''},
            {'lastname': 'Doe1', 'firstname': 'Stream'},
        ]
        results = do_upload(self.collection, data, plan, self.agent.id)
        for result in results:
            validate([result.to_json()], upload_results_schema)

        self.assertIsInstance(results[0].record_result, Uploaded)
        self.assertEqual(results[1].record_result, ParseFailures(failures=[ParseFailure(message='field is required by upload plan mapping', payload={}, column='firstname')]))
        self.assertIsInstance(results[2].record_result, Uploaded)
        self.assertIsInstance(results[3].record_result, Matched)
        self.assertIsInstance(results[4].record_result, Matched)
