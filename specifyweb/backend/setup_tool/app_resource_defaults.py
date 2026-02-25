from typing import Optional

from specifyweb.specify.models import (
    Discipline,
    Spappresource,
    Spappresourcedata,
    Spappresourcedir,
    Specifyuser,
)
import logging
logger = logging.getLogger(__name__)

def create_app_resource_defaults() -> None:
    """Adds initial app resource files to the database. Only Global Preferences need to be created."""
    create_global_prefs()

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


def ensure_discipline_resource_dir(discipline: Discipline) -> Spappresourcedir:
    """
    Ensure a discipline-level app resource directory exists
    """
    existing_dir = (
        Spappresourcedir.objects.filter(
            discipline=discipline,
            collection__isnull=True,
            specifyuser__isnull=True,
            usertype__isnull=True,
            ispersonal=False
        )
        .first()
    )

    if existing_dir is None:
        return Spappresourcedir.objects.create(
            discipline=discipline,
            disciplinetype=discipline.type,
            ispersonal=False,
        )

    if existing_dir.disciplinetype != discipline.type:
        existing_dir.disciplinetype = discipline.type
        existing_dir.save(update_fields=['disciplinetype'])

    return existing_dir
