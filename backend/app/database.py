import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    # Fallback to local docker default
    DATABASE_URL = "postgresql+asyncpg://postgres:postgres@db:5432/postgres"

# Create Async Engine
engine = create_async_engine(DATABASE_URL, echo=True)

# Session Definition
AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False
)

async def get_db():
    async with AsyncSessionLocal() as session:
        # Initial query to ensure connection and vector extension
        await session.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        yield session
