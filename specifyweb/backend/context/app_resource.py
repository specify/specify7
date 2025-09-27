"""
Logic for finding App Resources

Specify Application resources are hierarchical in nature and may be stored in either the
database or the filesystem with database resources taking precedence over the filesystem.
"""
import errno
import logging
import os
from xml.etree import ElementTree
from xml.sax.saxutils import quoteattr

from django.conf import settings

from specifyweb.specify.models import Spappresourcedir, Spappresourcedata

logger = logging.getLogger(__name__)

# The resource hierarchy procedes from resources that are specific to the user
# up through resources that are valid in any context. More specific resources
# take priority.
DIR_LEVELS = ['Personal', 'UserType', 'Collection', 'Discipline', 'Common', 'Backstop']

# At the discipline level of the hierarchy, filesystem resources are found in
# the directories were defined in "disciplines.xml" but are now defined here.
DISCIPLINE_DIRS = {
    "fish": "fish",
    "herpetology": "herpetology",
    "paleobotany": "invertpaleo",
    "invertpaleo": "invertpaleo",
    "vertpaleo": "vertpaleo",
    "bird": "bird",
    "mammal": "mammal",
    "insect": "insect",
    "botany": "botany",
    "invertebrate": "invertebrate",
    "geology": "geology",
}

FORM_RESOURCE_EXCLUDED_LST = [
    "fish/fishbase.views.xml",
    "accessions/accessions.views.xml",
    "backstop/system.views.xml",
    "backstop/editorpanel.views.xml",
    "backstop/gbif.views.xml",
    "backstop/preferences.views.xml",
]

# get_app_resource is the main interface provided by this module
def get_app_resource(collection, user, resource_name, additional_default=False):
    """Fetch the named app resource in the context of the given user and collection.
    Returns the resource data and mimetype as a pair.
    """
    logger.info('looking for app resource %r for user %s in %s',
                resource_name, user and user.name, collection and collection.collectionname)

    # Handling for DataObjFormatters to support fallback to defaults
    if resource_name == 'DataObjFormatters':
        custom_formatter = None
        default_formatter = None
        
        # Try to search for the the custom formatter first
        for level in DIR_LEVELS:
            # First look in the database.
            from_db = get_app_resource_from_db(collection, user, level, resource_name)
            if from_db is not None:
                custom_formatter = from_db
                break

            # If resource was not found, look on the filesystem.
            from_fs = load_resource_at_level(collection, user, level, resource_name)
            if from_fs is not None:
                custom_formatter = from_fs
                break
        
        # If custom formatter not found, try to load the default formatter from the backstop level
        default_formatter = load_resource_at_level(collection, user, 'Backstop', resource_name)
        
        # If both custom and default formatters are found, merge them
        if custom_formatter is not None and default_formatter is not None:
            merged_formatter = merge_formatters(custom_formatter[0], default_formatter[0])
            return merged_formatter, custom_formatter[1], custom_formatter[2]
        
        # Return the custom formatter if it exists, otherwise return the default
        if custom_formatter is not None:
            return custom_formatter
        
        if default_formatter is not None:
            return default_formatter
        
        return None
    
    if not additional_default:
        # Traverse the hierarchy.
        for level in DIR_LEVELS:
            # First look in the database.
            from_db = get_app_resource_from_db(collection, user, level, resource_name)
            if from_db is not None: return from_db

            # If resource was not found, look on the filesystem.
            from_fs = load_resource_at_level(collection, user, level, resource_name)
            if from_fs is not None: return from_fs
            # Continue to next higher level of hierarchy.

    # If additional_default is True, add the resource from the Backstop level.
    if additional_default:
        # Then check the backstop level in the filesystem.
        from_fs = load_resource_at_level(collection, user, 'Backstop', resource_name)
        if from_fs is not None: return from_fs

    # resource was not found
    return None

def get_usertype(user):
    return user and user.usertype and user.usertype.replace(' ', '').lower()

def load_resource_at_level(collection, user, level, resource_name):
    """Try to load a resource from the filesystem at a given
    level of the resource hierarchy.
    Returns the resource data and mimetype as a pair.
    """
    logger.info('looking in FS at level: %s', level)
    path = get_path_for_level(collection, user, level)
    if path is None: return None
    registry = load_registry(path)
    if registry is None: return None
    return load_resource(path, registry, resource_name)

def get_path_for_level(collection, user, level):
    """Build the filesystem path for a given resource level."""

    discipline_dir = None if collection is None else \
        DISCIPLINE_DIRS.get(collection.discipline.type, None)
    usertype = get_usertype(user)

    paths = {
        'UserType'  : (discipline_dir, usertype) if discipline_dir and usertype else None,
        'Discipline': (discipline_dir,)          if discipline_dir else None,
        'Common'    : ('common'      ,),
        'Backstop'  : ('backstop'    ,)}

    path = paths.get(level, None)
    if path:
        return os.path.join(settings.SPECIFY_CONFIG_DIR, *path)

