import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


SCRIPT = Path(__file__).resolve().parents[1] / "po_charset.py"
HEADER = 'msgid ""\nmsgstr ""\n"Content-Type: text/plain\\n"'


class POCharsetTests(unittest.TestCase):
    def run_tool(self, directory: Path, *args: str) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            [sys.executable, str(SCRIPT), str(directory), *args],
            capture_output=True,
            text=True,
            check=False,
        )

    def test_repairs_missing_charset(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            path = Path(temp) / "test.po"
            path.write_text(HEADER + "\n\nmsgid \"hello\"\nmsgstr \"hola\"\n")

            result = self.run_tool(Path(temp))

            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertIn("Content-Type: text/plain; charset=UTF-8\\n", path.read_text())

    def test_leaves_utf8_header_unchanged(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            path = Path(temp) / "test.po"
            original = HEADER.replace("text/plain", "text/plain; charset=UTF-8")
            path.write_text(original)

            result = self.run_tool(Path(temp))

            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertEqual(path.read_text(), original)

    def test_header_only_utf8_catalog_passes_check(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            path = Path(temp) / "header-only.po"
            path.write_text(HEADER.replace("text/plain", "text/plain; charset=UTF-8"))

            result = self.run_tool(Path(temp), "--check")

            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertEqual(path.read_text(), HEADER.replace("text/plain", "text/plain; charset=UTF-8"))

    def test_header_only_catalog_can_be_repaired(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            path = Path(temp) / "header-only.po"
            path.write_text(HEADER)

            result = self.run_tool(Path(temp))

            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertIn("charset=UTF-8", path.read_text())

    def test_check_reports_missing_charset_without_modifying_file(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            path = Path(temp) / "test.po"
            path.write_text(HEADER)

            result = self.run_tool(Path(temp), "--check")

            self.assertNotEqual(result.returncode, 0)
            self.assertIn("missing a UTF-8 charset", result.stdout)
            self.assertEqual(path.read_text(), HEADER)

    def test_rejects_missing_or_invalid_content_type(self) -> None:
        for content in ('msgid ""\nmsgstr ""\n', HEADER.replace("text/plain", "text/html")):
            with self.subTest(content=content), tempfile.TemporaryDirectory() as temp:
                (Path(temp) / "test.po").write_text(content)

                result = self.run_tool(Path(temp))

                self.assertNotEqual(result.returncode, 0)
                self.assertIn("valid Content-Type header", result.stderr)

    def test_empty_directory_returns_nonzero(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            result = self.run_tool(Path(temp), "--check")

            self.assertNotEqual(result.returncode, 0)
            self.assertIn("No PO files found", result.stderr)


if __name__ == "__main__":
    unittest.main()
