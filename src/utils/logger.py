import logging
import sys
import io


def get_logger(name: str) -> logging.Logger:
    """
    Returns a named logger configured with the application log level.
    Logs to stdout only — no duplicate handlers if called multiple times.
    Uses UTF-8 encoding so emoji characters don't crash on Windows terminals.
    """
    logger = logging.getLogger(name)
    if not logger.handlers:
        # Lazily import settings to avoid circular imports during startup
        try:
            from src.config import settings
            level = getattr(logging, settings.log_level.upper(), logging.INFO)
        except Exception:
            level = logging.INFO

        logger.setLevel(level)

        # Wrap stdout in UTF-8 to handle emoji on Windows (cp1252 terminals)
        utf8_stdout = io.TextIOWrapper(
            sys.stdout.buffer, encoding="utf-8", errors="replace", line_buffering=True
        ) if hasattr(sys.stdout, "buffer") else sys.stdout

        handler = logging.StreamHandler(utf8_stdout)
        formatter = logging.Formatter(
            "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        logger.propagate = False  # Prevent double-logging under uvicorn

    return logger
