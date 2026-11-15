"""Read-only hosting wrapper. The local app.main entry point is unchanged."""
import os
from starlette.responses import JSONResponse
from .main import create_app


def create_public_app():
    if os.environ.get("CYTOZOE_PUBLIC_READ_ONLY") != "1":
        raise RuntimeError("Public deployment requires CYTOZOE_PUBLIC_READ_ONLY=1")
    app = create_app()

    @app.middleware("http")
    async def public_read_only(request, call_next):
        # Verified explanations are stateless reads expressed as POST. All other writes fail closed.
        if request.method not in {"GET", "HEAD", "OPTIONS"} and not (
            request.method == "POST" and request.url.path == "/api/explain"
        ):
            return JSONResponse(status_code=403, content={
                "code": "PUBLIC_DEMO_READ_ONLY",
                "message": "This public research demo is read-only. Run CytoZoe locally to save or edit reviews.",
                "details": {},
            })
        response = await call_next(request)
        response.headers["X-CytoZoe-Mode"] = "public-read-only"
        return response

    return app
