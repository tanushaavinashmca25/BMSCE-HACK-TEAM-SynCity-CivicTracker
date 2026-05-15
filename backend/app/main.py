import logging
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .api import reports, users, config as config_api, admin as admin_api

logging.basicConfig(
    level=logging.WARNING,
    format="%(asctime)s %(levelname)s %(name)s :: %(message)s",
)

app = FastAPI(
    title=settings.APP_NAME,
    debug=settings.DEBUG
)

# CORS setup for mobile and web clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(reports.router, prefix="/api/v1/reports", tags=["Reports"])
app.include_router(users.router, prefix="/api/v1/users", tags=["Users"])
app.include_router(config_api.router, prefix="/api/v1/config", tags=["Config"])
app.include_router(admin_api.router, prefix="/api/v1/admin", tags=["Admin"])

@app.get("/")
async def root():
    return {"message": "Welcome to SynCity API", "status": "healthy"}
