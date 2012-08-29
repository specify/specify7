import os
from xml.etree import ElementTree

from django.conf import settings

from specify.models import Spappresourcedir, Spappresourcedata

from disciplines import discipline_dirs

DIR_LEVELS = ['Personal', 'UserType', 'Collection', 'Discipline', 'Common', 'Backstop']

def get_usertype(user):
    return user and user.usertype.replace(' ', '').lower()

def get_app_resource(collection, user, resource_name):
    for level in DIR_LEVELS:
        from_db = get_app_resource_from_db(collection, user, level, resource_name)
        if from_db is not None: return from_db

        from_fs = load_resource_at_level(collection, user, level, resource_name)
        if from_fs is not None: return from_fs
    return None

def load_resource_at_level(collection, user, level, resource_name):
    path = get_path_for_level(collection, user, level)
    registry = load_registry(path)
    return load_resource(path, registry, resource_name)

def get_path_for_level(collection, user, level):
    discipline_dir = discipline_dirs[collection.discipline.type]
    usertype = get_usertype(user)

    paths = {
        'UserType'  : (discipline_dir, usertype),
        'Discipline': (discipline_dir,)         ,
        'Common'    : ('common'      ,)         ,
        'Backstop'  : ('backstop'    ,)}

    path = paths.get(level, None)
    if path:
        return os.path.join(settings.SPECIFY_CONFIG_DIR, *path)

def load_registry(path, registry_filename='app_resources.xml'):
    pathname = os.path.join(path, registry_filename)
    return ElementTree.parse(pathname)

def load_resource(path, registry, resource_name):
    resource = registry.find('file[@name="%s"]' % resource_name)
    if resource is None: return None
    pathname = os.path.join(path, resource.attrib['file'])
    return open(pathname).read()

def get_app_resource_from_db(collection, user, level, resource_name):
    dirs = get_app_resource_dirs_for_level(collection, user, level)
    filters = {
        'spappresource__name': resource_name,
        'spappresource__spappresourcedir__in': dirs
        }
    try:
        return Spappresourcedata.objects.get(**filters).data
    except Spappresource.DoesNotExist:
        return None

def get_app_resource_dirs_for_level(collection, user, level):
    usertype = get_usertype(user)
    discipline = collection.discipline

    filter_levels = {
        'Columns'    : ('ispersonal', 'usertype', 'collection', 'discipline'),
        'Personal'   : (True        , usertype  , collection  , discipline)  ,
        'UserType'   : (False       , usertype  , collection  , discipline)  ,
        'Collection' : (False       , None      , collection  , discipline)  ,
        'Discipline' : (False       , None      , None        , discipline)  ,
        'Common'     : (False       , "Common"  , None        , None)}

    if level not in filter_levels: return []

    columns, values = filter_levels['Columns'], filter_levels[level]
    filters = dict(zip(columns, values))
    if filters['ispersonal']:
        if user is None: return []
        filters['specifyuser'] = user

    return Spappresourcedir.objects.filter(**filters)
