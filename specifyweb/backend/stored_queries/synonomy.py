from typing import Optional, Tuple, List
from sqlalchemy import select, union
from sqlalchemy.sql import Select
from sqlalchemy.orm import Query
from sqlalchemy.sql.selectable import FromClause, Alias, Join
from sqlalchemy.sql.schema import Table

def synonymize_taxon_query(query: Query) -> Query:
    """
    Expand a Taxon query to include taxa whose synonymized children match the original predicate.

    Strategy:
      target_taxon := (original FROM+JOINS + WHERE) projected as (t.TaxonID, t.AcceptedID)
      ids          := SELECT TaxonID UNION SELECT AcceptedID FROM target_taxon (AcceptedID NOT NULL)
      final        := (original SELECT list) + (original FROM/JOINS but *no WHERE*)
                      + WHERE t.TaxonID IN (ids)
    """
    base_sel: Select = query.statement if isinstance(query, Query) else query

    # Find the Taxon base table and the specific FROM/alias used in the original query
    taxon_table, taxon_from = _find_taxon_table_and_from(base_sel)
    if taxon_table is None or taxon_from is None:
        raise ValueError("synonymize_taxon_query: couldn't locate 'taxon' in the query FROMs.")

    # Build `target_taxon` CTE based on the given query
    target_taxon_cte = _build_target_taxon_cte(base_sel, taxon_from, cte_name="target_taxon")

    # Subquery to get the relevant ids for synonymy: TaxonID and AcceptedID
    ids = union(
        select(target_taxon_cte.c.TaxonID.label("id")),
        select(target_taxon_cte.c.AcceptedID.label("id")).where(
            target_taxon_cte.c.AcceptedID.isnot(None)
        ),
    ).subquery("ids")

    # Rebuild a fresh chainable ORM Query using these ids
    return _rebuild_query_with_ids(query, base_sel, taxon_from, ids)

def synonymize_by_expanding_accepted_taxon_query(query: Query) -> Query:
    """
    Expand a Taxon query in the *opposite* direction of synonymize_taxon_query:
    - Start from the taxa that match the original predicate (usually accepted taxa),
    - Then include all synonyms whose AcceptedID points to those taxa.

    Strategy:
      target_taxon := (original FROM+JOINS + WHERE) projected as (t.TaxonID, t.AcceptedID)
      root_ids     := SELECT TaxonID FROM target_taxon          -- the "root" taxa
      syn_ids      := SELECT TaxonID FROM taxon WHERE AcceptedID IN (root_ids)
      ids          := root_ids UNION syn_ids
      final        := (original SELECT list) + (original FROM/JOINS but *no WHERE*)
                      + WHERE t.TaxonID IN (ids)
    """
    base_sel: Select = query.statement if isinstance(query, Query) else query

    # Find the Taxon base table and the specific FROM/alias used in the original query
    taxon_table, taxon_from = _find_taxon_table_and_from(base_sel)
    if taxon_table is None or taxon_from is None:
        raise ValueError("expand_accepted_taxon_query: couldn't locate 'taxon' in the query FROMs.")

    # Build `target_taxon` CTE based on the given query
    target_taxon_cte = _build_target_taxon_cte(base_sel, taxon_from, cte_name="target_taxon")

    # root_ids: the taxa that actually matched the original predicate
    root_ids = select(target_taxon_cte.c.TaxonID.label("id"))

    # syn_ids: any taxon whose AcceptedID points at one of those root_ids
    # Use the underlying taxon_table (not the alias) so we don't bring over the original WHERE.
    syn_ids = select(taxon_table.c.TaxonID.label("id")).where(
        taxon_table.c.AcceptedID.in_(
            select(target_taxon_cte.c.TaxonID)
        )
    )

    ids = union(root_ids, syn_ids).subquery("ids")

    # Rebuild a fresh chainable ORM Query using these ids
    return _rebuild_query_with_ids(query, base_sel, taxon_from, ids)

