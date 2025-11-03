from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('specify', '0040_components'),
    ]

    operations = [
        migrations.CreateModel(
            name='LoginNotice',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('content', models.TextField(blank=True, default='')),
                ('is_enabled', models.BooleanField(default=False)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'db_table': 'login_notice',
            },
        ),
    ]
