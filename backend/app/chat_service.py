import os
import uuid
import logging
from typing import List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from llama_index.core import Settings, Document, VectorStoreIndex
from llama_index.core.schema import TextNode, NodeWithScore
# Direct usage of sentence_transformers to avoid package issues
from sentence_transformers import CrossEncoder

logger = logging.getLogger(__name__)

# Initialize Reranker (Global)
# CrossEncoder is perfect for reranking (Query, Document) pairs
try:
    reranker_model = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")
except Exception as e:
    logger.warning(f"Failed to load Reranker: {e}. Reranking will be skipped.")
    reranker_model = None

async def chat_pipeline(
    query: str, 
    tenant_id: str, 
    history: List[Dict[str, str]], 
    db: AsyncSession
) -> Dict[str, Any]:
    """
    Executes the "Savvy CTO" RAG Pipeline:
    1. Retrieve Top 15 chunks (Vector Search)
    2. Rerank down to Top 5 (Cross-Encoder)
    3. Generate Answer (GPT-4o)
    """
    
    # 1. RETRIEVAL (Vector Search)
    query_embedding = Settings.embed_model.get_text_embedding(query)
    
    vector_query = text("""
        SELECT 
            c.id, 
            c.content, 
            c.document_id, 
            d.name as document_name,
            1 - (c.embedding <=> :embedding) as similarity
        FROM document_chunks c
        JOIN documents d ON c.document_id = d.id
        WHERE c.tenant_id = :tenant_id
        AND 1 - (c.embedding <=> :embedding) > 0.0
        ORDER BY c.embedding <=> :embedding
        LIMIT 15
    """)
    
    result = await db.execute(vector_query, {
        "embedding": str(query_embedding), 
        "tenant_id": uuid.UUID(tenant_id)
    })
    rows = result.fetchall()
    
    if not rows:
        return {
            "answer": "I cannot find any relevant information in your uploaded documents to answer that question.",
            "citations": []
        }
        
    nodes: List[NodeWithScore] = []
    for row in rows:
        node = TextNode(
            text=row.content,
            id_=str(row.id),
            metadata={"document_name": row.document_name, "document_id": str(row.document_id)}
        )
        nodes.append(NodeWithScore(node=node, score=row.similarity))
        
    # 2. RERANKING
    # Filter top 15 -> top 5
    final_nodes = nodes
    if reranker_model:
        # Prepare pairs for CrossEncoder
        pairs = [[query, n.node.get_content()] for n in nodes]
        scores = reranker_model.predict(pairs)
        
        # Update scores
        for n, score in zip(nodes, scores):
            n.score = score
            
        # Sort by new score
        nodes.sort(key=lambda x: x.score, reverse=True)
        final_nodes = nodes[:5]
    else:
        # Fallback to top 5 vector
        final_nodes = nodes[:5]
    
    # Check if we have anything useful
    # Arbitrary threshold for reranker logic, or just return top results.
    # We'll just proceed with top 5.

    # 3. GENERATION
    context_str = "\n\n".join([
        f"Document: {n.node.metadata['document_name']}\nContent: {n.node.get_content()}" 
        for n in final_nodes
    ])
    
    system_prompt = (
        "You are a helpful business assistant for the Central Intelligence Platform. "
        "Answer the user's question ONLY using the provided context below. "
        "If the answer is not in the context, say 'I cannot find that information in your documents.' "
        "Always cite the document name when answering."
    )
    
    user_message = f"Context:\n{context_str}\n\nQuestion: {query}"
    
    from llama_index.core.llms import ChatMessage, MessageRole
    messages = [
        ChatMessage(role=MessageRole.SYSTEM, content=system_prompt),
        ChatMessage(role=MessageRole.USER, content=user_message)
    ]
    chat_response = Settings.llm.chat(messages)
    
    # 4. LOG USAGE (Billing)
    # Estimate tokens: 1 word ~= 1.3 tokens. 
    # For accuracy we should use careful encoding, but for MVP estimation is fine.
    input_text = system_prompt + user_message
    output_text = chat_response.message.content
    input_tokens = int(len(input_text.split()) * 1.3)
    output_tokens = int(len(output_text.split()) * 1.3)
    
    try:
        usage_query = text("""
            INSERT INTO token_usage (tenant_id, input_tokens, output_tokens, model_name)
            VALUES (:tenant_id, :input_tokens, :output_tokens, :model_name)
        """)
        await db.execute(usage_query, {
            "tenant_id": uuid.UUID(tenant_id),
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "model_name": "gpt-4o"
        })
        await db.commit()
    except Exception as e:
        logger.error(f"Failed to log usage: {e}")
        # Don't fail the chat for logging error
    
    citations = list(set([n.node.metadata['document_name'] for n in final_nodes]))
    
    return {
        "answer": chat_response.message.content,
        "citations": citations
    }
