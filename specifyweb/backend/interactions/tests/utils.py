from specifyweb.specify.models import (
    Disposalpreparation,
    Exchangeinprep,
    Exchangeoutprep,
    Giftpreparation,
    Loanpreparation,
)


mapping = {
    "loan": dict(model=Loanpreparation, backref="loan", ref="loanpreparations"),
    "gift": dict(model=Giftpreparation, backref="gift", ref="giftpreparations"),
    "exchangeout": dict(
        model=Exchangeoutprep, backref="exchangeout", ref="exchangeoutpreps"
    ),
    "disposal": dict(
        model=Disposalpreparation, backref="disposal", ref="disposalpreparations"
    ),
    "exchangein": dict(
        model=Exchangeinprep, backref="exchangein", ref="exchangeinpreps"
    ),
}


def _create_interaction_prep_generic(context, obj, prep, prep_list, **loan_prep_kwargs):
    mapped = mapping[obj._meta.model_name.lower()]
    loan_prep_kwargs[mapped["backref"]] = obj
    if obj._meta.model_name.lower() != "disposal":
        loan_prep_kwargs["discipline_id"] = context.collection.discipline.id
    else:
        if "quantityresolved" in loan_prep_kwargs:
            del loan_prep_kwargs["quantityresolved"]

    lp = mapped["model"].objects.create(
        preparation=prep,
        **loan_prep_kwargs,
    )
    if prep_list is not None:
        prep_list.append(lp)

    return lp
