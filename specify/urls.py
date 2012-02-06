from django.conf.urls.defaults import patterns, include, url
from tastypie.api import Api
from tastypie.resources import ModelDeclarativeMetaclass
from specify.api import resources

api = Api(api_name='specify')

for r in resources: api.register(r())

urlpatterns = patterns('',
                       (r'^api/', include(api.urls)),
)

