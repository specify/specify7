from typing import Optional, Tuple, List
from sqlalchemy import select, union, join
from sqlalchemy.sql import Select
from sqlalchemy.orm import Query
from sqlalchemy.sql.selectable import FromClause, Alias, Join
from sqlalchemy.sql.schema import Table

def synonymize_taxon_query(query: Query) -> Query:
    """
    Expand a Taxon query to include taxa whose synonymized children match the original predicate.
    - If input is ORM Query: returns a *chainable* ORM Query (no from_statement), so .filter() still works.
    - If input is Core Select: returns a Select.

    Strategy (same semantics as before):
      target_taxon := (original FROM+JOINS + WHERE) projected as (t.TaxonID, t.AcceptedID)
      ids      := SELECT TaxonID UNION SELECT AcceptedID FROM target_taxon (AcceptedID NOT NULL)
      final    := (original SELECT list) + (original FROM/JOINS but *no WHERE*) + WHERE t.TaxonID IN (ids)
    """
    base_sel: Select = query.statement if isinstance(query, Query) else query

    # Find the Taxon base table and the specific FROM/alias used in the original query
    taxon_table, taxon_from = _find_taxon_table_and_from(base_sel)
    if taxon_table is None or taxon_from is None:
        raise ValueError("include_synonyms_preserve_projection: couldn't locate 'taxon' in the query FROMs.")

    # Build `target_taxon` CTE based on the given query
    target_taxon = select(
        taxon_from.c.TaxonID.label("TaxonID"),
        taxon_from.c.AcceptedID.label("AcceptedID"),
    )
    for f in base_sel.get_final_froms():
        target_taxon = target_taxon.select_from(f)
    for wc in getattr(base_sel, "_where_criteria", ()) or ():
        target_taxon = target_taxon.where(wc)
    for gb in getattr(base_sel, "_group_by_clauses", ()) or ():
        target_taxon = target_taxon.group_by(gb)
    if getattr(base_sel, "_having", None) is not None:
        target_taxon = target_taxon.having(base_sel._having)

    target_taxon_cte = target_taxon.cte("target_taxon")

    # Subquery to get the relevant ids for synonymy: TaxonID and AcceptedID
    ids = union(
        select(target_taxon_cte.c.TaxonID.label("id")),
        select(target_taxon_cte.c.AcceptedID.label("id")).where(target_taxon_cte.c.AcceptedID.isnot(None)),
    ).subquery("ids")

    # Build a fresh chainable ORM Query with the same SELECT and FROM statements, but no WHERE clause.
    # Add the 'WHERE t.TaxonID IN (ids)' clause at the end. This preserves ability to .filter() later.
    sess = query.session
    original_cols: List = list(base_sel.selected_columns)

    new_query = sess.query(*original_cols)
    # Attach the same FROM base tables as the orignal query, these already carry the join conditions
    for f in base_sel.get_final_froms():
        new_query = new_query.select_from(f)

    # Preserve GROUP BY / HAVING / ORDER BY from the original select, but not WHERE
    for gb in getattr(base_sel, "_group_by_clauses", ()) or ():
        new_query = new_query.group_by(gb)
    if getattr(base_sel, "_having", None) is not None:
        new_query = new_query.having(base_sel._having)
    if getattr(base_sel, "_order_by_clauses", None):
        new_query = new_query.order_by(*base_sel._order_by_clauses)

    # Add the synonym expansion as that clause WHERE .. IN (ids)
    new_query = new_query.filter(taxon_from.c.TaxonID.in_(select(ids.c.id)))
    return new_query

def _find_taxon_table_and_from(sel: Select) -> Tuple[Optional[Table], Optional[FromClause]]:
    """
    Robustly find:
      - the underlying Table for 'taxon' (the real Table object)
      - the specific FromClause (table OR alias) used in `sel` for 'taxon'
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
            el  = getattr(tbl, "element", None)
            if isinstance(tbl, Table) and is_taxon_table(tbl):
                return tbl, tbl
            if isinstance(el, Table) and is_taxon_table(el):
                return el, tbl  # tbl is the alias here
    except Exception:
        pass

    return None, None
