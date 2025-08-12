import re
from contextlib import contextmanager
import logging
from typing import List

from specifyweb.specify.tree_ranks import RankOperation, post_tree_rank_save, pre_tree_rank_deletion, \
    verify_rank_parent_chain_integrity, pre_tree_rank_init, post_tree_rank_deletion
from specifyweb.specify.model_timestamp import save_auto_timestamp_field_with_override
from specifyweb.specify.field_change_info import FieldChangeInfo
logger = logging.getLogger(__name__)


from django.db import models, connection
from django.db.models import F, Q, ProtectedError
from django.conf import settings

from specifyweb.backend.businessrules.exceptions import TreeBusinessRuleException
import specifyweb.specify.models as spmodels

from  .auditcodes import TREE_BULK_MOVE, TREE_MERGE, TREE_SYNONYMIZE, TREE_DESYNONYMIZE

@contextmanager
def validate_node_numbers(table, revalidate_after=True):
    try:
        validate_tree_numbering(table)
    except AssertionError:
        renumber_tree(table)
    yield
    if revalidate_after:
        validate_tree_numbering(table)

class Tree(models.Model):
    class Meta:
        abstract = True

    def save(self, *args, skip_tree_extras=False, **kwargs):
        def save():
            save_auto_timestamp_field_with_override(super(Tree, self).save, args, kwargs, self)

        # This should be probably after the rank id gets set?
        if skip_tree_extras:
            return save()

        model = type(self)
        self.rankid = self.definitionitem.rankid
        self.definition = self.definitionitem.treedef

        prev_self = None if self.id is None \
                    else model.objects.select_for_update().get(id=self.id)

        if prev_self is None:
            self.nodenumber = None
            self.highestchildnodenumber = None
        else:
            self.nodenumber = prev_self.nodenumber
            self.highestchildnodenumber = prev_self.highestchildnodenumber

        if prev_self is None:
            if self.parent_id is None:
                # We're creating the root of a tree.
                # Not sure if anything else needs to be
                # done here, but the validation stuff won't
                # work so skipping it.
                save()
                return

            with validate_node_numbers(self._meta.db_table, revalidate_after=False):
                adding_node(self)
                save()
        elif prev_self.parent_id != self.parent_id:
            with validate_node_numbers(self._meta.db_table):
                moving_node(self)
                save()
        else:
            save()

        try:
            model.objects.get(Q(id=self.id) & (Q(parent__rankid__lt=F('rankid'))|Q(parent__isnull=True)))
        except model.DoesNotExist:
            raise TreeBusinessRuleException(
                "Tree node's parent has rank greater than itself",
                {"tree" : self.__class__.__name__,
                 "localizationKey" : "nodeParentInvalidRank",
                 "node" : {
                    "id" : self.id,
                    "rankid" : self.rankid,
                    "fullName" : self.fullname,
                    "parentid": self.parent.id,
                    "children": list(self.children.values('id', 'fullname'))
                 },
                 "parent" : {
                    "id": self.parent.id,
                    "rankid" : self.parent.rankid,
                    "fullName": self.parent.fullname,
                    "parentid": self.parent.parent.id,
                    "children": list(self.parent.children.values('id', 'fullname'))
                 }
                 })

        if model.objects.filter(parent=self, parent__rankid__gte=F('rankid')).count() > 0:
            raise TreeBusinessRuleException(
                "Tree node's rank is greater than or equal to some of its children",
                {"tree" : self.__class__.__name__,
                 "localizationKey" : "nodeChildrenInvalidRank",
                 "node" : {
                    "id" : self.id,
                    "rankid" : self.rankid,
                    "fullName" : self.fullname,
                    "parentid": self.parent.id,
                    "children": list(self.children.values('id', 'rankid', 'fullname').filter(parent=self, parent__rankid__gte=F('rankid')))
                 }})

        if prev_self is None:
            set_fullnames(self.definition, null_only=True, node_number_range=[self.nodenumber, self.highestchildnodenumber])
        elif (
            prev_self.name != self.name
            or prev_self.definitionitem_id != self.definitionitem_id
            or prev_self.parent_id != self.parent_id
        ):
            set_fullnames(self.definition, node_number_range=[self.nodenumber, self.highestchildnodenumber])

    def accepted_id_attr(self):
        return f'accepted{self._meta.db_table}_id'

    @property
    def accepted_id(self):
        return getattr(self, self.accepted_id_attr())

    @accepted_id.setter
    def accepted_id(self, value):
        setattr(self, self.accepted_id_attr(), value)

