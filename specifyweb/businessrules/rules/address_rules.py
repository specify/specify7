from specifyweb.businessrules.orm_signal_handler import orm_signal_handler


@orm_signal_handler('pre_save', 'Address')
def at_most_one_primary_address_per_agent(address):
    if address.isprimary and address.agent is not None:
        address.agent.addresses.all().update(isprimary=False)
