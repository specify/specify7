from specifyweb.context.app_resource import get_usertype
from specifyweb.specify.models import Spappresource, Spappresourcedir
from specifyweb.specify.views import openapi
from specifyweb.context.resources import Resource, Resources
from specifyweb.context.user_resources import get_resources_endpoint_schema, get_resource_endpoint_schema

collection_resources = openapi(schema=get_resources_endpoint_schema(
    description_get="Returns list of public app resources in the logged in collection.",
    description_create="Creates appresource in the logged in collection.",
    description_created="The collection resource was created.",
))(Resources.as_view(_spappresourcedirfilter= lambda request: {
                'ispersonal': False,
                'specifyuser__isnull': True,
                'usertype__isnull': True,
}, _spappresourcefilter= lambda request: {
                'spappresourcedir__ispersonal':False,
                'spappresourcedir__specifyuser__isnull': True,
                'spappresourcedir__usertype__isnull': True,
}, _spappresourcefilterpost=lambda request: {
    'specifyuser': request.specify_user
},_spappresourcedircreate=lambda request:{
    'ispersonal': False
}))


collection_resource = openapi(schema=get_resource_endpoint_schema(
    description_get="The public app resource of the given id in the logged in collection",
    description_update="Updates the appresource with the given id in the logged in collection"
))(Resource.as_view(_spappresourcefilter= lambda request: {
            'spappresourcedir__ispersonal': False,
}))