class TreeRank(models.Model):
    class Meta:
            abstract = True

    def save(self, *args, **kwargs):
        # pre_save
        if self.pk is None: # is it a new object?
            pre_tree_rank_init(self)
            verify_rank_parent_chain_integrity(self, RankOperation.CREATED)
        else:
            verify_rank_parent_chain_integrity(self, RankOperation.UPDATED)
        
        # save
        super().save(*args, **kwargs)

        # post_save
        post_tree_rank_save(self.__class__, self)

    def delete(self, *args, allow_root_del=False, **kwargs):
        # pre_delete
        if not allow_root_del and self.__class__.objects.get(id=self.id).parent is None:
            raise TreeBusinessRuleException(
                "cannot delete root level tree definition item",
                {"tree": self.__class__.__name__,
                 "localizationKey": 'deletingTreeRoot',
                 "node": {
                     "id": self.id
                 }})
        pre_tree_rank_deletion(self.__class__, self)
        verify_rank_parent_chain_integrity(self, RankOperation.DELETED)

        # delete
        super().delete(*args, **kwargs)

        # post_delete
        post_tree_rank_deletion(self)


def open_interval(model, parent_node_number, size):
    """Open a space of given size in a tree model under the given parent.
    The insertion point will be directly after the parent_node_number.
    Returns the instertion point.
    """
    # All intervals to the right of parent node get shifted right by size.
    model.objects.filter(nodenumber__gt=parent_node_number).update(
        nodenumber=F('nodenumber')+size,
        highestchildnodenumber=F('highestchildnodenumber')+size,
    )
    # All intervals containing the insertion point get expanded by size.
    model.objects.filter(nodenumber__lte=parent_node_number, highestchildnodenumber__gte=parent_node_number)\
        .update(highestchildnodenumber=F('highestchildnodenumber')+size)

    return parent_node_number + 1

def move_interval(model, old_node_number, old_highest_child_node_number, new_node_number):
    """Adjust the node numbers to move an interval and all of its children
    to a new nodenumber range. There must be a gap of sufficient size
    at the destination. Leaves a gap at the old node number range.
    """
    delta = new_node_number - old_node_number
    model.objects.filter(nodenumber__gte=old_node_number, nodenumber__lte=old_highest_child_node_number)\
        .update(nodenumber=F('nodenumber')+delta, highestchildnodenumber=F('highestchildnodenumber')+delta)

def close_interval(model, node_number, size):
    """Close a gap where an interval was removed."""
    # All intervals containing the gap get reduced by size.
    model.objects.filter(nodenumber__lte=node_number, highestchildnodenumber__gte=node_number)\
        .update(highestchildnodenumber=F('highestchildnodenumber')-size)
    # All intervals to the right of node_number get shifted left by size.
    model.objects.filter(nodenumber__gt=node_number).update(
        nodenumber=F('nodenumber')-size,
        highestchildnodenumber=F('highestchildnodenumber')-size,
    )

def adding_node(node):
    logger.info('adding node %s', node)
    model = type(node)
    parent = model.objects.select_for_update().get(id=node.parent.id)
    if parent.accepted_id is not None:
        from specifyweb.backend.context.remote_prefs import get_remote_prefs
        # This business rule can be overriden by a remote pref.
        pattern = r'^sp7\.allow_adding_child_to_synonymized_parent\.' + node.specify_model.name + '=(.+)'
        override = re.search(pattern, get_remote_prefs(), re.MULTILINE)
        if override is None or override.group(1).strip().lower() != "true":
            raise TreeBusinessRuleException(
                f'Adding node "{node.fullname}" to synonymized parent "{parent.fullname}"',
                {"tree" : "Taxon",
                 "localizationKey" : "nodeOperationToSynonymizedParent",
                 "operaton" : "Adding",
                 "node" : {
                    "id" : node.id,
                    "rankid" : node.rankid,
                    "fullName" : node.fullname,
                    "parentid": node.parent.id,
                    "children": list(node.children.values('id', 'fullname'))
                 },
                 "parent" : {
                    "id" : parent.id,
                    "rankid" : parent.rankid,
                    "fullName" : parent.fullname,
                    "parentid": parent.parent.id,
                    "children": list(parent.children.values('id', 'fullname'))
                 }})

    insertion_point = open_interval(model, parent.nodenumber, 1)
    node.highestchildnodenumber = node.nodenumber = insertion_point

