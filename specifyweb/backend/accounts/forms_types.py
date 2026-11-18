
from django import forms

class CollectionChoiceField(forms.ChoiceField):
    widget = forms.RadioSelect
    def label_from_instance(self, obj):
        return obj.collectionname
