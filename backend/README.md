# CivicLens Backend

Refer to the master consolidated platform documentation: [TECHNICAL_DOCUMENTATION.md](../TECHNICAL_DOCUMENTATION.md)

## Local setup

Dependencies live in `pyproject.toml` and `uv.lock`, managed with uv.

```
uv sync                            # creates .venv with runtime and dev deps
uv run pytest
uv run python -m app.audit.report  # Follow the Rupee audit summary
```
