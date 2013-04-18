from django.conf.urls import patterns
from django.views.generic import TemplateView
from django.contrib.auth.decorators import login_required
from django.conf import settings

class View(TemplateView):
    def get_context_data(self, **kwargs):
        context = super(View, self).get_context_data(**kwargs)
        context['revision'] = settings.REVISION
        return context

# just send the form.html webapp container for _all_ URLs.
# the webapp (in specifyapp.js) will interpret them
urlpatterns = patterns(
    '',
    (r'', login_required(View.as_view(template_name="specify.html"))),
)
