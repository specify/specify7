from django.db import connection

from specifyweb.backend.context.schema_localization import get_schema_localization
from specifyweb.specify.models import Splocalecontainer, Splocalecontaineritem, Splocaleitemstr
from specifyweb.specify.tests.test_api import ApiTests

def _legacy_get_schema_localization_raw_sql(collection, schematype, lang):
    disc = collection.discipline
    language, country = lang.lower().split('-') if '-' in lang else (lang, None)

    cursor = connection.cursor()

    cursor.execute(f"""
    select name, format, ishidden, isuiformatter, picklistname, type, aggregator, defaultui,
           coalesce({'n1.text, ' if country is not None else ''} n2.text, n3.text, name),
           coalesce({'d1.text, ' if country is not None else ''} d2.text, d3.text, name)
    from splocalecontainer

    {'''
    left outer join splocaleitemstr n1 on n1.splocalecontainernameid = splocalecontainerid
    and n1.language = %(language)s
    and n1.country = %(country)s
    and (n1.variant is null or n1.variant = '')
    '''  if country is not None else ''}

    left outer join splocaleitemstr n2 on n2.splocalecontainernameid = splocalecontainerid
    and n2.language = %(language)s
    and (n2.country is null or n2.country = '')
    and (n2.variant is null or n2.variant = '')

    left outer join splocaleitemstr n3 on n3.splocalecontainernameid = splocalecontainerid
    and n3.language = 'en'
    and (n3.country is null or n3.country = '')
    and (n3.variant is null or n3.variant = '')

    {'''
    left outer join splocaleitemstr d1 on d1.splocalecontainerdescid = splocalecontainerid
    and d1.language = %(language)s
    and d1.country = %(country)s
    and (d1.variant is null or d1.variant = '')
    ''' if country is not None else ''}

    left outer join splocaleitemstr d2 on d2.splocalecontainerdescid = splocalecontainerid
    and d2.language = %(language)s
    and (d2.country is null or d2.country = '')
    and (d2.variant is null or d2.variant = '')

    left outer join splocaleitemstr d3 on d3.splocalecontainerdescid = splocalecontainerid
    and d3.language = 'en'
    and (d3.country is null or d3.country = '')
    and (d3.variant is null or d3.variant = '')

    where schematype = %(schematype)s and disciplineid = %(disciplineid)s
    order by name
    """, {'language': language, 'country': country, 'schematype': schematype, 'disciplineid': disc.id})

    cfields = (
        'format',
        'ishidden',
        'isuiformatter',
        'picklistname',
        'type',
        'aggregator',
        'defaultui',
        'name',
        'desc',
    )

    containers = {
        row[0].lower(): dict(items={}, **{field: row[i + 1] for i, field in enumerate(cfields)})
        for row in cursor.fetchall()
    }

    cursor.execute(f"""
    select container.name, item.name,
           item.format, item.ishidden, item.isuiformatter, item.picklistname,
           item.type, item.isrequired, item.weblinkname,
           coalesce({'n1.text, ' if country is not None else ''} n2.text, n3.text, item.name),
           coalesce({'d1.text, ' if country is not None else ''} d2.text, d3.text, item.name)
    from splocalecontainer container
    inner join splocalecontaineritem item on item.splocalecontainerid = container.splocalecontainerid

    {'''
    left outer join splocaleitemstr n1 on n1.splocalecontaineritemnameid = splocalecontaineritemid
    and n1.language = %(language)s
    and n1.country = %(country)s
    and (n1.variant is null or n1.variant = '')
    '''  if country is not None else ''}

    left outer join splocaleitemstr n2 on n2.splocalecontaineritemnameid = splocalecontaineritemid
    and n2.language = %(language)s
    and (n2.country is null or n2.country = '')
    and (n2.variant is null or n2.variant = '')

    left outer join splocaleitemstr n3 on n3.splocalecontaineritemnameid = splocalecontaineritemid
    and n3.language = 'en'
    and (n3.country is null or n3.country = '')
    and (n3.variant is null or n3.variant = '')

    {'''
    left outer join splocaleitemstr d1 on d1.splocalecontaineritemdescid = splocalecontaineritemid
    and d1.language = %(language)s
    and d1.country = %(country)s
    and (d1.variant is null or d1.variant = '')
    ''' if country is not None else ''}

    left outer join splocaleitemstr d2 on d2.splocalecontaineritemdescid = splocalecontaineritemid
    and d2.language = %(language)s
    and (d2.country is null or d2.country = '')
    and (d2.variant is null or d2.variant = '')

    left outer join splocaleitemstr d3 on d3.splocalecontaineritemdescid = splocalecontaineritemid
    and d3.language = 'en'
    and (d3.country is null or d3.country = '')
    and (d3.variant is null or d3.variant = '')

    where schematype = %(schematype)s and disciplineid = %(disciplineid)s
    order by item.name
    """, {'language': language, 'country': country, 'schematype': schematype, 'disciplineid': disc.id})

    ifields = (
        'format',
        'ishidden',
        'isuiformatter',
        'picklistname',
        'type',
        'isrequired',
        'weblinkname',
        'name',
        'desc',
    )

    for row in cursor.fetchall():
        containers[row[0].lower()]['items'][row[1].lower()] = {
            field: row[i + 2] for i, field in enumerate(ifields)
        }

    return containers

