import time
from collections import defaultdict
from contextlib import contextmanager

_metrics = {
    "route_count": defaultdict(int),
    "route_errors": defaultdict(int),
    "route_latency_ms_total": defaultdict(float),
    "llm_calls": 0,
    "llm_errors": 0,
    "llm_retries": 0,
}


def inc_route(path: str):
    _metrics["route_count"][path] += 1


def inc_route_error(path: str):
    _metrics["route_errors"][path] += 1


def add_route_latency(path: str, elapsed_ms: float):
    _metrics["route_latency_ms_total"][path] += elapsed_ms


def inc_llm_calls():
    _metrics["llm_calls"] += 1


def inc_llm_errors():
    _metrics["llm_errors"] += 1


def inc_llm_retries():
    _metrics["llm_retries"] += 1


def snapshot_metrics():
    avg_latency = {}
    for path, count in _metrics["route_count"].items():
        total = _metrics["route_latency_ms_total"].get(path, 0.0)
        avg_latency[path] = round(total / count, 2) if count else 0

    return {
        "route_count": dict(_metrics["route_count"]),
        "route_errors": dict(_metrics["route_errors"]),
        "route_avg_latency_ms": avg_latency,
        "llm_calls": _metrics["llm_calls"],
        "llm_errors": _metrics["llm_errors"],
        "llm_retries": _metrics["llm_retries"],
    }


@contextmanager
def route_timer(path: str):
    start = time.perf_counter()
    try:
        yield
    finally:
        elapsed = (time.perf_counter() - start) * 1000
        add_route_latency(path, elapsed)
