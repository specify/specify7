from django.utils.encoding import force_str

from specifyweb.specify.models import Spappresourcedata


def get_remote_prefs() -> str:
    res = Spappresourcedata.objects.filter(
        spappresource__name='preferences',
        spappresource__spappresourcedir__usertype='Prefs')

    # Spappresource.data is stored in a blob field even though we treat
    # it as a TextField. Starting in django 2.2 it doesn't automatically
    # get decoded from bytes to str.
    return '\n'.join(force_str(r.data) for r in res)

def get_global_prefs() -> str:
    res = Spappresourcedata.objects.filter(
        spappresource__name='preferences',
        spappresource__spappresourcedir__usertype='Global Prefs')
    return '\n'.join(force_str(r.data) for r in res)