class TestSchemaLocalization(ApiTests):
    def setUp(self):
        super().setUp()
        suffix = str(self.collection.id)
        self.container_name = f'ormlocaletable_{suffix}'
        self.item_name = f'ormlocalefield_{suffix}'

        self.container = Splocalecontainer.objects.create(
            name=self.container_name,
            discipline=self.discipline,
            schematype=0,
            ishidden=False,
            issystem=False,
        )
        self.item = Splocalecontaineritem.objects.create(
            container=self.container,
            name=self.item_name,
            ishidden=False,
            issystem=False,
        )

    def _create_itemstr(
        self,
        *,
        text: str,
        language: str,
        target: str,
        kind: str,
        country: str | None = None,
        variant: str | None = None,
    ) -> None:
        payload = {
            'text': text,
            'language': language,
            'country': country,
            'variant': variant,
        }

        if target == 'container' and kind == 'name':
            payload['containername'] = self.container
        elif target == 'container' and kind == 'desc':
            payload['containerdesc'] = self.container
        elif target == 'item' and kind == 'name':
            payload['itemname'] = self.item
        elif target == 'item' and kind == 'desc':
            payload['itemdesc'] = self.item
        else:
            raise ValueError('Unexpected target/kind combination')

        Splocaleitemstr.objects.create(**payload)

    def test_prefers_country_then_language_then_english(self):
        self._create_itemstr(
            text='Container EN',
            language='en',
            target='container',
            kind='name',
        )
        self._create_itemstr(
            text='Container ES',
            language='es',
            target='container',
            kind='name',
        )
        self._create_itemstr(
            text='Container ES-MX',
            language='es',
            country='mx',
            target='container',
            kind='name',
        )
        self._create_itemstr(
            text='Container Desc EN',
            language='en',
            target='container',
            kind='desc',
        )
        self._create_itemstr(
            text='Container Desc ES',
            language='es',
            target='container',
            kind='desc',
        )

        self._create_itemstr(
            text='Item EN',
            language='en',
            target='item',
            kind='name',
        )
        self._create_itemstr(
            text='Item ES',
            language='es',
            target='item',
            kind='name',
        )
        self._create_itemstr(
            text='Item ES-MX',
            language='es',
            country='mx',
            target='item',
            kind='name',
        )
        self._create_itemstr(
            text='Item Desc EN',
            language='en',
            target='item',
            kind='desc',
        )
        self._create_itemstr(
            text='Item Desc ES',
            language='es',
            target='item',
            kind='desc',
        )

        localized = get_schema_localization(self.collection, 0, 'es-mx')
        table = localized[self.container_name]
        field = table['items'][self.item_name]

        self.assertEqual(table['name'], 'Container ES-MX')
        self.assertEqual(table['desc'], 'Container Desc ES')
        self.assertEqual(field['name'], 'Item ES-MX')
        self.assertEqual(field['desc'], 'Item Desc ES')

    def test_falls_back_to_name_when_no_locale_rows_exist(self):
        localized = get_schema_localization(self.collection, 0, 'fr')
        table = localized[self.container_name]
        field = table['items'][self.item_name]

        self.assertEqual(table['name'], self.container_name)
        self.assertEqual(table['desc'], self.container_name)
        self.assertEqual(field['name'], self.item_name)
        self.assertEqual(field['desc'], self.item_name)

    def test_executes_two_queries(self):
        with self.assertNumQueries(2):
            get_schema_localization(self.collection, 0, 'en')

    def test_matches_legacy_raw_sql_behavior(self):
        self._create_itemstr(
            text='Container EN',
            language='en',
            target='container',
            kind='name',
        )
        self._create_itemstr(
            text='Container ES',
            language='es',
            target='container',
            kind='name',
        )
        self._create_itemstr(
            text='Container ES-MX',
            language='es',
            country='mx',
            target='container',
            kind='name',
        )
        self._create_itemstr(
            text='Container Desc EN',
            language='en',
            target='container',
            kind='desc',
        )
        self._create_itemstr(
            text='Container Desc ES',
            language='es',
            target='container',
            kind='desc',
        )
        self._create_itemstr(
            text='Item EN',
            language='en',
            target='item',
            kind='name',
        )
        self._create_itemstr(
            text='Item ES',
            language='es',
            target='item',
            kind='name',
        )
        self._create_itemstr(
            text='Item ES-MX',
            language='es',
            country='mx',
            target='item',
            kind='name',
        )
        self._create_itemstr(
            text='Item Desc EN',
            language='en',
            target='item',
            kind='desc',
        )
        self._create_itemstr(
            text='Item Desc ES',
            language='es',
            target='item',
            kind='desc',
        )

        for lang in ('en', 'es', 'es-mx', 'fr'):
            legacy = _legacy_get_schema_localization_raw_sql(self.collection, 0, lang)
            orm = get_schema_localization(self.collection, 0, lang)
            self.assertEqual(legacy, orm)
