from specifyweb.backend.businessrules.orm_signal_handler import orm_signal_handler


@orm_signal_handler('pre_save', 'Locality')
def make_sure_srclatlongunit_is_set(locality):
    # This is kind of bogus. But the field can't be null,
    # and the new UI supports different units in the lat and long fields.
    # I don't understand why it can't just be detected from the source value.
    if locality.srclatlongunit is None:
        locality.srclatlongunit = 0
