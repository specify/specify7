"""Execute Simple Search predicates against controlled rows (no MySQL needed)."""

from types import SimpleNamespace
from unittest import TestCase

from sqlalchemy import Column, Integer, MetaData, String, Table, create_engine, or_, select

from .search_terms import parse_search_str


class SearchTermResultsTests(TestCase):
    def setUp(self):
        self.engine = create_engine('sqlite://')
        self.addCleanup(self.engine.dispose)
        self.records = Table('records', MetaData(), Column('id', Integer, primary_key=True),
                             Column('name', String))
        self.records.create(self.engine)
        self.connection = self.engine.connect()
        self.addCleanup(self.connection.close)
        self.names = ['alpha', 'alphabet', 'betalpha', 'xalphay', 'al*pha',
                      'alXpha', 'alXXpha', 'al_pha', 'alpha beta', 'beta', 'ALPHA']
        self.connection.execute(self.records.insert(), [
            {'id': index, 'name': name} for index, name in enumerate(self.names)
        ])

    def matches(self, query):
        terms = parse_search_str(SimpleNamespace(discipline=None), query)
        predicate = or_(*(term.create_text_filter(self.records.c.name) for term in terms))
        return list(self.connection.execute(
            select(self.records.c.name).where(predicate).order_by(self.records.c.id)
        ).scalars())

    def test_wildcards_return_only_matching_records(self):
        cases = {
            'alpha': ['alpha', 'ALPHA'],
            'alpha*': ['alpha', 'alphabet', 'alpha beta', 'ALPHA'],
            '*alpha': ['alpha', 'betalpha', 'ALPHA'],
            '*alpha*': ['alpha', 'alphabet', 'betalpha', 'xalphay', 'alpha beta', 'ALPHA'],
            'al*pha': ['al*pha'],  # Interior asterisks remain literal.
            '%alpha': ['alpha', 'betalpha', 'ALPHA'],
            'alpha%': ['alpha', 'alphabet', 'alpha beta', 'ALPHA'],
            'al%pha': ['alpha', 'al*pha', 'alXpha', 'alXXpha', 'al_pha', 'ALPHA'],
            '%al%pha%': ['alpha', 'alphabet', 'betalpha', 'xalphay', 'al*pha',
                         'alXpha', 'alXXpha', 'al_pha', 'alpha beta', 'ALPHA'],
            'al_pha': ['al*pha', 'alXpha', 'al_pha'],
            'al__pha': ['alXXpha'],
            'missing%': [],
        }
        for query, expected in cases.items():
            with self.subTest(query=query):
                self.assertEqual(self.matches(query), expected)

    def test_matching_quotes_preserve_phrases_and_wildcards(self):
        for delimiter in ("'", '"'):
            with self.subTest(delimiter=delimiter):
                self.assertEqual(self.matches(f'{delimiter}alpha beta{delimiter}'), ['alpha beta'])
                self.assertEqual(self.matches(f'{delimiter}alpha%{delimiter}'),
                                 ['alpha', 'alphabet', 'alpha beta', 'ALPHA'])
                self.assertEqual(self.matches(f'{delimiter}missing phrase{delimiter}'), [])
        # Unquoted words are OR'd by primary search, rather than a phrase.
        self.assertEqual(self.matches('alpha beta'), ['alpha', 'beta', 'ALPHA'])

    def test_unmatched_delimiters_are_literal(self):
        self.assertEqual(self.matches("'alpha\""), [])
