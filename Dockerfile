
FROM ubuntu:18.04 AS common

LABEL maintainer="Specify Collections Consortium <github.com/specify>"

RUN apt-get update && apt-get -y install --no-install-recommends \
        python3.6 \
        libldap-2.4-2 \
        libmariadbclient18 \
        && apt-get clean && rm -rf /var/lib/apt/lists/*

RUN groupadd -g 999 specify && \
        useradd -r -u 999 -g specify specify

RUN mkdir -p /home/specify && chown specify.specify /home/specify
RUN mkdir -p /opt/specify7 && chown specify.specify /opt/specify7


#####################################################################

FROM common AS build-common

RUN apt-get update && apt-get -y install --no-install-recommends \
        build-essential \
        ca-certificates \
        curl \
        git

#####################################################################

FROM build-common AS build-frontend

RUN curl -sL https://deb.nodesource.com/setup_10.x | bash

RUN apt-get update && apt-get -y install --no-install-recommends nodejs

USER specify

COPY --chown=specify:specify specifyweb/frontend /home/specify/frontend
WORKDIR /home/specify/frontend/js_src

RUN make


#####################################################################

FROM build-common AS build-backend

RUN apt-get -y install --no-install-recommends \
        libldap2-dev \
        libmariadbclient-dev \
        libsasl2-dev \
        python3-venv \
        python3.6-dev

USER specify
COPY --chown=specify:specify requirements.txt /home/specify/

WORKDIR /opt/specify7
RUN python3.6 -m venv ve && ve/bin/pip install --no-cache-dir -r /home/specify/requirements.txt
RUN ve/bin/pip install --no-cache-dir gunicorn redis

COPY --chown=specify:specify . /opt/specify7
COPY --from=build-frontend /home/specify/frontend/static/js specifyweb/frontend/static/js


ARG BUILD_VERSION
ARG GIT_SHA
ENV BUILD_VERSION=$BUILD_VERSION
RUN make specifyweb/settings/build_version.py
RUN echo $BUILD_VERSION > specifyweb/frontend/static/build_version.txt
RUN echo $GIT_SHA > specifyweb/frontend/static/git_sha.txt
RUN date > specifyweb/frontend/static/build_date.txt


######################################################################

FROM common AS run

RUN apt-get update && apt-get -y install --no-install-recommends \
        rsync \
        && apt-get clean && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /volumes/static-files/depository && chown -R specify.specify /volumes/static-files

USER specify
COPY --from=build-backend /opt/specify7 /opt/specify7

WORKDIR /home/specify
RUN mkdir wb_upload_logs

WORKDIR /opt/specify7/specifyweb/settings

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
        "\nCELERY_BROKER_URL = os.getenv('CELERY_BROKER_URL', None)" \
        "\nCELERY_RESULT_BACKEND = os.getenv('CELERY_RESULT_BACKEND', None)" \
        "\nCELERY_TASK_DEFAULT_QUEUE = os.getenv('CELERY_TASK_QUEUE', DATABASE_NAME)" \
        > local_specify_settings.py

RUN echo "import os \nDEBUG = os.getenv('SP7_DEBUG', '').lower() == 'true'\n" \
        > debug.py

RUN echo "import os \nSECRET_KEY = os.environ['SECRET_KEY']\n" \
        > secret_key.py

WORKDIR /opt/specify7

ENTRYPOINT ["/opt/specify7/docker-entrypoint.sh"]

EXPOSE 8000
RUN mv specifyweb.wsgi specifyweb_wsgi.py
CMD ["ve/bin/gunicorn", "-w", "3", "-b", "0.0.0.0:8000", "specifyweb_wsgi"]
