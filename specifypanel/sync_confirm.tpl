<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>

<body>
  <h3>Sync Database</h3>
  <form method="post" action=".">
    <p>
      Sync database, {{repr(db)}}?
    </p>
    <input type="hidden" name="dbname" value="{{db}}" />
    <input type="submit" value="Yes" />
  </form>
</body>
</html>
