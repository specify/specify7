%#  -*- html -*-
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>

<body>
  <h3>Specify Test Servers</h3>
  <form method="post" action="set_dbs/">
    <table style="text-align: center; width: 100%">
      <tr><th>Server</th><th>Database</th></tr>
      %for server in servers:
      <tr>
        <td><a href="http://{{server + '.' + host}}/">{{server}}</a></td>
        <td>
          <select name="{{server}}">
            %if db_map.get(server, None) not in available_dbs:
            <option value="None" selected>None</option>
            %end
            %for choice in available_dbs:
            <option value="{{choice}}" {{'selected' if choice == db_map.get(server, None) else ''}}>{{choice}}</option>
            %end
          </select>
        </td>
      </tr>
      %end
    </table>
    <input type="submit" value="Set Databases">
  </form>
  <h3>Test Databases</h3>
  <dl>
    %for db in available_dbs:
    <dt>{{db}}</dt>
    <dd>
      <a href="/export/?dbname={{db}}">download</a>
      <a href="/drop/?dbname={{db}}">drop</a>
      <!-- <a href="/sync/?dbname={{db}}">sync</a> -->
    </dd>
    %end
    <dt>New</dt>
    <dd><a href="/upload/">upload</a></dd>
  </dl>
  <h3>Git Log</h3>
  <pre>
{{git_log}}
  </pre>
  <a href="https://github.com/specify/specifyweb/commits/master">(more)</a>
</body>
</html>
