FROM ubuntu:18.04 AS common

LABEL maintainer="Specify Collections Consortium <github.com/specify>"

RUN apt-get update \
 && apt-get -y install --no-install-recommends \
        gettext \
        python3.8 \
        libldap-2.4-2 \
        libmariadbclient18 \
        rsync \
 && apt-get clean \
 && rm -rf /var/lib/apt/lists/*

RUN groupadd -g 999 specify \
 && useradd -r -u 999 -g specify specify

RUN mkdir -p /home/specify \
 && chown specify.specify /home/specify
RUN mkdir -p /opt/specify7 \
 && chown specify.specify /opt/specify7


#####################################################################


FROM node:20-alpine AS build-frontend

LABEL maintainer="Specify Collections Consortium <github.com/specify>"

USER node
WORKDIR /home/node

COPY --chown=node:node specifyweb/frontend/js_src/package*.json ./
RUN npm ci
RUN mkdir dist && chown node:node dist
COPY --chown=node:node specifyweb/frontend/js_src .
RUN npx webpack --mode production


#####################################################################

FROM common AS build-backend

RUN apt-get update \
 && apt-get -y install --no-install-recommends \
        build-essential \
        ca-certificates \
        curl \
        git \
        libsasl2-dev \
        libsasl2-modules \
        libldap2-dev \
        libssl-dev \
        libgmp-dev \
        libffi-dev \
        python3.8-venv \
        python3.8-distutils \
        python3.8-dev \
        libmariadbclient-dev \
 && apt-get clean \
 && rm -rf /var/lib/apt/lists/*

USER specify
COPY --chown=specify:specify requirements.txt /home/specify/

WORKDIR /opt/specify7
RUN python3.8 -m venv ve \
 && ve/bin/pip install --no-cache-dir --upgrade pip setuptools wheel \
 && ve/bin/pip install -v --no-cache-dir -r /home/specify/requirements.txt
RUN ve/bin/pip install --no-cache-dir gunicorn

COPY --from=build-frontend /home/node/dist specifyweb/frontend/static/js
COPY --chown=specify:specify specifyweb /opt/specify7/specifyweb
COPY --chown=specify:specify manage.py /opt/specify7/
COPY --chown=specify:specify docker-entrypoint.sh /opt/specify7/
COPY --chown=specify:specify Makefile /opt/specify7/
COPY --chown=specify:specify specifyweb.wsgi /opt/specify7/
COPY --chown=specify:specify config /opt/specify7/config

ARG BUILD_VERSION
ARG GIT_SHA
ENV BUILD_VERSION=$BUILD_VERSION
RUN make specifyweb/settings/build_version.py
RUN echo $BUILD_VERSION > specifyweb/frontend/static/build_version.txt
RUN echo $GIT_SHA > specifyweb/frontend/static/git_sha.txt
RUN date > specifyweb/frontend/static/build_date.txt

# The following is needed to run manage.py compilemessages:
# The secret key file needs to exist so it can be imported.
# The INSTALLED_APPS needs to be cleared out so Django doesn't
# try to import the Specify datamodel which isn't defined yet.
RUN echo "SECRET_KEY = 'bogus'" > specifyweb/settings/secret_key.py
RUN echo "INSTALLED_APPS = ['specifyweb.frontend']" >> specifyweb/settings/__init__.py
RUN (cd specifyweb && ../ve/bin/python ../manage.py compilemessages)

# Now put things back the way they were.
RUN rm specifyweb/settings/secret_key.py
COPY --chown=specify:specify specifyweb/settings/__init__.py /opt/specify7/specifyweb/settings/__init__.py

######################################################################

FROM common AS run-common

RUN apt-get update \
 && apt-get -y install --no-install-recommends \
        rsync \
 && apt-get clean \
 && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /volumes/static-files/depository \
 && chown -R specify.specify /volumes/static-files

USER specify
COPY --from=build-backend /opt/specify7 /opt/specify7

WORKDIR /opt/specify7
RUN cp -r specifyweb/settings .

RUN echo \
        "import os" \
        "\nDATABASE_NAME = os.environ['DATABASE_NAME']" \
        "\nDATABASE_HOST = os.environ['DATABASE_HOST']" \
        "\nDATABASE_PORT = os.environ.get('DATABASE_PORT', '')" \
        "\nMASTER_NAME = os.environ['MASTER_NAME']" \
        "\nMASTER_PASSWORD = os.environ['MASTER_PASSWORD']" \
        "\nDEPOSITORY_DIR = '/volumes/static-files/depository'" \
        "\nREPORT_RUNNER_HOST = os.getenv('REPORT_RUNNER_HOST', '')" \
        "\nREPORT_RUNNER_PORT = os.getenv('REPORT_RUNNER_PORT', '')" \
        "\nWEB_ATTACHMENT_URL = os.getenv('ASSET_SERVER_URL', None)" \
        "\nWEB_ATTACHMENT_KEY = os.getenv('ASSET_SERVER_KEY', None)" \
        "\nWEB_ATTACHMENT_COLLECTION = os.getenv('ASSET_SERVER_COLLECTION', None)" \
        "\nSEPARATE_WEB_ATTACHMENT_FOLDERS = os.getenv('SEPARATE_WEB_ATTACHMENT_FOLDERS', None)" \
        "\nCELERY_BROKER_URL = os.getenv('CELERY_BROKER_URL', None)" \
        "\nCELERY_RESULT_BACKEND = os.getenv('CELERY_RESULT_BACKEND', None)" \
        "\nCELERY_TASK_DEFAULT_QUEUE = os.getenv('CELERY_TASK_QUEUE', DATABASE_NAME)" \
        "\nANONYMOUS_USER = os.getenv('ANONYMOUS_USER', None)" \
        > settings/local_specify_settings.py

RUN echo "import os \nDEBUG = os.getenv('SP7_DEBUG', '').lower() == 'true'\n" \
        > settings/debug.py

RUN echo "import os \nSECRET_KEY = os.environ['SECRET_KEY']\n" \
        > settings/secret_key.py

ENV LC_ALL=C.UTF-8
ENV LANG=C.UTF-8
ENV DJANGO_SETTINGS_MODULE='settings'

ENTRYPOINT ["/opt/specify7/docker-entrypoint.sh"]

EXPOSE 8000


######################################################################

FROM run-common AS run-development

USER root

RUN apt-get update \
 && apt-get -y install --no-install-recommends \
        python3.8-distutils \
        ca-certificates \
        make

USER specify

COPY requirements-testing.txt /home/specify/

#RUN ve/bin/pip install --no-cache-dir -r /home/specify/requirements-testing.txt

COPY mypy.ini ./


######################################################################

FROM run-common AS run

RUN mv specifyweb.wsgi specifyweb_wsgi.py

CMD ["ve/bin/gunicorn", "-w", "3", "-b", "0.0.0.0:8000", "-t", "300", "specifyweb_wsgi"]