def moving_node(to_save):
    logger.info('moving node %s', to_save)
    model = type(to_save)
    current = model.objects.get(id=to_save.id)
    size = current.highestchildnodenumber - current.nodenumber + 1
    new_parent = model.objects.select_for_update().get(id=to_save.parent.id)
    if new_parent.accepted_id is not None:
        raise TreeBusinessRuleException(
            f'Moving node "{to_save.fullname}" to synonymized parent "{new_parent.fullname}"',
            {"tree" : "Taxon",
             "localizationKey" : "nodeOperationToSynonymizedParent",
             "operation" : "Moving",
             "node" : {
                "id" : to_save.id,
                "rankid" : to_save.rankid,
                "fullName" : to_save.fullname,
                "parentid": to_save.parent.id,
                "children": list(to_save.children.values('id', 'fullname'))
             },
             "parent" : {
                "id" : new_parent.id,
                "rankid" : new_parent.rankid,
                "fullName" : new_parent.fullname,
                "parentid": new_parent.parent.id,
                "children": list(new_parent.children.values('id', 'fullname'))
             }})

    insertion_point = open_interval(model, new_parent.nodenumber, size)
    # node interval will have moved if it is to the right of the insertion point
    # so fetch again
    current = model.objects.get(id=current.id)
    move_interval(model, current.nodenumber, current.highestchildnodenumber, insertion_point)
    close_interval(model, current.nodenumber, size)

    # update the nodenumbers in to_save so the new values are not overwritten.
    current = model.objects.get(id=current.id)
    to_save.nodenumber = current.nodenumber
    to_save.highestchildnodenumber = current.highestchildnodenumber

def mutation_log(action, node, agent, parent, dirty_flds: list[FieldChangeInfo]):
    from .auditlog import auditlog
    auditlog.log_action(action, node, agent, node.parent, dirty_flds)

def merge(node, into, agent):
    from . import models
    logger.info('merging %s into %s', node, into)
    model = type(node)
    if not type(into) is model: raise AssertionError(
        f"Unexpected type of node '{into.__class__.__name__}', during merge. Expected '{model.__class__.__name__}'",
        {"node" : into.__class__.__name__,
        "nodeModel" : model.__class__.__name__,
        "operation" : "merge",
        "localizationKey" : "invalidNodeType"})
    target = model.objects.select_for_update().get(id=into.id)
    if not (node.definition_id == target.definition_id): raise AssertionError("merging across trees", {"localizationKey" : "operationAcrossTrees", "operation": "merge"})
    if into.accepted_id is not None:
        raise TreeBusinessRuleException(
            f'Merging node "{node.fullname}" with synonymized node "{into.fullname}"',
            {"tree" : "Taxon",
             "localizationKey" : "nodeOperationToSynonymizedParent",
             "operation" : "Merging",
             "node" : {
                "id" : node.id,
                "rankid" : node.rankid,
                "fullName" : node.fullname,
                "parentid": node.parent.id,
                "children": list(node.children.values('id', 'fullname'))
             },
             "synonymized" : {
                "id" : into.id,
                "rankid" : into.rankid,
                "fullName" : into.fullname,
                "parentid": into.parent.id,
                "children": list(into.children.values('id', 'fullname'))
             }})
    target_children = target.children.select_for_update()
    for child in node.children.select_for_update():
        matched = [target_child for target_child in target_children
                   if child.name == target_child.name and child.rankid == target_child.rankid]
        if len(matched) > 0:
            merge(child, matched[0], agent)
        else:
            child.parent = target
            child.save()
   
    for retry in range(100):
        try:
            id = node.id
            node.delete()
            # Seems like this is done for the audit log. Why not log first, and then delete?
            # That way, we don't need to set the ID like below (quite a hack.)
            node.id = id
            mutation_log(TREE_MERGE, node, agent, node.parent,
                        [FieldChangeInfo(field_name=model.specify_model.idFieldName, old_value=node.id, new_value=into.id)])
            return
        except ProtectedError as e: 
            """ Cannot delete some instances of TREE because they are referenced 
            through protected foreign keys: 'Table.field', Table.field', ... """
            
            regex_matches = re.finditer(r"'(\w+)\.(\w+)'", e.args[0])
            for match in regex_matches:
                related_model_name, field_name = match.groups()
                related_model = getattr(models, related_model_name)
                assert related_model != model or field_name != 'parent', 'children were added during merge'
                related_model.objects.filter(**{field_name: node}).update(**{field_name: target})

    assert False, "failed to move all referrences to merged tree node"

