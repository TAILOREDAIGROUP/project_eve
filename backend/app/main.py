import os
import shutil
import logging
import uuid
from typing import List, Optional
from datetime import datetime

from fastapi import FastAPI, UploadFile, File, Form, Depends, HTTPException, BackgroundTasks, Body
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from pydantic import BaseModel

# LlamaIndex
from llama_index.core import Settings, SimpleDirectoryReader
from llama_index.core.node_parser import SentenceSplitter
from llama_index.llms.openai import OpenAI
from llama_index.embeddings.openai import OpenAIEmbedding

from dotenv import load_dotenv
from app.database import get_db
from app.chat_service import chat_pipeline

load_dotenv()

# Initialize Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Central Intelligence Platform API", version="0.2.0")

# CORS Middleware
origins = ["*"] # For dev only, restrict in production

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# LlamaIndex Global Settings
def init_settings():
    openai_api_key = os.getenv("OPENAI_API_KEY")
    if not openai_api_key:
        logger.warning("OPENAI_API_KEY missing!")
    
    Settings.llm = OpenAI(model="gpt-4o", temperature=0)
    Settings.embed_model = OpenAIEmbedding(model="text-embedding-3-small")

@app.on_event("startup")
async def startup_event():
    init_settings()

@app.get("/")
def root():
    return {"message": "Central Intelligence Platform API Active"}

@app.post("/api/v1/ingest/upload")
async def ingest_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    tenant_id: str = Form(...),
    db: AsyncSession = Depends(get_db)
):
    """
    Ingests a document:
    1. Saves temp file
    2. Parses with LlamaIndex
    3. Chunks
    4. Embeds
    5. Stores in Postgres with tenant_id
    """
    
    # 1. Validate Tenant
    # In a real app, we'd validate the tenant_id against the user's token.
    # Here we trust the input for Phase 2 demo purposes.
    try:
        tenant_uuid = uuid.UUID(tenant_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid tenant_id format")

    # 2. Save Temp File
    file_id = str(uuid.uuid4())
    temp_filename = f"temp_{file_id}_{file.filename}"
    
    try:
        with open(temp_filename, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # 3. Parse Document
        reader = SimpleDirectoryReader(input_files=[temp_filename])
        documents = reader.load_data()
        
        # 4. Insert Document Record
        # We need a proper user_id in real life, but we'll skip for now or use a placeholder if needed by RLS.
        # But wait, our RLS relies on current user. 
        # CRITICAL: For this phase, since we are calling from a frontend without full Auth implementation yet,
        # we might face RLS issues if we don't simulate a user. 
        # However, the user prompt said "backend logic to process them".
        # We will Insert directly using the passed tenant_id.
        # Note: If RLS is enabled on the DB, the DB user (postgres) usually bypasses RLS unless defined otherwise,
        # OR we need to use `SET LOCAL app.current_tenant` patterns. 
        # For simplicity in Phase 2, we will assume the DB connection here allows insertion.
        
        doc_insert_query = text("""
            INSERT INTO documents (id, tenant_id, name, file_type, s3_path)
            VALUES (:id, :tenant_id, :name, :file_type, :s3_path)
            RETURNING id
        """)
        
        doc_uuid = uuid.uuid4()
        await db.execute(doc_insert_query, {
            "id": doc_uuid,
            "tenant_id": tenant_uuid,
            "name": file.filename,
            "file_type": file.content_type or "unknown",
            "s3_path": "local" 
        })
        
        # 5. Chunk and Embed
        text_splitter = SentenceSplitter(chunk_size=512, chunk_overlap=50)
        
        nodes = text_splitter.get_nodes_from_documents(documents)
        
        chunk_insert_query = text("""
            INSERT INTO document_chunks (tenant_id, document_id, content, embedding, chunk_index)
            VALUES (:tenant_id, :document_id, :content, :embedding, :chunk_index)
        """)
        
        count = 0
        for i, node in enumerate(nodes):
            # Generate Embedding
            embedding = Settings.embed_model.get_text_embedding(node.get_content())
            
            await db.execute(chunk_insert_query, {
                "tenant_id": tenant_uuid,
                "document_id": doc_uuid,
                "content": node.get_content(),
                "embedding": embedding,
                "chunk_index": i
            })
            count += 1
            
        await db.commit()
        
        # Cleanup
        os.remove(temp_filename)
        
        return {"status": "success", "document_id": str(doc_uuid), "chunks_processed": count}

    except Exception as e:
        await db.rollback()
        logger.error(f"Ingestion failed: {e}")
        if os.path.exists(temp_filename):
            os.remove(temp_filename)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/documents")
async def list_documents(tenant_id: str, db: AsyncSession = Depends(get_db)):
    try:
        tenant_uuid = uuid.UUID(tenant_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid tenant_id")

    query = text("SELECT id, name, created_at FROM documents WHERE tenant_id = :tenant_id ORDER BY created_at DESC")
    result = await db.execute(query, {"tenant_id": tenant_uuid})
    rows = result.fetchall()
    
    return [
        {"id": str(row.id), "name": row.name, "created_at": row.created_at}
        for row in rows
    ]

class ChatRequest(BaseModel):
    query: str
    tenant_id: str
    history: List[dict] = []

@app.post("/api/v1/chat")
async def chat_endpoint(
    request: ChatRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    RAG Chat Endpoint
    """
    try:
        # Validate Tenant UUID format
        try:
           uuid.UUID(request.tenant_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid tenant_id")

        response = await chat_pipeline(
            query=request.query,
            tenant_id=request.tenant_id,
            history=request.history,
            db=db
        )
        return response
    except Exception as e:
        logger.error(f"Chat failed: {e}")
        # Return a friendly error properly
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/usage/stats")
async def get_usage_stats(tenant_id: str, db: AsyncSession = Depends(get_db)):
    try:
        tenant_uuid = uuid.UUID(tenant_id)
        
        query = text("""
            SELECT 
                SUM(input_tokens) as total_input,
                SUM(output_tokens) as total_output,
                COUNT(*) as total_requests
            FROM token_usage
            WHERE tenant_id = :tenant_id
        """)
        
        result = await db.execute(query, {"tenant_id": tenant_uuid})
        row = result.fetchone()
        
        total_input = row.total_input or 0
        total_output = row.total_output or 0
        total_reqs = row.total_requests or 0
        total_tokens = total_input + total_output
        
        # Cost assumption: $0.005 per 1k input, $0.015 per 1k output (Simplified average $0.01/1k)
        # Or prompt says $0.005/1k total
        cost = (total_tokens / 1000) * 0.005
        
        return {
            "total_tokens": total_tokens,
            "estimated_cost": round(cost, 4),
            "total_requests": total_reqs
        }
    except Exception as e:
        logger.error(f"Usage stats failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch usage stats")
