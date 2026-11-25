from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ('stored_queries', '0001_query_organization'),
    ]

    operations = [
        migrations.AddField(
            model_name='queryfolder',
            name='sharing_group',
            field=models.CharField(blank=True, max_length=8, null=True),
        ),
        migrations.AddField(
            model_name='queryfoldermembership',
            name='sharing_folder',
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='shared_memberships', to='stored_queries.queryfolder',
            ),
        ),
    ]
