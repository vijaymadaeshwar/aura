"""
AURA - Logging & Audit Trail Utility
Provides formatted console logging and an in-memory circular buffer for live log observation.
"""

import logging
import datetime
from collections import deque
from typing import List, Dict

# In-memory circular buffer of recent logs (latest 100 entries)
RECENT_LOGS: deque = deque(maxlen=100)

# Configure base logger
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [%(name)s] %(message)s",
    datefmt="%H:%M:%S"
)

logger = logging.getLogger("AURA")


def log_event(level: str, source: str, message: str) -> Dict[str, str]:
    """Log an event to console and store in memory buffer for frontend telemetry."""
    timestamp = datetime.datetime.now().strftime("%H:%M:%S")
    entry = {
        "timestamp": timestamp,
        "level": level.upper(),
        "source": source,
        "message": message
    }
    RECENT_LOGS.append(entry)

    if level.upper() == "ERROR":
        logger.error(f"[{source}] {message}")
    elif level.upper() == "WARNING":
        logger.warning(f"[{source}] {message}")
    else:
        logger.info(f"[{source}] {message}")

    return entry


def get_recent_logs(limit: int = 50) -> List[Dict[str, str]]:
    """Retrieve recent log entries."""
    logs = list(RECENT_LOGS)
    return logs[-limit:]
