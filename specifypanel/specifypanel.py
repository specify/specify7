import errno, re, tempfile, json
from os import environ, path
from subprocess import Popen, PIPE, call, check_call, check_output
from bottle import route, template, request, response, abort, static_file, redirect

CHUNK_SIZE = 2**16

SPECIFYWEB_DIR = path.abspath(path.join(path.dirname(__file__), '..'))
DB_MAP_FILE = path.join(SPECIFYWEB_DIR, 'db_map.json')
REPORT_CONF_FILE = path.join(path.expanduser("~"), '.specify-report.properties')
APACHE_CONF_FILE = path.join(SPECIFYWEB_DIR, 'specifypanel_apache.conf')
VIRTHOST_WSGI = path.join(SPECIFYWEB_DIR, 'specifyweb_vh.wsgi')
PANEL_WSGI = path.join(SPECIFYWEB_DIR, 'specifypanel.wsgi')
MANAGE_PY = path.join(SPECIFYWEB_DIR, 'specifyweb', "manage.py")

MYSQL_USER = "-uMasterUser"
MYSQL_PASS = "-pMasterPassword"

with open(APACHE_CONF_FILE) as f:
    conf = f.read()
    SERVERS = re.findall(r'Use +SpecifyVH +(.*)$', conf, re.MULTILINE)

@route('/')
def main():
    try:
        with open(DB_MAP_FILE) as f:
            db_map = json.load(f)
    except IOError as e:
        if e.errno == errno.ENOENT:
            db_map = {}
        else:
            raise

    git_log = check_output(["/usr/bin/git",
                            "--work-tree=" + SPECIFYWEB_DIR,
                            "--git-dir=" + path.join(SPECIFYWEB_DIR, '.git'),
                            "log", "-n", "10"])


    show_databases = check_output(["/usr/bin/mysql", MYSQL_USER, MYSQL_PASS, "-e", "show databases"])
    available_dbs = set(show_databases.split('\n')[1:]) - {'', 'information_schema', 'performance_schema', 'mysql'}
    return template('main.tpl',
                    servers=SERVERS,
                    db_map=db_map,
                    available_dbs=available_dbs,
                    git_log=git_log,
                    host=request.get_header('Host'))

@route('/set_dbs/', method='POST')
def set_dbs():
    db_map = {server: db
              for server in SERVERS
              for db in [ request.forms[server] ]
              if db != 'None'}
    with open(DB_MAP_FILE, 'w') as f:
        json.dump(db_map, f)

    check_call(['/usr/bin/touch', VIRTHOST_WSGI])

    with open(REPORT_CONF_FILE) as f:
        report_conf_file = f.read()

    dbname = db_map.get(SERVERS[0], None)
    if dbname is not None:
        with open(REPORT_CONF_FILE, 'w') as f:
            report_conf_file = re.sub(r'^dbname=.*$', 'dbname=' + dbname, report_conf_file, flags=re.M)
            f.write(report_conf_file)
        check_call(['sudo', 'restart', 'specify-report-service'])
    redirect('/')

@route('/upload/')
def upload_form():
    return template('upload_db.html')

@route('/upload/', method='POST')
def upload_db():
    db_name = request.forms['dbname']
    upload_file = request.files['file'].file

    response.set_header('Content-Type', 'text/plain')

    yield "dropping db.\n"
    call(["/usr/bin/mysqladmin", "-f", MYSQL_USER, MYSQL_PASS, "drop", db_name])
    yield "creating db.\n"
    check_call(["/usr/bin/mysqladmin", MYSQL_USER, MYSQL_PASS, "create", db_name])
    yield "loading db.\n"
    mysql = Popen(["/usr/bin/mysql", MYSQL_USER, MYSQL_PASS, db_name], stdin=PIPE)

    loaded = 0
    for chunk in iter(lambda: upload_file.read(CHUNK_SIZE), ""):
        loaded += len(chunk)
        mysql.stdin.write(chunk)
        yield "loaded: %d\n" % loaded
    mysql.stdin.close()
    mysql.wait()

    # yield "syncing db.\n"
    # do_sync(db_name)
    yield "done.\n"

def do_sync(db_name):
    env = environ.copy()
    env['SPECIFY_DATABASE_NAME'] = db_name
    check_call(["/usr/bin/python", MANAGE_PY, "syncdb"], env=env)

@route('/sync/')
def sync_confirm():
    db_name = request.query['dbname']
    return template('sync_confirm.tpl', db=db_name)

@route('/sync/', method='POST')
def sync():
    db_name = request.forms['dbname']
    do_sync(db_name)
    redirect('/')

@route('/export/')
def export():
    db_name = request.query['dbname']
    mysqldump = Popen(["/usr/bin/mysqldump", MYSQL_USER, MYSQL_PASS, db_name], stdout=PIPE)

    response.set_header('Content-Type', 'text/plain')
    response.set_header('Content-Disposition', 'attachment; filename=%s.sql' % db_name)

    def result():
        for chunk in iter(lambda: mysqldump.stdout.read(CHUNK_SIZE), ""):
            yield chunk
        mysqldump.wait()

    return result()

@route('/drop/')
def drop_form():
    db_name = request.query['dbname']
    return template('drop.tpl', db=db_name)

@route('/drop/', method='POST')
def drop():
    db_name = request.forms['dbname']
    call(["/usr/bin/mysqladmin", "-f", MYSQL_USER, MYSQL_PASS, "drop", db_name])
    redirect('/')

@route('/github_hook/', method='POST')
def github_hook():
    check_call(["/usr/bin/git",
                "--work-tree=" + SPECIFYWEB_DIR,
                "--git-dir=" + path.join(SPECIFYWEB_DIR, '.git'),
                "pull"])
    check_call(['/usr/bin/make', '-C', path.join(SPECIFYWEB_DIR, 'specifyweb')])
    check_call(['/usr/bin/touch', VIRTHOST_WSGI])
    check_call(['/usr/bin/touch', PANEL_WSGI])


if __name__ == '__main__':
    from bottle import run, debug
    debug(True)
    run(host='0.0.0.0', port='8080', reloader=True)
