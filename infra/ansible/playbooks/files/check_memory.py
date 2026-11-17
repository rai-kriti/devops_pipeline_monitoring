#!/usr/bin/env python3
import argparse
import sys


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--warning", type=float, required=True)
    parser.add_argument("--critical", type=float, required=True)
    args = parser.parse_args()

    if not 0 <= args.warning < args.critical <= 100:
        print("MEMORY UNKNOWN - thresholds must satisfy 0 <= warning < critical <= 100")
        return 3

    try:
        memory = {}
        with open("/proc/meminfo", encoding="ascii") as meminfo:
            for line in meminfo:
                key, value = line.split(":", maxsplit=1)
                if key in {"MemTotal", "MemAvailable"}:
                    memory[key] = int(value.split()[0])
    except (OSError, ValueError, IndexError) as error:
        print(f"MEMORY UNKNOWN - cannot read /proc/meminfo: {error}")
        return 3

    total = memory.get("MemTotal", 0)
    available = memory.get("MemAvailable", -1)
    if total <= 0 or available < 0:
        print("MEMORY UNKNOWN - MemTotal or MemAvailable is unavailable")
        return 3

    used_percent = max(0.0, min(100.0, 100.0 * (total - available) / total))
    message = (
        f"MEMORY used {used_percent:.1f}% "
        f"(warning at {args.warning:.1f}%, critical at {args.critical:.1f}%)"
    )
    performance = (
        f"memory_used={used_percent:.1f}%;{args.warning:.1f};"
        f"{args.critical:.1f};0;100"
    )

    if used_percent >= args.critical:
        print(f"MEMORY CRITICAL - {message} | {performance}")
        return 2
    if used_percent >= args.warning:
        print(f"MEMORY WARNING - {message} | {performance}")
        return 1

    print(f"MEMORY OK - {message} | {performance}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
