
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

FROM common AS build

RUN apt-get update && apt-get -y install --no-install-recommends \
        nodejs \
        npm \
        python3-venv

RUN apt-get update && apt-get -y install --no-install-recommends \
        libmariadbclient-dev \
	build-essential \
	python3.6-dev \
        libldap2-dev \
        libsasl2-dev

RUN apt-get update && apt-get -y install --no-install-recommends \
    git \
    curl \
    unzip

USER specify

COPY --chown=specify:specify . /opt/specify7
WORKDIR /opt/specify7

RUN python3.6 -m venv ve && ve/bin/pip install --no-cache-dir -r requirements.txt

RUN make specifyweb/settings/build_version.py specifyweb/settings/secret_key.py frontend

RUN rm -rf specifyweb/frontend/js_src/bower_components specifyweb/frontend/js_src/node_modules


######################################################################

FROM common AS run

RUN apt-get update && apt-get -y install --no-install-recommends \
	apache2 \
        openjdk-11-jre-headless \
        libapache2-mod-wsgi-py3 \
        && apt-get clean && rm -rf /var/lib/apt/lists/*

COPY --from=build /opt/specify7 /opt/specify7

RUN rm /etc/apache2/sites-enabled/*
RUN ln -s /opt/specify7/specifyweb_apache.conf /etc/apache2/sites-enabled/

RUN mkdir -p /home/specify/wb_upload_logs /home/specify/specify_depository

RUN ln -sf /dev/stderr /var/log/apache2/error.log && ln -sf /dev/stdout /var/log/apache2/access.log

EXPOSE 80
CMD apachectl -D FOREGROUND
