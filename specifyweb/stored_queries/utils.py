from typing import List
from . import models
from specifyweb.businessrules.uniqueness_rules import UNIQUENESS_RULES
from specifyweb.stored_queries.queryfield import QueryField
import logging
logger = logging.getLogger(__name__)

def set_group_concat_max_len(session):
    """The default limit on MySQL group concat function is quite
    small. This function increases it for the database connection for
    the given session.
    """
    session.connection().execute('SET group_concat_max_len = 1024 * 1024 * 1024')


def filter_by_collection(model, query, collection):
    """Add predicates to the given query to filter result to items scoped
    to the given collection. The model argument indicates the "base"
    table of the query. E.g. If model was CollectingEvent, this
    function would limit the results to collecting events in the same
    discipline as the given collection since collecting events are
    scoped to the discipline level.
    """
    if (model is models.Accession and
        collection.discipline.division.institution.isaccessionsglobal):
        logger.info("not filtering query b/c accessions are global in this database")
        return query, None

    if model is models.Taxon:
        logger.info("filtering taxon to discipline: %s", collection.discipline.name)
        return query.filter(model.TaxonTreeDefID == collection.discipline.taxontreedef_id), 'definition'

    if model is models.TaxonTreeDefItem:
        logger.info("filtering taxon rank to discipline: %s", collection.discipline.name)
        return query.filter(model.TaxonTreeDefID == collection.discipline.taxontreedef_id), 'treedef'

    if model is models.Geography:
        logger.info("filtering geography to discipline: %s", collection.discipline.name)
        return query.filter(model.GeographyTreeDefID == collection.discipline.geographytreedef_id), 'definition'

    if model is models.GeographyTreeDefItem:
        logger.info("filtering geography rank to discipline: %s", collection.discipline.name)
        return query.filter(model.GeographyTreeDefID == collection.discipline.geographytreedef_id), 'treedef'

    if model is models.LithoStrat:
        logger.info("filtering lithostrat to discipline: %s", collection.discipline.name),
        return query.filter(model.LithoStratTreeDefID == collection.discipline.lithostrattreedef_id), 'definition'

    if model is models.LithoStratTreeDefItem:
        logger.info("filtering lithostrat rank to discipline: %s", collection.discipline.name)
        return query.filter(model.LithoStratTreeDefID == collection.discipline.lithostrattreedef_id), 'treedef'

    if model is models.GeologicTimePeriod:
        logger.info("filtering geologic time period to discipline: %s", collection.discipline.name)
        return query.filter(model.GeologicTimePeriodTreeDefID == collection.discipline.geologictimeperiodtreedef_id), 'definition'

    if model is models.GeologicTimePeriodTreeDefItem:
        logger.info("filtering geologic time period rank to discipline: %s", collection.discipline.name)
        return query.filter(model.GeologicTimePeriodTreeDefID == collection.discipline.geologictimeperiodtreedef_id), 'treedef'

    if model is models.Storage:
        logger.info("filtering storage to institution: %s", collection.discipline.division.institution.name)
        return query.filter(model.StorageTreeDefID == collection.discipline.division.institution.storagetreedef_id), 'definition'

    if model is models.StorageTreeDefItem:
        logger.info("filtering storage rank to institution: %s", collection.discipline.division.institution.name)
        return query.filter(model.StorageTreeDefID == collection.discipline.division.institution.storagetreedef_id), 'treedef'

    if model in (
            models.Agent,
            models.Accession,
            models.RepositoryAgreement,
            models.ExchangeIn,
            models.ExchangeOut,
            models.ConservDescription,
    ):
        return query.filter(model.DivisionID == collection.discipline.division_id), 'division'

    for filter_col, scope, scope_name, django_field in (
            ('CollectionID'       , lambda collection: collection, lambda o: o.collectionname, 'collection'),
            ('collectionMemberId' , lambda collection: collection, lambda o: o.collectionname, 'collectionmemberid'),
            ('DisciplineID'       , lambda collection: collection.discipline, lambda o: o.name, 'discipline'),

        # The below are disabled to match Specify 6 behavior.
            # ('DivisionID'         , lambda collection: collection.discipline.division, lambda o: o.name),
            # ('InstitutionID'      , lambda collection: collection.discipline.division.institution, lambda o: o.name),
    ):

        if hasattr(model, filter_col):
            o = scope(collection)
            logger.info("filtering query by %s: %s", filter_col, scope_name(o))
            return query.filter(getattr(model, filter_col) == o.id), django_field

    logger.warning("query not filtered by scope")
    return query, None


def apply_specify_user_name(query_field, user):
    if query_field.fieldspec.is_specify_username_end():
        if query_field.value == 'currentSpecifyUserName':
            return query_field._replace(value=user.name)
    return query_field

# Infers if a query contains enough uniqueness constraints to
# be uniquely identified, so recordid can be added.
def can_uniquely_identify(fields: List[QueryField], model_name, scoping_fields):

    edge_fields = set([field.fieldspec.join_path[0].name.lower() for field in fields
                   if field.display and len(field.fieldspec.join_path) > 0])

    edge_fields.add(*scoping_fields)

    is_supersets = [edge_fields.issuperset({*child, *parent})
                for (child, parent) in UNIQUENESS_RULES.get(model_name, [])]

    return any(is_supersets)

