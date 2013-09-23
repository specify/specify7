<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>

<body>
  <h3>Dcop Database</h3>
  <form method="post" action=".">
    <p>
      Really drop database, {{db}}?
    </p>
    <input type="hidden" name="dbname" value="{{db}}" />
    <input type="submit" value="Yes" />
  </form>
</body>
</html>