def load_registry(path, registry_filename='app_resources.xml'):
    """Loads the registry file from a directory on the filesystem.
    The registry maps resource names to filename in the directory.
    """
    pathname = os.path.join(path, registry_filename)
    try:
        return ElementTree.parse(pathname)
    except OSError as e:
        if e.errno == errno.ENOENT: return None
        else: raise

def load_resource(path, registry, resource_name):
    """Try to load the named resource using the given directory
    and registry.
    Returns the resource data and mimetype as a pair.
    """
    resource = registry.find('file[@name=%s]' % quoteattr(resource_name))
    if resource is None: return None
    pathname = os.path.join(path, resource.attrib['file'])
    try:
        return open(pathname).read(), resource.attrib['mimetype'], None
    except OSError as e:
        if e.errno == errno.ENOENT: return None
        else: raise

def get_app_resource_from_db(collection, user, level, resource_name):
    """Try to get the named resource at a given level from the database.
    Returns the resource data and mimetype as a pair."""
    logger.info('looking in DB at level: %s', level)
    # The database structure mimics a filesystem.
    # Here we get the SpAppResourceDir for the given level.
    dirs = get_app_resource_dirs_for_level(collection, user, level)

    # The resource query can now be filtered on the
    # resource name and the containing SpAppResourceDir.
    filters = {
        'spappresource__name': resource_name,
        'spappresource__spappresourcedir__in': dirs
    }

    try:
        resource = Spappresourcedata.objects.get(**filters)
        return resource.data, resource.spappresource.mimetype, resource.spappresource.id
    except Spappresourcedata.MultipleObjectsReturned:
        logger.warning('found multiple appresources for %s', filters)
        resource = Spappresourcedata.objects.filter(**filters)[0]
        return resource.data, resource.spappresource.mimetype, resource.spappresource.id
    except Spappresourcedata.DoesNotExist:
        # The resource does not exist in the database at the given level.
        return None

# Defines which fields to ignore when looking up
IGNORE = {}

def get_app_resource_dirs_for_level(collection, user, level):
    """Returns a queryset of SpAppResourceDir that match the user/collection context
    at the given level of the hierarchy. In principle the queryset should represent
    a single row. The queryset is returned so that the django ORM can use it to
    build a IN clause when selecting the actual SpAppResource row, resulting in
    a single query to get the resource."""

    usertype = get_usertype(user) if user is not None else None
    discipline = collection.discipline if collection is not None else None

    # Define what the filters (WHERE clause) are for each level.
    filter_levels = {
        'Columns'    : ('ispersonal', 'usertype', 'collection', 'discipline'),
        'Personal'   : (True        , IGNORE , collection  , discipline)  ,
        'UserType'   : (False       , usertype  , collection  , discipline)  ,
        'Collection' : (False       , None      , collection  , discipline)  ,
        'Discipline' : (False       , None      , None        , discipline)  ,
        'Common'     : (False       , IGNORE  , None        , None)
    }

    if level not in filter_levels: return []

    # Pull out the column names and values for the given level.
    columns, values = filter_levels['Columns'], filter_levels[level]
    raw_filters = dict(list(zip(columns, values)))

    # At the user level, add a clause for the user column.
    if raw_filters['ispersonal']:
        if user is None: return []
        raw_filters['specifyuser'] = user

    filters = {key: value
               for (key, value) in raw_filters.items()
               if value != IGNORE}

    # Build the queryset.
    return Spappresourcedir.objects.filter(**filters)

def merge_formatters(custom_xml, default_xml):
    """Merge custom and default XML formatters.
    This function takes two XML strings, one for custom formatters and one for default formatters,
    and merges them by adding any formatters from the default XML that are not already present in
    the custom XML. It returns the merged XML as a string.
    """
    
    custom_root = ElementTree.fromstring(custom_xml)
    default_root = ElementTree.fromstring(default_xml)
    
    # Create a set of existing classes in the custom XML to avoid duplicates
    custom_classes = set()
    for format_elem in custom_root.findall('format'):
        class_attr = format_elem.get('class')
        if class_attr:
            custom_classes.add(class_attr)

    # Add formatters from default that don't exist in custom
    for format_elem in default_root.findall('format'):
        class_attr = format_elem.get('class')
        if class_attr and class_attr not in custom_classes:
            custom_root.append(format_elem)
    
    # Convert the merged XML tree back to a string
    return ElementTree.tostring(custom_root, encoding='utf-8').decode('utf-8')
