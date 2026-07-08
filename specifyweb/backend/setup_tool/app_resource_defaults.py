import logging
from typing import Optional, Iterable

from django.db.models import Subquery, F, Exists, OuterRef

from specifyweb.specify.models import (
    Discipline,
    Spappresource,
    Spappresourcedata,
    Spappresourcedir,
    Specifyuser,
)
from specifyweb.specify.migration_utils.utils import batch_query

logger = logging.getLogger(__name__)

DEFAULT_REMOTE_PREFS = b'''ui.formatting.scrdateformat=yyyy-MM-dd
auditing.do_audits=true
auditing.audit_field_updates=true
'''

def create_app_resource_defaults() -> None:
    """Adds initial app resource files to the database."""
    # create_global_prefs() # Replacing globabl prefs with remote to avoid user confusion
    create_remote_prefs()

def create_global_prefs(user: Optional[Specifyuser] = None) -> None:
    """Create a blank Global Prefs file."""
    directory, _ = Spappresourcedir.objects.get_or_create(
        usertype='Global Prefs',
        defaults={
            'ispersonal': False
        }
    )

    # This function is intended to be used during setup, so there should be one user.
    # DBs created in Specify 6 set specifyuser to NULL for global prefs.
    admin_user = user or Specifyuser.objects.first()

    resource = Spappresource.objects.create(
        spappresourcedir=directory,
        specifyuser=admin_user,
        level=0,
        name='preferences'
    )

    Spappresourcedata.objects.create(
        spappresource=resource,
        data=b''
    )

def create_remote_prefs(user: Optional[Specifyuser] = None) -> None:
    """Create a default Remote Preferences file."""
    directory, _ = Spappresourcedir.objects.get_or_create(
        usertype='Prefs',
        defaults={
            'ispersonal': False
        }
    )

    # This function is intended to be used during setup, so there should be one user.
    # DBs created in Specify 6 set specifyuser to NULL for remote prefs.
    admin_user = user or Specifyuser.objects.first()

    resource = Spappresource.objects.create(
        spappresourcedir=directory,
        specifyuser=admin_user,
        level=0,
        name='preferences'
    )

    Spappresourcedata.objects.create(
        spappresource=resource,
        data=DEFAULT_REMOTE_PREFS
    )

def ensure_discipline_resource_dir(discipline: Discipline) -> Spappresourcedir:
    """
    Ensure a discipline-level app resource directory exists
    """
    existing_dir, _, _ = _ensure_discipline_resource_dir(discipline)
    return existing_dir

def _ensure_discipline_resource_dir(
    discipline: Discipline,
) -> tuple[Spappresourcedir, bool, bool]:
    """
    Ensure a discipline-level app resource directory exists.

    Returns a tuple of (directory, created, updated).
    """
    existing_dir = (
        Spappresourcedir.objects.filter(
            discipline=discipline,
            collection__isnull=True,
            usertype__isnull=True,
            ispersonal=False
        )
        .first()
    )

    if existing_dir is None:
        return (
            Spappresourcedir.objects.create(
            discipline=discipline,
            # This is intentional and not a typo.
            # DisciplineType is actually the Discipline Name for
            # SpAppResourceDir records...
            # This is another weird behavior from Specify 6 :/
            # See #7984
            disciplinetype=discipline.name,
            ispersonal=False,
            ),
            True,
            False,
        )

    was_updated = False
    if existing_dir.disciplinetype != discipline.name:
        existing_dir.disciplinetype = discipline.name
        existing_dir.save(update_fields=['disciplinetype'])
        was_updated = True

    return existing_dir, False, was_updated


def _update_discipline_dirs_to_correct_type():
    discipline_name_query = Discipline.objects.filter(
        pk=OuterRef("discipline_id")
    ).values("name")[:1]

    return Spappresourcedir.objects.filter(
        collection__isnull=True,
        usertype__isnull=True,
        ispersonal=False,
        discipline__isnull=False
    ).exclude(
        disciplinetype=Subquery(discipline_name_query)
    ).update(
        disciplinetype=Subquery(discipline_name_query)
    )

def _create_missing_discipline_dirs():
    created = 0
    disciplines_missing_resourcedirs = Discipline.objects.filter(
        ~Exists(
            Spappresourcedir.objects.filter(
                collection__isnull=True,
                usertype__isnull=True,
                ispersonal=False,
                discipline_id=OuterRef("pk")
            )
        )
    ).values_list("pk", "name")

    # will be tuple[tuple[int, str]...]
    for aggregated_disciplines in batch_query(disciplines_missing_resourcedirs):
        created_rows = Spappresourcedir.objects.bulk_create(
            [
                Spappresourcedir(
                    discipline_id=discipline_id,
                    # This is intentional and not a typo.
                    # DisciplineType is actually the Discipline Name for
                    # SpAppResourceDir records...
                    # This is another weird behavior from Specify 6 :/
                    # See #7984
                    disciplinetype=discipline_name,
                    ispersonal=False,
                    usertype=None,
                    collection=None
                )
                for (discipline_id, discipline_name) in aggregated_disciplines
            ]
        )
        created += len(created_rows)
    return created

def ensure_all_discipline_resource_dirs() -> dict[str, int]:
    """
    Ensure every discipline has a discipline-scoped app resource directory.

    Returns summary counts for auditability.
    This is somewhat optimized for an arbitary amount of disciplines
    """
    updated = _update_discipline_dirs_to_correct_type()
    created = _create_missing_discipline_dirs()

    return {
        'created': created,
        'updated': updated,
    }
