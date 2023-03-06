from hypothesis import given, infer, settings, HealthCheck, strategies as st

import json
import unittest
from jsonschema import validate, Draft7Validator # type: ignore

from ..upload_result import *
from ..upload_results_schema import schema

class UploadResultsTests(unittest.TestCase):
    def test_schema_valid(self) -> None:
        Draft7Validator.check_schema(schema)

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
        d = uploadResult.to_json()
        j = json.dumps(d)
        e = json.loads(j)
        validate([e], schema)
        self.assertEqual(uploadResult, json_to_UploadResult(e))

    def testUploadResultExplicit(self):
        failed_bussiness_rule: FailedBusinessRule = FailedBusinessRule(
            message='failed business rule message',
            payload={'failed business rule payload key 1': 'failed business rule payload value 1', 'failed business rule payload key 2': 'failed business rule payload value 2'},
            info=ReportInfo(
                tableName='report info table name',
                columns=['report info column 1', 'report info column 2'],
                treeInfo=None
            ))
        parse_failure: ParseFailure = ParseFailure(
            message='parse failure message',
            payload={'parse failure payload key 1': 'parse failure payload value 1', 'parse failure payload key 2': 'parse failure payload value 2'},
            column='parse failure column')
        parse_failures = ParseFailures(failures=[parse_failure])
        record_result: RecordResult = parse_failures
        toOne: Dict[str, RecordResult] = {'to one key 1': parse_failures, 'to one key 2': failed_bussiness_rule}
        toMany: Dict[str, List[RecordResult]] = {'to many key 1': [parse_failures, failed_bussiness_rule]}

        uploadResult = UploadResult(
            record_result=record_result,
            toOne={k: UploadResult(v, {}, {}) for k, v in toOne.items()},
            toMany={k: [UploadResult(v, {}, {}) for v in vs] for k, vs in toMany.items()}
        )
        d = uploadResult.to_json()
        print(d)
        j = json.dumps(d)
        e = json.loads(j)
        validate([e], schema) 
        self.assertEqual(uploadResult, json_to_UploadResult(e))