def bulk_move(node, into, agent):
    from . import models
    logger.info('Bulk move preparations from %s to %s', node, into)
    model = type(node)
    if not type(into) is model: raise AssertionError(
        f"Unexpected type of node '{into.__class__.__name__}', during bulk move. Expected '{model.__class__.__name__}'",
        {"node" : into.__class__.__name__,
        "nodeModel" : model.__class__.__name__,
        "operation" : "bulk_move",
        "localizationKey" : "invalidNodeType"})
    target = model.objects.select_for_update().get(id=into.id)
    if not (node.definition_id == target.definition_id): raise AssertionError("Bulk move across trees", {"localizationKey" : "operationAcrossTrees", "operation": "bulk move"})

    models.Preparation.objects.filter(storage = node).update(storage = into)

    field_change_info: FieldChangeInfo = FieldChangeInfo(field_name=model.specify_model.idFieldName, old_value=node.id, new_value=into.id)
    mutation_log(TREE_BULK_MOVE, node, agent, node.parent, [field_change_info])

def synonymize(node, into, agent):
    logger.info('synonymizing %s to %s', node, into)
    model = type(node)
    if not type(into) is model: raise AssertionError(
        f"Unexpected type '{into.__class__.__name__}', during synonymize. Expected '{model.__class__.__name__}'",
        {"node" : into.__class__.__name__,
        "nodeModel" : model.__class__.__name__,
        "operation" : "synonymize",
        "localizationKey" : "invalidNodeType"})
    target = model.objects.select_for_update().get(id=into.id)
    if not (node.definition_id == target.definition_id): raise AssertionError("synonymizing across trees", {"localizationKey" : "operationAcrossTrees", "operation": "synonymize"})
    if target.accepted_id is not None:
        raise TreeBusinessRuleException(
            f'Synonymizing "{node.fullname}" to synonymized node "{into.fullname}"',
            {"tree" : "Taxon",
             "localizationKey" : "nodeSynonymizeToSynonymized",
             "node" : {
                "id" : node.id,
                "rankid" : node.rankid,
                "fullName" : node.fullname,
                "parentid": node.parent.id,
                "children": list(node.children.values('id', 'fullname'))
             },
             "synonymized" : {
                "id" : into.id,
                "rankid" : into.rankid,
                "fullName" : into.fullname,
                "parentid": into.parent.id,
                "children": list(into.children.values('id', 'fullname'))
             }})
    node.accepted_id = target.id
    node.isaccepted = False
    node.save()

    # This check can be disabled by a remote pref
    from specifyweb.backend.context.remote_prefs import get_remote_prefs
    pattern = r'^sp7\.allow_adding_child_to_synonymized_parent\.' + node.specify_model.name + '=(.+)'
    override = re.search(pattern, get_remote_prefs(), re.MULTILINE)
    if node.children.count() > 0 and (override is None or override.group(1).strip().lower() != "true"):
        raise TreeBusinessRuleException(
            f'Synonymizing node "{node.fullname}" which has children',
            {"tree" : "Taxon",
             "localizationKey" : "nodeSynonimizeWithChildren",
             "node" : {
                "id" : node.id,
                "rankid" : node.rankid,
                "fullName" : node.fullname,
                "children": list(node.children.values('id', 'fullname'))
             },
             "parent" : {
                "id" : into.id,
                "rankid" : into.rankid,
                "fullName" : into.fullname,
                "parentid": into.parent.id,
                "children": list(into.children.values('id', 'fullname'))
             }})
    node.acceptedchildren.update(**{node.accepted_id_attr().replace('_id', ''): target})
    #assuming synonym can't be synonymized
    field_change_infos = [
        FieldChangeInfo(field_name='acceptedid', old_value=None, new_value=target.id),
        FieldChangeInfo(field_name='isaccepted', old_value=True, new_value=False)
        ]
    mutation_log(TREE_SYNONYMIZE, node, agent, node.parent, field_change_infos)

    if model._meta.db_table == 'taxon':
        node.determinations.update(preferredtaxon=target)
        from .models import Determination
        Determination.objects.filter(preferredtaxon=node).update(preferredtaxon=target)

