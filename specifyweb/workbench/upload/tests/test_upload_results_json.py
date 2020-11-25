from hypothesis import given, infer, settings, HealthCheck
from hypothesis.strategies import text

import json
import unittest

from ..upload_result import *

class UploadResultsTests(unittest.TestCase):
    @given(uploaded=infer)
    def testUploaded(self, uploaded: Uploaded):
        j = json.dumps(uploaded.to_json())
        self.assertEqual(uploaded, json_to_Uploaded(json.loads(j)))

    @given(matched=infer)
    def testMatched(self, matched: Matched):
        j = json.dumps(matched.to_json())
        self.assertEqual(matched, json_to_Matched(json.loads(j)))

    @given(matchedMultiple=infer)
    def testMatchedMultiple(self, matchedMultiple: MatchedMultiple):
        j = json.dumps(matchedMultiple.to_json())
        self.assertEqual(matchedMultiple, json_to_MatchedMultiple(json.loads(j)))

    @given(nullRecord=infer)
    def testNullRecord(self, nullRecord: NullRecord):
        j = json.dumps(nullRecord.to_json())
        self.assertEqual(nullRecord, json_to_NullRecord(json.loads(j)))

    @given(failedBusinessRule=infer)
    def testFailedBusinessRule(self, failedBusinessRule: FailedBusinessRule):
        j = json.dumps(failedBusinessRule.to_json())
        self.assertEqual(failedBusinessRule, json_to_FailedBusinessRule(json.loads(j)))

    @given(noMatch=infer)
    def testNoMatch(self, noMatch: NoMatch):
        j = json.dumps(noMatch.to_json())
        self.assertEqual(noMatch, json_to_NoMatch(json.loads(j)))

    @given(parseFailures=infer)
    def testParseFailures(self, parseFailures: ParseFailures):
        j = json.dumps(parseFailures.to_json())
        self.assertEqual(parseFailures, json_to_ParseFailures(json.loads(j)))

    @settings(suppress_health_check=[HealthCheck.too_slow])
    @given(record_result=infer, toOne=infer, toMany=infer)
    def testUploadResult(self, record_result: RecordResult, toOne: Dict[str, RecordResult], toMany: Dict[str, List[RecordResult]]):
        uploadResult = UploadResult(
            record_result=record_result,
            toOne={k: UploadResult(v, {}, {}) for k, v in toOne.items()},
            toMany={k: [UploadResult(v, {}, {}) for v in vs] for k, vs in toMany.items()}
        )
        j = json.dumps(uploadResult.to_json())
        self.assertEqual(uploadResult, json_to_UploadResult(json.loads(j)))
