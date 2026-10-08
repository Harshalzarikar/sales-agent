"""Helpers for parsing /process Server-Sent Events in API tests."""
import json


def parse_sse_process_response(response) -> dict:
    """Extract the final result from a /process SSE (text/event-stream) response."""
    for line in response.text.split("\n"):
        if not line.startswith("data: "):
            continue
        payload = json.loads(line[6:].strip())
        if payload.get("type") == "complete":
            return payload["result"]
        if payload.get("type") == "error":
            raise AssertionError(payload.get("detail", "SSE error event"))
    raise AssertionError("No complete event in SSE response")


def mock_graph_astream(final_state: dict):
    """Async iterator matching main.graph.astream for tests."""

    async def _astream(*_args, **_kwargs):
        yield {"test": final_state}

    return _astream


def mock_graph_astream_error(exc: Exception):
    async def _astream(*_args, **_kwargs):
        raise exc
        yield  # pragma: no cover

    return _astream