def desynonymize(node, agent):
    logger.info('desynonmizing %s', node)
    model = type(node)
    old_acceptedid = node.accepted_id
    node.accepted_id = None
    node.isaccepted = True
    node.save()

    field_change_infos = [
        FieldChangeInfo(field_name='acceptedid', old_value=old_acceptedid, new_value=None),
        FieldChangeInfo(field_name='isaccepted', old_value=False, new_value=True)
    ]
    mutation_log(TREE_DESYNONYMIZE, node, agent, node.parent, field_change_infos)

    if model._meta.db_table == 'taxon':
        node.determinations.update(preferredtaxon=F('taxon'))

EMPTY = "''"
TRUE = "true"
FALSE = "false"

def OR(exprs):
    if len(exprs) == 0:
        return FALSE
    elif len(exprs) == 1:
        return exprs[0]
    else:
        return '({})'.format(' or '.join(exprs))

def IF(if_expr, then_expr, else_expr=EMPTY):
    if if_expr == TRUE:
        return then_expr
    elif if_expr == FALSE:
        return else_expr
    else:
        return f'if({if_expr}, {then_expr}, {else_expr})'

def CONCAT(exprs, separator=''):
    exprs = [e for e in exprs if e != EMPTY]

    if len(exprs) == 0:
        return EMPTY
    elif len(exprs) == 1:
        return exprs[0]
    else:
        # use concat_ws because it skips nulls.
        return "concat_ws('{}', {})".format(separator, ', '.join(exprs))

def NAME(index):
    return f't{index}.name'

def IN_NAME(index):
    return f'd{index}.isinfullname'

def SEPARATOR(index):
    return f'd{index}.fullnameseparator'

def BEFORE(index):
    return f'd{index}.textbefore'

def AFTER(index):
    return f'd{index}.textafter'

def ID(table, index):
    return f't{index}.{table}id'

def NODENUMBER(index):
    return f't{index}.nodenumber'

def fullname_expr(depth, reverse):
    fullname = CONCAT([
        IF(IN_NAME(i),
           CONCAT([
               BEFORE(i),
               NAME(i),
               AFTER(i),
               IF( # include separator if anything comes after
                OR([
                    IN_NAME(j)
                    # if going from leaf to root, "after" means farther down, j = i+1 -> depth-1.
                    # if going from root to leaf, "after" means farther up, j = i-1 -> 0.
                    for j in (list(range(i+1, depth)) if reverse else reversed(list(range(i))))
                ]),
                SEPARATOR(i)
               )
           ]))
        # forward is root to leaf
        # reverse is leaf to root
        # leaf is i = 0, root is i = depth-1
        for i in (list(range(depth)) if reverse else reversed(list(range(depth))))
    ])

    # if node is not in fullname, its fullname is just its name
    return IF(IN_NAME(0), fullname, NAME(0))

def parent_joins(table, depth):
    return '\n'.join([
        "left join {table} t{1} on t{0}.parentid = t{1}.{table}id".format(j-1, j, table=table)
        for j in range(1, depth)
    ])

def definition_joins(table, depth):
    return '\n'.join([
        "left join {table}treedefitem d{0} on t{0}.{table}treedefitemid = d{0}.{table}treedefitemid".format(j, table=table)
        for j in range(depth)
    ])