def _build_target_taxon_cte(
    base_sel: Select,
    taxon_from: FromClause,
    cte_name: str = "target_taxon",
):
    """
    Given the original Select and the Taxon FromClause/alias used in it,
    build a CTE that projects (TaxonID, AcceptedID) with all original
    FROM / WHERE / GROUP BY / HAVING preserved.
    """
    target_taxon = select(
        taxon_from.c.TaxonID.label("TaxonID"),
        taxon_from.c.AcceptedID.label("AcceptedID"),
    )

    # Re-attach the original FROM roots
    for f in base_sel.get_final_froms():
        target_taxon = target_taxon.select_from(f)

    # Re-apply WHERE, GROUP BY, HAVING (but not ORDER BY)
    for wc in getattr(base_sel, "_where_criteria", ()) or ():
        target_taxon = target_taxon.where(wc)
    for gb in getattr(base_sel, "_group_by_clauses", ()) or ():
        target_taxon = target_taxon.group_by(gb)
    if getattr(base_sel, "_having", None) is not None:
        target_taxon = target_taxon.having(base_sel._having)

    return target_taxon.cte(cte_name)

def _rebuild_query_with_ids(
    query: Query,
    base_sel: Select,
    taxon_from: FromClause,
    ids_subquery: FromClause,
) -> Query:
    """
    Take the original ORM Query + its underlying Select and rebuild a new,
    chainable ORM Query:
      - Same selected columns
      - Same FROM (joins included)
      - Same GROUP BY / HAVING / ORDER BY
      - No original WHERE
      - Adds WHERE taxon.TaxonID IN (SELECT id FROM ids_subquery)
    """
    sess = query.session
    original_cols: List = list(base_sel.selected_columns)

    new_query = sess.query(*original_cols)

    # Attach the same FROM base tables as the original query;
    # these already carry the join conditions.
    for f in base_sel.get_final_froms():
        new_query = new_query.select_from(f)

    # Preserve GROUP BY / HAVING / ORDER BY from the original select, but not WHERE
    for gb in getattr(base_sel, "_group_by_clauses", ()) or ():
        new_query = new_query.group_by(gb)
    if getattr(base_sel, "_having", None) is not None:
        new_query = new_query.having(base_sel._having)
    if getattr(base_sel, "_order_by_clauses", None):
        new_query = new_query.order_by(*base_sel._order_by_clauses)

    # Apply the expansion condition
    new_query = new_query.filter(taxon_from.c.TaxonID.in_(select(ids_subquery.c.id)))
    return new_query

def _find_taxon_table_and_from(sel: Select) -> Tuple[Optional[Table], Optional[FromClause]]:
    """
    Find the underlying Table for 'taxon' (the real Table object) and the specific FromClause (table OR alias) used in `sel` for 'taxon'
    Works with: Table, Alias(Table), Join trees, Alias(Join(...)).
    """

    target_name = "taxon"

    def is_taxon_table(t: Table) -> bool:
        # Compare case-insensitively; handle schema-qualified names if any
        try:
            return t.name is not None and t.name.lower() == target_name
        except Exception:
            return False

    def walk(fc: FromClause) -> Tuple[Optional[Table], Optional[FromClause]]:
        # Plain Table
        if isinstance(fc, Table) and is_taxon_table(fc):
            return fc, fc

        # Alias of something
        el = getattr(fc, "element", None)
        if isinstance(fc, Alias) and el is not None:
            # Alias(Table)
            if isinstance(el, Table) and is_taxon_table(el):
                return el, fc
            # Alias(Join/Selectable): recurse into the element
            if isinstance(el, Join):
                t, frm = walk(el)
                if t is not None:
                    # Keep the alias as the "from" if it aliases a Table directly; but for Alias(Join),
                    # we still want the real FromClause for 'taxon' inside that join tree.
                    return t, frm

        # Join: recurse both sides (left, right can themselves be Alias, Join, Table, etc.)
        if isinstance(fc, Join):
            t, frm = walk(fc.left)
            if t is not None:
                return t, frm
            t, frm = walk(fc.right)
            if t is not None:
                return t, frm

        # Unknown / composite: give up on this node
        return None, None

    # Try walking all final FROM roots
    for f in sel.get_final_froms():
        t, frm = walk(f)
        if t is not None and frm is not None:
            return t, frm

    # Fallback to scanning selected columns to deduce the taxon alias
    try:
        for col in sel.selected_columns:
            tbl = getattr(col, "table", None)
            el = getattr(tbl, "element", None)
            if isinstance(tbl, Table) and is_taxon_table(tbl):
                return tbl, tbl
            if isinstance(el, Table) and is_taxon_table(el):
                return el, tbl  # tbl is the alias here
    except Exception:
        pass

    return None, None
