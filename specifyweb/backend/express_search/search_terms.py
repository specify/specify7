import re, logging
from collections import namedtuple
from datetime import date, datetime

from sqlalchemy.sql.expression import extract

from specifyweb.backend.stored_queries import models

logger = logging.getLogger(__name__)

QUOTED_STR_RE = re.compile(r'^([\'"`])(.*)\1$')

class Term(namedtuple("Term", "term is_suffix is_prefix is_number maybe_year is_integer as_date")):
    discipline = None

    @classmethod
    def make_term(cls, term):
        is_suffix = term.startswith('*')
        is_prefix = term.endswith('*')
        term = term.strip('*')

        try:
            float(term)
            is_number = True
        except ValueError:
            is_number = False

        try:
            maybe_year = 1000 <= int(term) <= date.today().year
            is_integer = True
        except ValueError:
            maybe_year = is_integer = False

        for format in ('%m/%d/%Y', '%Y-%m-%d',):
            try:
                as_date = datetime.strptime(term, format).date()
                break
            except ValueError:
                pass
        else:
            as_date = None

        return cls(term, is_suffix, is_prefix, is_number, maybe_year, is_integer, as_date)

    def create_filter(self, table, field):
        model = getattr(models, table.name)
        column = getattr(model, field.name)

        if (table.name == 'CollectionObject' and
            field.name == 'catalogNumber' and
            self.discipline):
            from specifyweb.specify.models import Splocalecontaineritem
            fieldinfo = Splocalecontaineritem.objects.get(
                container__schematype=0, # core schema
                container__discipline=self.discipline,
                name__iexact=field.name,
                container__name__iexact=table.name)

            if fieldinfo.format == 'CatalogNumberNumeric':
                term = "%.9d" % int(self.term) if self.is_integer else self.term
                return column == term

        filter_map = {
            'text': self.create_text_filter,
            'java.lang.String': self.create_text_filter,

            'java.lang.Integer': self.create_integer_filter,
            'java.lang.Long': self.create_integer_filter,
            'java.lang.Byte': self.create_integer_filter,
            'java.lang.Short': self.create_integer_filter,

            'java.lang.Float': self.create_float_filter,
            'java.lang.Double': self.create_float_filter,
            'java.math.BigDecimal': self.create_float_filter,

            'java.util.Calendar': self.create_date_filter,
            'java.util.Date': self.create_date_filter,
            'java.sql.Timestamp': self.create_date_filter,
            }

        create = filter_map.get(field.type, lambda f: None)
        return create(column)

    def create_text_filter(self, column):
        if self.is_prefix and self.is_suffix:
            return column.ilike('%' + self.term + '%')

        if self.is_prefix:
            return column.ilike(self.term + '%')

        if self.is_suffix:
            return column.ilike('%' + self.term)

        return column.ilike(self.term)


    def create_integer_filter(self, column):
        if self.is_integer:
            return column == int(self.term)

    def create_date_filter(self, column):
        if self.maybe_year:
            return extract('year', column) == int(self.term)

        if self.as_date:
            return column == self.as_date

    def create_float_filter(self, column):
        if self.is_number:
            return column == float(self.term)

def parse_search_str(collection, search_str):
    class TermForCollection(Term):
        discipline = collection.discipline

    match_quoted = QUOTED_STR_RE.match(search_str)
    if match_quoted:
        terms = [ match_quoted.groups()[1] ]
    else:
        terms = search_str.split()

    return list(map(TermForCollection.make_term, terms))
