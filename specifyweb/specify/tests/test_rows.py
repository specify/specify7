
from django.test import Client
from specifyweb.specify.models import Collection, Collectionobject, Geologictimeperiod
import json

from specifyweb.specify.tests.test_geotime import GeoTimeTestsContext

class TestRows(GeoTimeTestsContext):
    
    def setUp(self):
        super().setUp()
        self._create_prep_type()
        c = Client()
        c.force_login(self.specifyuser)
        self.c = c

    def test_simple_fetch(self):
        
        result_rows = self.c.get("/api/specify_rows/collectionobject/", {
            'fields': 'catalognumber,collection__collectionname'
        })
        
        self.assertCountEqual(
            json.loads(result_rows.content.decode()), 
            [[co.catalognumber,co.collection.collectionname] for co in self.collectionobjects]
        )

    def test_order_by_fetch(self):

        self._update(
            self.collectionobjects[0],
            dict(text1="TextData5")
        )
        self._update(
            self.collectionobjects[1],
            dict(text1="TextData3")
        )
        self._update(
            self.collectionobjects[2],
            dict(text1="TextData1")
        )
        self._update(
            self.collectionobjects[3],
            dict(text1="TextData2")
        )
        self._update(
            self.collectionobjects[4],
            dict(text1="TextData2")
        )
        result_rows = self.c.get("/api/specify_rows/collectionobject/", {
            'fields': 'catalognumber,text1',
            'orderby': 'text1'
        })

        def _get_row(index):
            co = self.collectionobjects[index]
            return [co.catalognumber, co.text1]

        rows = json.loads(result_rows.content.decode())

        possible_lists = [
            [
                _get_row(2),
                _get_row(3),
                _get_row(4),
                _get_row(1),
                _get_row(0)
            ],
            [
                _get_row(2),
                _get_row(4),
                _get_row(3),
                _get_row(1),
                _get_row(0)
            ]
        ]

        error = None
        for possible_row in possible_lists:
            try:
                self.assertEqual(rows, possible_row)
                break
            except Exception as e:
                error = e
                continue
        else:
            assert error is not None, "Trying to throw undefined error"
            raise error


        distinct_result_rows = self.c.get("/api/specify_rows/collectionobject/", {
            'fields': 'text1',
            'orderby': 'text1',
            'distinct': True
        })

        rows = json.loads(distinct_result_rows.content.decode())
        self.assertEqual(rows, [['TextData1'], ['TextData2'], ['TextData3'], ['TextData5']])

    def test_limit(self):

        result_rows = self.c.get("/api/specify_rows/collectionobject/", {
            'fields': 'catalognumber,collection__collectionname',
            'limit': 3
        })
        
        self.assertCountEqual(
            json.loads(result_rows.content.decode()), 
            [[co.catalognumber,co.collection.collectionname] for co in self.collectionobjects[:3]]
        )

    def test_offset(self):

        result_rows = self.c.get("/api/specify_rows/collectionobject/", {
            'fields': 'catalognumber,collection__collectionname',
            'limit': 3,
            'offset': 1
        })
        
        self.assertCountEqual(
            json.loads(result_rows.content.decode()), 
            [[co.catalognumber,co.collection.collectionname] for co in self.collectionobjects[1:4]]
        )

    def test_domain_filter(self):
        collection_2 = Collection.objects.create(
            catalognumformatname='test',
            collectionname='TestCollection2',
            isembeddedcollectingevent=False,
            discipline=self.discipline,
        )

        new_cos = [
            Collectionobject.objects.create(
            collection=collection_2, 
            catalognumber="num-collection-%d" % i,
            collectionobjecttype=self.collectionobjecttype,
            ) for i in range(5)
        ]

        result_rows = self.c.get("/api/specify_rows/collectionobject/", {
            'fields': 'catalognumber,collection__collectionname',
        })

        result_1 = [[co.catalognumber,co.collection.collectionname] for co in self.collectionobjects]
        result_2 = [[co.catalognumber,co.collection.collectionname] for co in new_cos]

        self.assertCountEqual(
            json.loads(result_rows.content.decode()),
            [*result_1, *result_2]
        )

        domain_result_rows = self.c.get("/api/specify_rows/collectionobject/", {
            'fields': 'catalognumber,collection__collectionname',
            'domainfilter': 'true'
        })

        self.assertCountEqual(
            json.loads(domain_result_rows.content.decode()),
            result_1
        )

    def test_is_null(self):

        co_1_prep_1 = self._create_prep(self.collectionobjects[0], None)
        co_1_prep_2 = self._create_prep(self.collectionobjects[0], None)

        co_2_prep_1 = self._create_prep(self.collectionobjects[1], None)
        co_2_prep_2 = self._create_prep(self.collectionobjects[1], None)

        self._update(
            co_1_prep_1,
            dict(remarks="Remarks for CO 1 prep 1")
        )

        self._update(
            co_2_prep_2,
            dict(remarks="Remarks for CO 2 prep 2")
        )


        result_rows = self.c.get("/api/specify_rows/collectionobject/", {
            'fields': 'preparations__remarks,catalognumber',
            'domainfilter': 'true',
            'preparations__remarks__isnull': 'false'
        })

        self.assertCountEqual(json.loads(result_rows.content.decode()), [
            [co_1_prep_1.remarks, self.collectionobjects[0].catalognumber],
            [co_2_prep_2.remarks, self.collectionobjects[1].catalognumber]
        ])

        result_rows = self.c.get("/api/specify_rows/collectionobject/", {
            'fields': 'preparations__remarks,catalognumber',
            'domainfilter': 'true',
            'preparations__remarks__isnull': 'true'
        })

        self.assertCountEqual(json.loads(result_rows.content.decode()), [
            [co_1_prep_2.remarks, self.collectionobjects[0].catalognumber],
            [co_2_prep_1.remarks, self.collectionobjects[1].catalognumber],
            [None, self.collectionobjects[2].catalognumber],
            [None, self.collectionobjects[3].catalognumber],
            [None, self.collectionobjects[4].catalognumber],
        ])

    def _numeric_setup(self):
        self._update(
            self.collectionobjects[0],
            dict(integer1=3, text1="Text1")
        )
        self._update(
            self.collectionobjects[1],
            dict(integer1=4, text1="Text2")
        )
        self._update(
            self.collectionobjects[2],
            dict(integer1=6, text1="ModText3")
        )
        self._update(
            self.collectionobjects[3],
            dict(integer1=8, text1="ModText4")
        )
        self._update(
            self.collectionobjects[4],
            dict(integer1=3, text1="NewText1")
        )

    def test_in_query(self):
        self._numeric_setup()


        result_rows = self.c.get("/api/specify_rows/collectionobject/", {
            'fields': 'integer1,catalognumber',
            'integer1__in': '3,8'
        })

        result_row_content = result_rows.content.decode()

        # [[3, "num-0"], [3, "num-4"], [8, "num-3"]]
        def _get_row(index):
            co = self.collectionobjects[index]
            return [co.integer1, co.catalognumber]
        
        self.assertCountEqual(json.loads(result_row_content), [
            _get_row(0),
            _get_row(4),
            _get_row(3)
        ])

        result_rows = self.c.get("/api/specify_rows/collectionobject/", {
            'fields': 'text1,catalognumber',
            'text1__in': 'NewText1,ModText4'
        })

        result_row_content = result_rows.content.decode()

        # [[3, "num-0"], [3, "num-4"], [8, "num-3"]]
        def _get_row_text(index):
            co = self.collectionobjects[index]
            return [co.text1, co.catalognumber]

        # [["ModText4", "num-3"], ["NewText1", "num-4"]]
    
        self.assertCountEqual(json.loads(result_row_content), [
            _get_row_text(3),
            _get_row_text(4),
        ])

    def test_range_query(self):
        
        self._numeric_setup()
        result_rows = self.c.get("/api/specify_rows/collectionobject/", {
            'fields': 'integer1,catalognumber',
            'integer1__range': '4,8'
        })

        # [[4, "num-1"], [6, "num-2"], [8, "num-3"]]

        result_row_content = result_rows.content.decode()

        def _get_row(index):
            co = self.collectionobjects[index]
            return [co.integer1, co.catalognumber]
        
        self.assertCountEqual(json.loads(result_row_content), [
            _get_row(1),
            _get_row(2),
            _get_row(3)
        ])

    def test_filterchronostrat(self):
        
        test_chronostrat_1 = Geologictimeperiod.objects.create(
            name='test_node_1',
            rankid=200,
            definitionitem=self.period_rank,
            definition=self.geologictimeperiodtreedef,
            startperiod=33,
            startuncertainty=None,
            endperiod=50,
            enduncertainty=None,
        )

        test_chronostrat_2 = Geologictimeperiod.objects.create(
            name='test_node_2',
            rankid=200,
            definitionitem=self.period_rank,
            definition=self.geologictimeperiodtreedef,
            startperiod=33,
            startuncertainty=None,
            endperiod=50,
            enduncertainty=None,
        )
        result_rows = self.c.get("/api/specify_rows/geologictimeperiod/", {
            'fields': 'name,rankid',
            'filterchronostrat': False
        })


        expected_rows = [
            [gt.name, gt.rankid]
            for gt in [
                *self.geo_time_period_dict.values(), 
                 self.null_erathem_chronostrat,
                 test_chronostrat_1,
                 test_chronostrat_2
            ]
        ]

        self.assertCountEqual(expected_rows, json.loads(result_rows.content.decode()))

        result_rows = self.c.get("/api/specify_rows/geologictimeperiod/", {
            'fields': 'name,rankid',
            'filterchronostrat': True
        })


        expected_rows = [
            [gt.name, gt.rankid]
            for gt in [
                *self.geo_time_period_dict.values(), 
                 self.null_erathem_chronostrat,
            ] if gt.startperiod is not None and gt.endperiod is not None and gt.startperiod >= gt.endperiod
        ]

        self.assertCountEqual(expected_rows, json.loads(result_rows.content.decode()))