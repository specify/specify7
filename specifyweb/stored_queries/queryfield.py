from email.policy import strict
import logging
from collections import namedtuple

from .query_ops import QueryOps
from .queryfieldspec import QueryFieldSpec

logger = logging.getLogger(__name__)

class QueryField(namedtuple('QueryField', [
    'fieldspec',
    'op_num',
    'value',
    'negate',
    'display',
    'format_name',
    'sort_type',
    'strict'])):

    @classmethod
    def from_spqueryfield(cls, field, value=None):
        logger.info('processing field from %r', field)
        fieldspec = QueryFieldSpec.from_stringid(field.stringId, field.isRelFld)

        if field.isRelFld:
            # force no filtering on formatted / aggregated fields
            value = ""

        return cls(fieldspec = fieldspec,
                   op_num    = field.operStart,
                   value     = field.startValue if value is None else value,
                   negate    = field.isNot,
                   display   = field.isDisplay,
                   format_name = field.formatName,
                   sort_type = field.sortType,
                   strict = field.isStrict)

    def add_to_query(self, query, no_filter=False, formatauditobjs=False):
        logger.info("adding field %s", self)
        value_required_for_filter = QueryOps.OPERATIONS[self.op_num] not in (
            'op_true',              # 6
            'op_false',             # 7
            'op_empty',             # 12
            'op_trueornull',        # 13
            'op_falseornull',       # 14
        )

        no_filter = no_filter or (self.value == ''
                                  and value_required_for_filter
                                  and not self.negate)

        return self.fieldspec.add_to_query(
            query,
            value=self.value,
            op_num=None if no_filter else self.op_num,
            negate=self.negate,
            formatter=self.format_name,
            formatauditobjs=formatauditobjs,
            strict=self.strict,
        )
