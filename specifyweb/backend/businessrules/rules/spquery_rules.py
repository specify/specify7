from specifyweb.backend.businessrules.orm_signal_handler import orm_signal_handler


@orm_signal_handler('pre_save', 'Spquery')
def spquery_pre_save(spquery):
    """When a query is first created (or cloned via Save As), ensure it is not
    archived."""
    if spquery.pk is None and spquery.isarchived:
        spquery.isarchived = False
