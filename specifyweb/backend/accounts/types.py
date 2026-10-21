from typing_extensions import TypedDict
from typing import Union, cast

class ProviderInfo(TypedDict):
    "Elements of settings.OAUTH_LOGIN_PROVIDERS should have this type."
    title: str # The name of the provider for UI purposes.
    client_id: str
    client_secret: str
    scope: str
    # config can be either the OpenId discovery endpoint or
    # a dictionary of auth and token endpoints.
    config: Union[str, "ProviderConf"]

class ProviderConf(TypedDict):
    """OpenId provider endpoints provided by the settings or by
    the provider's discovery document."""
    authorization_endpoint: str
    token_endpoint: str

class OAuthLogin(TypedDict):
    "Data carried through a session variable during oauth login."
    state: str
    provider: str
    provider_conf: ProviderConf

class ExternalUser(TypedDict):
    """Information passed through a session variable to associate the
    user's external id to a specifyuser record."""
    provider: str
    provider_title: str # For UI purposes.
    id: str # The user's id in the provider's system.
    name: str # The user's name for UI purposes.
    idtoken: dict # The JWT from the provider.

class InviteToken(TypedDict):
    """Embedded in an invite token."""
    userid: int  # The Specify user id
    username: str
    sequence: int | None # To prevent reuse of token.
    expires: int # A time.time() value after which the token is expired.