def set_fullnames(treedef, null_only=False, node_number_range=None):
    table = treedef.treeentries.model._meta.db_table
    depth = treedef.treedefitems.count()
    reverse = treedef.fullnamedirection == -1
    treedefid = treedef.id
    logger.info('set_fullnames: %s', (table, treedefid, depth, reverse))
    if depth < 1:
        return
    cursor = connection.cursor()
    sql = (
        "update {table} t0\n"
        "{parent_joins}\n"
        "{definition_joins}\n"
        "set {set_expr}\n"
        "where t{root}.parentid is null\n"
        "and t0.{table}treedefid = {treedefid}\n"
        "and t0.acceptedid is null\n"
        "{null_only}\n"
        "{node_number_range}\n"
    ).format(
        root=depth-1,
        table=table,
        treedefid=treedefid,
        set_expr=f"t0.fullname = {fullname_expr(depth, reverse)}",
        parent_joins=parent_joins(table, depth),
        definition_joins=definition_joins(table, depth),
        null_only="and t0.fullname is null" if null_only else "",
        node_number_range=f"and t0.nodenumber between {node_number_range[0]} and {node_number_range[1]}" if not (node_number_range is None) else ''
    )

    logger.debug('fullname update sql:\n%s', sql)
    return cursor.execute(sql)

def predict_fullname(table, depth, parentid, defitemid, name, reverse=False):
    cursor = connection.cursor()
    sql = (
        "select {fullname}\n"
        "from (select %(name)s as name,\n"
        "      %(parentid)s as parentid,\n"
        "      %(defitemid)s as {table}treedefitemid) t0\n"
        "{parent_joins}\n"
        "{definition_joins}\n"
        "where t{root}.parentid is null\n"
    ).format(
        root=depth-1,
        table=table,
        fullname=fullname_expr(depth, reverse),
        parent_joins=parent_joins(table, depth),
        definition_joins=definition_joins(table, depth),
    )
    cursor.execute(sql, {'name': name, 'parentid': parentid, 'defitemid': defitemid})
    fullname, = cursor.fetchone()
    return fullname


def validate_tree_numbering(table):
    logger.info('validating tree')
    cursor = connection.cursor()
    cursor.execute(
        "select count(*), count(distinct nodenumber), count(highestchildnodenumber)\n"
        "from {table}".format(table=table)
    )
    node_count, nn_count, hcnn_count = cursor.fetchone()
    assert node_count == nn_count == hcnn_count, \
        "found {} nodes but {} nodenumbers and {} highestchildnodenumbers" \
        .format(node_count, nn_count, hcnn_count)

    cursor.execute((
        "select count(*) from {table} t join {table} p on t.parentid = p.{table}id\n"
        "where t.rankid <= p.rankid\n"
        "and t.acceptedid is null"
    ).format(table=table))
    bad_ranks_count, = cursor.fetchone()
    assert bad_ranks_count == 0, \
        "found {} cases where node rank is not greater than its parent." \
        .format(bad_ranks_count)

    cursor.execute((
        "select count(*) from {table} t join {table} p on t.parentid = p.{table}id\n"
        "where t.nodenumber not between p.nodenumber and p.highestchildnodenumber\n"
    ).format(table=table))
    not_nested_count, = cursor.fetchone()
    assert not_nested_count == 0, \
        f"found {not_nested_count} nodenumbers not nested by parent"

def path_expr(table, depth):
    return CONCAT([ID(table, i) for i in reversed(list(range(depth)))], ',')

def print_paths(table, depth):
    cursor = connection.cursor()
    sql = "select t0.nodenumber as nn, {path} as path from {table} t0 {parent_joins} order by nn".format(
        table=table,
        path=path_expr(table, depth),
        parent_joins=parent_joins(table, depth),
    )
    cursor.execute(sql)
    for r in cursor.fetchall()[:100]:
        print(r)
    print(sql)

