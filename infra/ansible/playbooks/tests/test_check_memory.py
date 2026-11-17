import importlib.util
import io
import sys
import unittest
from pathlib import Path
from unittest.mock import mock_open, patch


PLUGIN_PATH = Path(__file__).parents[1] / "files" / "check_memory.py"
SPEC = importlib.util.spec_from_file_location("check_memory", PLUGIN_PATH)
check_memory = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(check_memory)


class CheckMemoryTests(unittest.TestCase):
    def run_plugin(self, available_kib, warning="80", critical="90"):
        meminfo = f"MemTotal: 1000 kB\nMemAvailable: {available_kib} kB\n"
        output = io.StringIO()
        with (
            patch("builtins.open", mock_open(read_data=meminfo)),
            patch.object(sys, "argv", ["check_memory.py", "--warning", warning, "--critical", critical]),
            patch("sys.stdout", output),
        ):
            status = check_memory.main()
        return status, output.getvalue()

    def test_reports_ok_below_warning_threshold(self):
        status, output = self.run_plugin(available_kib=250)
        self.assertEqual(status, 0)
        self.assertIn("MEMORY OK", output)

    def test_reports_warning_at_warning_threshold(self):
        status, output = self.run_plugin(available_kib=200)
        self.assertEqual(status, 1)
        self.assertIn("MEMORY WARNING", output)

    def test_reports_critical_at_critical_threshold(self):
        status, output = self.run_plugin(available_kib=100)
        self.assertEqual(status, 2)
        self.assertIn("MEMORY CRITICAL", output)

    def test_rejects_invalid_thresholds(self):
        status, output = self.run_plugin(available_kib=500, warning="90", critical="80")
        self.assertEqual(status, 3)
        self.assertIn("MEMORY UNKNOWN", output)


if __name__ == "__main__":
    unittest.main()
