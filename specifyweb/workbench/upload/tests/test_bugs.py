
import io
import json
import csv
from pprint import pprint
from unittest import skip
from datetime import datetime
from decimal import Decimal

from ..uploadable import Exclude
from ..upload_result import Uploaded, UploadResult, Matched, FailedBusinessRule, ReportInfo, TreeInfo
from ..upload_table import UploadTable, ScopedUploadTable, _to_many_filters_and_excludes, BoundUploadTable
from ..treerecord import TreeRecord, TreeDefItemWithParseResults
from ..upload import do_upload_csv
from ..upload_plan_schema import parse_plan

from .base import UploadTestsBase, get_table


class BugTests(UploadTestsBase):

    def test_duplicate_refworks(self) -> None:
        """ Andy found that duplicate reference works were being created from data similar to the following. """

        reader = csv.DictReader(io.StringIO(
'''Catalog number,Type,Title,Volume,Pages,Date,DOI,URL,Author last name 1,Author first name 1,Author MI 1,Author last name 2,Author first name 2,Author MI 2,Author last name 3,Author first name 3,Author MI 3
10026,1,catfish,282,315,1969,10.5479/si.03629236.282.1,https://doi.org/10.5479/si.03629236.282.1,Taylor,William,R,,,,,,
10168,1,catfish,282,315,1969,10.5479/si.03629236.282.1,https://doi.org/10.5479/si.03629236.282.1,Taylor,William,R,,,,,,
10194,1,catfish,282,315,1969,10.5479/si.03629236.282.1,https://doi.org/10.5479/si.03629236.282.1,Taylor,William,R,,,,,,
10199,1,catfish,282,315,1969,10.5479/si.03629236.282.1,https://doi.org/10.5479/si.03629236.282.1,Taylor,William,R,,,,,,
10206,1,catfish,282,315,1969,10.5479/si.03629236.282.1,https://doi.org/10.5479/si.03629236.282.1,Taylor,William,R,,,,,,
1861,1,pearl,1686,1-28,2008,10.11646/zootaxa.1686.1.1,https://doi.org/10.11646/zootaxa.1686.1.1,Conway,Kevin,W,Chen,,Wei-Jen,Mayden,Richard,L
5311,1,pearl,1686,1-28,2008,10.11646/zootaxa.1686.1.1,https://doi.org/10.11646/zootaxa.1686.1.1,Conway,Kevin,W,Chen,,Wei-Jen,Mayden,Richard,L
5325,1,pearl,1686,1-28,2008,10.11646/zootaxa.1686.1.1,https://doi.org/10.11646/zootaxa.1686.1.1,Conway,Kevin,W,Chen,,Wei-Jen,Mayden,Richard,L
5340,1,nepal,1047,1-19,2005,10.11646/zootaxa.1047.1.1,https://doi.org/10.11646/zootaxa.1047.1.1,Ng,Heok,H,Edds,David,R,,,
5362,1,nepal,1047,1-19,2005,10.11646/zootaxa.1047.1.1,https://doi.org/10.11646/zootaxa.1047.1.1,Ng,Heok,H,Edds,David,R,,,
5282,1,nepal,1047,1-19,2005,10.11646/zootaxa.1047.1.1,https://doi.org/10.11646/zootaxa.1047.1.1,Ng,Heok,H,Edds,David,R,,,
5900,1,nepal,1047,1-19,2005,10.11646/zootaxa.1047.1.1,https://doi.org/10.11646/zootaxa.1047.1.1,Ng,Heok,H,Edds,David,R,,,
6527,1,Centrum,44,721-732,2007,10.1139/e06-137,https://doi.org/10.1139/e06-137,Newbrey,Michael,G,Wilson,Mark,VH,Ashworth,Allan,C
7350,1,Centrum,44,721-732,2007,10.1139/e06-137,https://doi.org/10.1139/e06-137,Newbrey,Michael,G,Wilson,Mark,VH,Ashworth,Allan,C
7357,1,Centrum,44,721-732,2007,10.1139/e06-137,https://doi.org/10.1139/e06-137,Newbrey,Michael,G,Wilson,Mark,VH,Ashworth,Allan,C
7442,1,The Clupeocephala,45,635-657,2010,10.4067/S0718-19572010000400009,https://doi.org/10.4067/S0718-19572010000400009,Arratia,Gloria,,,,,,,
7486,1,The Clupeocephala,45,635-657,2010,10.4067/S0718-19572010000400009,https://doi.org/10.4067/S0718-19572010000400009,Arratia,Gloria,,,,,,,
7542,1,The Clupeocephala,45,635-657,2010,10.4067/S0718-19572010000400009,https://doi.org/10.4067/S0718-19572010000400009,Arratia,Gloria,,,,,,,
7588,1,The Clupeocephala,45,635-657,2010,10.4067/S0718-19572010000400009,https://doi.org/10.4067/S0718-19572010000400009,Arratia,Gloria,,,,,,,
7602,1,The Clupeocephala,45,635-657,2010,10.4067/S0718-19572010000400009,https://doi.org/10.4067/S0718-19572010000400009,Arratia,Gloria,,,,,,,
'''))
        expected = [
            Uploaded, # 10026,1,catfish,282,315,1969,10.5479/si.03629236.282.1,https://doi.org/10.5479/si.03629236.282.1,Taylor,William,R,,,,,,
            Matched, # 10168,1,catfish,282,315,1969,10.5479/si.03629236.282.1,https://doi.org/10.5479/si.03629236.282.1,Taylor,William,R,,,,,,
            Matched, # 10194,1,catfish,282,315,1969,10.5479/si.03629236.282.1,https://doi.org/10.5479/si.03629236.282.1,Taylor,William,R,,,,,,
            Matched, # 10199,1,catfish,282,315,1969,10.5479/si.03629236.282.1,https://doi.org/10.5479/si.03629236.282.1,Taylor,William,R,,,,,,
            Matched, # 10206,1,catfish,282,315,1969,10.5479/si.03629236.282.1,https://doi.org/10.5479/si.03629236.282.1,Taylor,William,R,,,,,,

            Uploaded, # 1861,1,pearl,1686,1-28,2008,10.11646/zootaxa.1686.1.1,https://doi.org/10.11646/zootaxa.1686.1.1,Conway,Kevin,W,Chen,,Wei-Jen,Mayden,Richard,L
            Matched, # 5311,1,pearl,1686,1-28,2008,10.11646/zootaxa.1686.1.1,https://doi.org/10.11646/zootaxa.1686.1.1,Conway,Kevin,W,Chen,,Wei-Jen,Mayden,Richard,L
            Matched, # 5325,1,pearl,1686,1-28,2008,10.11646/zootaxa.1686.1.1,https://doi.org/10.11646/zootaxa.1686.1.1,Conway,Kevin,W,Chen,,Wei-Jen,Mayden,Richard,L

            Uploaded, # 5340,1,nepal,1047,1-19,2005,10.11646/zootaxa.1047.1.1,https://doi.org/10.11646/zootaxa.1047.1.1,Ng,Heok,H,Edds,David,R,,,
            Matched, # 5362,1,nepal,1047,1-19,2005,10.11646/zootaxa.1047.1.1,https://doi.org/10.11646/zootaxa.1047.1.1,Ng,Heok,H,Edds,David,R,,,
            Matched, # 5282,1,nepal,1047,1-19,2005,10.11646/zootaxa.1047.1.1,https://doi.org/10.11646/zootaxa.1047.1.1,Ng,Heok,H,Edds,David,R,,,
            Matched, # 5900,1,nepal,1047,1-19,2005,10.11646/zootaxa.1047.1.1,https://doi.org/10.11646/zootaxa.1047.1.1,Ng,Heok,H,Edds,David,R,,,

            Uploaded, # 6527,1,Centrum,44,721-732,2007,10.1139/e06-137,https://doi.org/10.1139/e06-137,Newbrey,Michael,G,Wilson,Mark,VH,Ashworth,Allan,C
            Matched, # 7350,1,Centrum,44,721-732,2007,10.1139/e06-137,https://doi.org/10.1139/e06-137,Newbrey,Michael,G,Wilson,Mark,VH,Ashworth,Allan,C
            Matched, # 7357,1,Centrum,44,721-732,2007,10.1139/e06-137,https://doi.org/10.1139/e06-137,Newbrey,Michael,G,Wilson,Mark,VH,Ashworth,Allan,C

            Uploaded, # 7442,1,The Clupeocephala,45,635-657,2010,10.4067/S0718-19572010000400009,https://doi.org/10.4067/S0718-19572010000400009,Arratia,Gloria,,,,,,,
            Matched, # 7486,1,The Clupeocephala,45,635-657,2010,10.4067/S0718-19572010000400009,https://doi.org/10.4067/S0718-19572010000400009,Arratia,Gloria,,,,,,,
            Matched, # 7542,1,The Clupeocephala,45,635-657,2010,10.4067/S0718-19572010000400009,https://doi.org/10.4067/S0718-19572010000400009,Arratia,Gloria,,,,,,,
            Matched, # 7588,1,The Clupeocephala,45,635-657,2010,10.4067/S0718-19572010000400009,https://doi.org/10.4067/S0718-19572010000400009,Arratia,Gloria,,,,,,,
            Matched, # 7602,1,The Clupeocephala,45,635-657,2010,10.4067/S0718-19572010000400009,https://doi.org/10.4067/S0718-19572010000400009,Arratia,Gloria,,,,,,,
        ]

        plan = parse_plan(self.collection, json.loads('''
        {
	"baseTableName": "referencework",
	"uploadable": {
		"uploadTable": {
			"wbcols": {
				"referenceworktype": "Type",
				"title": "Title"
			},
			"static": {},
			"toOne": {},
			"toMany": {
				"authors": [
					{
						"wbcols": {},
						"static": {},
						"toOne": {
							"agent": {
								"uploadTable": {
									"wbcols": {
										"lastname": "Author last name 1"
									},
									"static": {"agenttype": 1},
									"toOne": {},
									"toMany": {}
								}
							}
						}
					},
					{
						"wbcols": {},
						"static": {},
						"toOne": {
							"agent": {
								"uploadTable": {
									"wbcols": {
										"lastname": "Author last name 2"
									},
									"static": {"agenttype": 1},
									"toOne": {},
									"toMany": {}
								}
							}
						}
					},
					{
						"wbcols": {},
						"static": {},
						"toOne": {
							"agent": {
								"uploadTable": {
									"wbcols": {
										"lastname": "Author last name 3"
									},
									"static": {"agenttype": 1},
									"toOne": {},
									"toMany": {}
								}
							}
						}
					}
				]
			}
		}
	}
}
'''))
        upload_results = do_upload_csv(self.collection, reader, plan.apply_scoping(self.collection), self.agent.id)
        rr = [r.record_result.__class__ for r in upload_results]
        self.assertEqual(expected, rr)