def renumber_tree(table):
    logger.info('renumbering tree')
    cursor = connection.cursor()

    # make sure rankids are set correctly
    cursor.execute((
        "update {table} t\n"
        "join {table}treedefitem d on t.{table}treedefitemid = d.{table}treedefitemid\n"
        "set t.rankid = d.rankid\n"
    ).format(table=table))

    # make sure there are no cycles
    cursor.execute((
        "select p.{table}id, p.fullname, t.{table}id, t.fullName, tdef.title\n"
        "from {table} t\n"
        "join {table} p on t.parentid = p.{table}id\n"
        "join {table}treedefitem tdef on t.{table}treedefitemid=tdef.{table}treedefitemid\n"
        "where t.rankid <= p.rankid\n"
        "and t.acceptedid is null"
    ).format(table=table))
    results = cursor.fetchall()
    formattedResults = {
        "nodeData" : [
            {
            "parent" : {
              f"{table.capitalize()} ID" : parentID,
              "Full Name" : parentName
        },
            "child" : {
              f"{table.capitalize()} ID" : childID,
              "Full Name" : childName,
              "Bad Rank" : childRank
        }} for parentID, parentName, childID, childName, childRank in results],
        "localizationKey" : "badTreeStructureInvalidRanks",
    }
    bad_ranks_count = cursor.rowcount
    formattedResults["badRanks"] = bad_ranks_count
    if bad_ranks_count > 0:
        # raise AssertionError( # Phasing out node numbering, logging as warning instead of raising an exception
        logger.warning(
            f"Bad Tree Structure: Found {bad_ranks_count} case(s) where node rank is not greater than its parent",
            formattedResults,
        )

    # Get the tree ranks in leaf -> root order.
    cursor.execute(f"select distinct rankid from {table} order by rankid desc")
    ranks = [rank for (rank,) in cursor.fetchall()]
    depth = len(ranks)

    # Construct a path enumeration for each node and set the
    # nodenumbers according to the lexical ordering of the paths. This
    # ensures ancestor node numbers come before descendents and
    # sibling nodes get consecutive ranges.
    cursor.execute("set @rn := 0")
    cursor.execute((
        "update {table} t\n"
        "join (select @rn := @rn + 1 as nn, p.id as id from \n"
        "         (select t0.{table}id as id, {path} as path\n"
        "          from {table} t0\n"
        "          {parent_joins}\n"
        "          order by path) p\n"
        ") r on t.{table}id = r.id\n"
        # Set the highestchildnodenumber to be the same as the
        # nodenumber.  This is correct for leaves, and interior nodes
        # will be adjusted in the next step.
        "set t.nodenumber = r.nn, t.highestchildnodenumber = r.nn\n"
    ).format(
        table=table,
        path=path_expr(table, depth),
        parent_joins=parent_joins(table, depth),
    ))

    # Adjust the highestchildnodenumbers working from the penultimate
    # rank downward towards the roots. The highest rank cannot have
    # any children, so all nodes there correctly have
    # highestchildnodenumber = nodenumber as set in the previous step.
    # Interior nodes are updated by inner joining against their
    # children so that nodes with no children are not updated leaving
    # highestchildnodenumber = nodenumber.
    for rank in ranks[1:]:
        cursor.execute((
            "update {table} t join (\n"
            "   select max(highestchildnodenumber) as hcnn, parentid\n"
            "   from {table} where rankid > %(rank)s group by parentid\n"
            ") as sub on sub.parentid = t.{table}id\n"
            "set highestchildnodenumber = hcnn where rankid = %(rank)s\n"
        ).format(table=table), {'rank': rank})

    # Clear the BadNodes and UpdateNodes flags.
    from .models import datamodel, Sptasksemaphore
    tree_model = datamodel.get_table(table)
    tasknames = [name.format(tree_model.name) for name in ("UpdateNodes{}", "BadNodes{}")]
    Sptasksemaphore.objects.filter(taskname__in=tasknames).update(islocked=False)

def is_treedefitem(obj):
    return issubclass(obj.__class__, TreeRank) or bool(
        re.search(r"treedefitem'>$", str(obj.__class__), re.IGNORECASE)
    )

def is_treedef(obj):
    return issubclass(obj.__class__, Tree) or bool(
        re.search(r"treedef'>$", str(obj.__class__), re.IGNORECASE)
    )
