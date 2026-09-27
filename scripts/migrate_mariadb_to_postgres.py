"""Bulk-copy MariaDB data into an already-migrated PostgreSQL schema."""

import csv
import io
import os
from contextlib import closing

import MySQLdb
import psycopg
from psycopg import sql


SOURCE_HOST = os.environ.get("SOURCE_HOST", "mariadb")
SOURCE_PORT = int(os.environ.get("SOURCE_PORT", "3306"))
DATABASE_NAME = os.environ["DATABASE_NAME"]
DATABASE_USER = os.environ["MASTER_NAME"]
DATABASE_PASSWORD = os.environ["MASTER_PASSWORD"]
TARGET_HOST = os.environ.get("TARGET_HOST", "postgres")
TARGET_PORT = int(os.environ.get("TARGET_PORT", "5432"))
FRAMEWORK_TABLES = {"django_migrations", "django_content_type", "auth_permission"}


def normalize_value(value, data_type):
    if value is None:
        return r"\N"
    if data_type == "boolean":
        if isinstance(value, bytes):
            return "true" if value != b"\x00" else "false"
        return "true" if value else "false"
    if data_type == "bytea":
        if isinstance(value, memoryview):
            value = value.tobytes()
        if isinstance(value, bytes):
            return "\\x" + value.hex()
    if isinstance(value, bytes):
        return value.decode("utf-8", errors="replace")
    return str(value)


def main():
    source = MySQLdb.connect(
        host=SOURCE_HOST,
        port=SOURCE_PORT,
        user=DATABASE_USER,
        passwd=DATABASE_PASSWORD,
        db=DATABASE_NAME,
        charset="utf8mb4",
        use_unicode=True,
    )
    target = psycopg.connect(
        host=TARGET_HOST,
        port=TARGET_PORT,
        user=DATABASE_USER,
        password=DATABASE_PASSWORD,
        dbname=DATABASE_NAME,
    )
    target.autocommit = False

    with closing(source), closing(target), source.cursor() as source_cursor:
        source_cursor.execute("SHOW TABLES")
        source_tables = {row[0].lower(): row[0] for row in source_cursor.fetchall()}

        with target.cursor() as target_cursor:
            target_cursor.execute(
                """
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
                ORDER BY table_name
                """
            )
            target_tables = [row[0] for row in target_cursor.fetchall()]
            target_cursor.execute(
                """
                SELECT table_name, column_name, data_type
                FROM information_schema.columns
                WHERE table_schema = 'public'
                """
            )
            target_columns = {}
            for table_name, column_name, data_type in target_cursor.fetchall():
                target_columns.setdefault(table_name, {})[column_name.lower()] = (
                    column_name,
                    data_type,
                )

            target_cursor.execute("SET session_replication_role = replica")

            for target_table in target_tables:
                if target_table in FRAMEWORK_TABLES:
                    continue
                source_table = source_tables.get(target_table.lower())
                if source_table is None:
                    continue

                source_cursor.execute(f"SHOW COLUMNS FROM `{source_table}`")
                source_column_names = [row[0] for row in source_cursor.fetchall()]
                columns = target_columns[target_table]
                column_pairs = [
                    (name, columns[name.lower()][0], columns[name.lower()][1])
                    for name in source_column_names
                    if name.lower() in columns
                ]
                if not column_pairs:
                    continue

                source_cursor.execute(
                    "SELECT "
                    + ", ".join(f"`{name}`" for name in source_column_names)
                    + f" FROM `{source_table}`"
                )
                source_indexes = [source_column_names.index(pair[0]) for pair in column_pairs]
                target_names = [pair[1] for pair in column_pairs]
                target_types = [pair[2] for pair in column_pairs]
                copy_statement = sql.SQL(
                    "COPY {} ({}) FROM STDIN WITH (FORMAT csv, NULL '\\N')"
                ).format(
                    sql.Identifier(target_table),
                    sql.SQL(", ").join(sql.Identifier(name) for name in target_names),
                )

                rows = 0
                with target_cursor.copy(copy_statement) as copy:
                    while True:
                        batch = source_cursor.fetchmany(2000)
                        if not batch:
                            break
                        output = io.StringIO()
                        writer = csv.writer(output, lineterminator="\n")
                        for row in batch:
                            writer.writerow(
                                normalize_value(row[index], data_type)
                                for index, data_type in zip(source_indexes, target_types)
                            )
                        copy.write(output.getvalue())
                        rows += len(batch)
                target.commit()
                print(f"{target_table}: {rows}", flush=True)


if __name__ == "__main__":
    main()
