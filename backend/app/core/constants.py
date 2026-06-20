"""Domain constants (tunable knobs for recommendation + expiry logic)."""

from __future__ import annotations

# Items expiring within this many days are "urgent" (PLAN §6-3).
URGENCY_WINDOW_DAYS = 3

# When a receipt/LLM gives no expiry and the ingredient has no default shelf
# life, assume this many days.
FALLBACK_SHELF_LIFE_DAYS = 7

# Recommendation scoring weights (PLAN §6-3).
W_URGENT_BONUS = 0.6  # reward recipes that use soon-expiring ingredients
W_MISSING_PENALTY = 0.1  # penalize each missing essential ingredient

# Default number of recommendations to surface.
DEFAULT_TOP_K = 6

# Report period default.
REPORT_PERIOD_DAYS = 7

# "Still have it?" confirmation: extend expiry by this many days on "있어요".
CONFIRM_EXTEND_DAYS = 2
