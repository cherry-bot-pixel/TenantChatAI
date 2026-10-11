"""
TENANT AI - Minimal Python / Streamlit MVP Prototype
Designed for a 24-hour hackathon:
- 100% Local: No external database, no paid vector DB, no external API key required.
- Cryptographic password hashing (SHA-256 + salt).
- Server-side tenant isolation enforced at the data layer.
- Mock AI Service for grounded RAG query simulation.
"""

import hashlib
import time
from typing import List, Dict, Optional

# =====================================================================
# 1. IN-MEMORY STORAGE: TENANTS & USERS (Simple Python Dictionaries)
# =====================================================================

# Password Hashing Helper
def hash_password(password: str, salt: str = "hackathon_salt_2026") -> str:
    """Hashes password with SHA-256 and salt. Never store plaintext passwords."""
    return hashlib.sha256((salt + password).encode('utf-8')).hexdigest()

SALT = "tenant_ai_secure_salt"

# In-memory dictionary of registered corporate tenants
TENANTS: Dict[str, Dict] = {
    "acme-corp": {
        "id": "acme-corp",
        "name": "Acme Corporation",
        "domain": "acme.com",
        "status": "active"
    },
    "globex-robotics": {
        "id": "globex-robotics",
        "name": "Globex Robotics",
        "domain": "globex.com",
        "status": "active"
    },
    "stark-labs": {
        "id": "stark-labs",
        "name": "Stark Energy Labs",
        "domain": "stark.com",
        "status": "active"
    }
}

# In-memory dictionary of user credentials and roles
# Keyed by email / username
USERS: Dict[str, Dict] = {
    "alice@acme.com": {
        "username": "alice@acme.com",
        "name": "Alice Henderson",
        "password_hash": hash_password("acme123", SALT),
        "tenant_id": "acme-corp",
        "role": "manager"
    },
    "bob@acme.com": {
        "username": "bob@acme.com",
        "name": "Bob Miller",
        "password_hash": hash_password("acme123", SALT),
        "tenant_id": "acme-corp",
        "role": "member"
    },
    "charlie@globex.com": {
        "username": "charlie@globex.com",
        "name": "Charlie Vance",
        "password_hash": hash_password("globex123", SALT),
        "tenant_id": "globex-robotics",
        "role": "member"
    },
    "tony@stark.com": {
        "username": "tony@stark.com",
        "name": "Tony Stark",
        "password_hash": hash_password("stark123", SALT),
        "tenant_id": "stark-labs",
        "role": "manager"
    },
    "admin@tenantai.security": {
        "username": "admin@tenantai.security",
        "name": "System Auditor",
        "password_hash": hash_password("admin123", SALT),
        "tenant_id": "system",
        "role": "admin"
    }
}

# In-memory documents store
# Each document record contains {id, tenant_id, title, content, chunks}
DOCUMENTS: List[Dict] = [
    {
        "id": "doc-acme-001",
        "tenant_id": "acme-corp",
        "title": "Project Falcon Specifications",
        "content": "Project Falcon is Acme's autonomous logistics glider. Propulsion: 480 kWh capacitor pack. Ceiling: 38,000 ft. Emergency waypoint: Victor-9.",
        "chunks": [
            "Project Falcon is Acme's autonomous logistics glider. Propulsion: 480 kWh capacitor pack.",
            "Ceiling: 38,000 ft. Emergency waypoint: Victor-9. Target launch: Q1 2027 in Nevada Proving Grounds."
        ]
    },
    {
        "id": "doc-acme-002",
        "tenant_id": "acme-corp",
        "title": "Acme Corporate Travel Policy",
        "content": "Domestic travel per diem: $85/day meals, $220/night lodging. Expenses over $1,000 require VP sign-off within 5 business days.",
        "chunks": [
            "Domestic travel per diem: $85/day meals, $220/night lodging.",
            "Expenses over $1,000 require VP sign-off within 5 business days."
        ]
    },
    {
        "id": "doc-globex-001",
        "tenant_id": "globex-robotics",
        "title": "G-700 Welding Bot Safety Manual",
        "content": "G-700 Industrial Welding Bot. Safety Interlock Code: 8842-BLUE. Emergency E-Stop stopping distance is 12ms. Max pressure: 3,400 PSI.",
        "chunks": [
            "G-700 Industrial Welding Bot. Safety Interlock Code: 8842-BLUE.",
            "Emergency E-Stop stopping distance is 12ms. Max pressure: 3,400 PSI."
        ]
    }
]

# Minimal audit log entries
AUDIT_LOGS: List[Dict] = []

def record_audit(tenant_id: str, username: str, action: str, status: int, details: str, severity: str = "INFO"):
    AUDIT_LOGS.append({
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "tenant_id": tenant_id,
        "username": username,
        "action": action,
        "status": status,
        "details": details,
        "severity": severity
    })

# =====================================================================
# 2. MOCK AI SERVICE (Simulates API responses without an API key)
# =====================================================================
class MockAIService:
    """
    Simulates a language model endpoint for RAG pipelines.
    Accepts prompt and context passages and produces grounded responses.
    """
    @staticmethod
    def generate(prompt: str, context_passages: List[Dict], tenant_name: str) -> str:
        if not context_passages:
            return (
                f"[Mock AI] I searched all authorized documents for {tenant_name}, "
                f"but found NO relevant evidence to answer: \"{prompt}\".\n\n"
                f"*Strict Tenant Isolation: Queries are strictly constrained to authorized company data.*"
            )

        top_passage = context_passages[0]
        secondary = context_passages[1] if len(context_passages) > 1 else None

        response = (
            f"[Mock AI Generated Response for {tenant_name}]\n\n"
            f"Based on authorized company document **\"{top_passage['doc_title']}\"**:\n"
            f"> \"{top_passage['text']}\"\n\n"
        )
        if secondary:
            response += f"Supporting evidence from **\"{secondary['doc_title']}\"**:\n> \"{secondary['text']}\"\n\n"

        response += "All retrieved data passed server-side tenant authorization checks."
        return response

# =====================================================================
# 3. TENANT ISOLATION & RETRIEVAL ENGINE
# =====================================================================
def authenticate_user(username: str, password_candidate: str) -> Optional[Dict]:
    """Validates user credentials against in-memory dictionary."""
    user = USERS.get(username.lower().strip())
    if not user:
        record_audit("unknown", username, "LOGIN_FAILED", 401, "User not found", "WARN")
        return None
    if user["password_hash"] != hash_password(password_candidate, SALT):
        record_audit(user["tenant_id"], username, "LOGIN_FAILED", 401, "Password incorrect", "WARN")
        return None
    record_audit(user["tenant_id"], username, "LOGIN_SUCCESS", 200, "Authenticated successfully")
    return user

def retrieve_passages_for_tenant(query: str, authorized_tenant_id: str, top_k: int = 3) -> List[Dict]:
    """
    CRITICAL SECURITY CONTROL:
    Filters documents by tenant_id BEFORE evaluating relevance scores.
    A user cannot retrieve chunks outside their authorized company.
    """
    query_terms = [w.lower() for w in query.split() if len(w) > 2]
    if not query_terms:
        return []

    # 1. ENFORCE TENANT BOUNDARY FIRST
    tenant_docs = [d for d in DOCUMENTS if d["tenant_id"] == authorized_tenant_id]

    scored_passages = []
    for doc in tenant_docs:
        for chunk in doc["chunks"]:
            lower_chunk = chunk.lower()
            matches = sum(1 for term in query_terms if term in lower_chunk)
            if matches > 0:
                scored_passages.append({
                    "doc_id": doc["id"],
                    "doc_title": doc["title"],
                    "text": chunk,
                    "score": matches
                })

    scored_passages.sort(key=lambda x: x["score"], reverse=True)
    return scored_passages[:top_k]

# =====================================================================
# 4. PENETRATION TEST FUNCTION (Demonstrates IDOR Defense to Judges)
# =====================================================================
def test_cross_tenant_access_attempt(attacker_tenant_id: str, attacker_username: str, target_doc_id: str):
    """
    Attempts to read another company's document directly.
    Demonstrates that the data layer blocks access and records a security incident.
    """
    target = next((d for d in DOCUMENTS if d["id"] == target_doc_id), None)
    if not target:
        return {"status": 404, "message": "Document not found."}

    if target["tenant_id"] != attacker_tenant_id:
        record_audit(
            attacker_tenant_id,
            attacker_username,
            "CROSS_TENANT_IDOR_BLOCKED",
            403,
            f"User attempted unauthorized read on document {target_doc_id} belonging to {target['tenant_id']}",
            "CRITICAL"
        )
        return {
            "status": 403,
            "blocked": True,
            "error": "Forbidden: Tenant isolation violation. Access denied at data layer."
        }
    return {"status": 200, "blocked": False, "document": target}

# =====================================================================
# STREAMLIT USER INTERFACE (Run with: streamlit run app.py)
# =====================================================================
try:
    import streamlit as st
    STREAMLIT_AVAILABLE = True
except ImportError:
    STREAMLIT_AVAILABLE = False

if STREAMLIT_AVAILABLE:
    st.set_page_config(page_title="Tenant AI - Hackathon MVP", page_icon="🛡️", layout="wide")
    st.title("🛡️ Tenant AI: Multi-Tenant Enterprise AI Platform")

    # Session State
    if "current_user" not in st.session_state:
        st.session_state.current_user = None

    # Sidebar: Login & Tenant Switcher
    st.sidebar.header("Authentication & Profile")
    if not st.session_state.current_user:
        st.sidebar.subheader("Quick Hackathon Login")
        demo_user = st.sidebar.selectbox("Select Profile", list(USERS.keys()))
        password_input = st.sidebar.text_input("Password", value="acme123" if "acme" in demo_user else "globex123" if "globex" in demo_user else "admin123", type="password")
        if st.sidebar.button("Log In"):
            user = authenticate_user(demo_user, password_input)
            if user:
                st.session_state.current_user = user
                st.rerun()
            else:
                st.sidebar.error("Invalid credentials.")
    else:
        u = st.session_state.current_user
        tenant_info = TENANTS.get(u["tenant_id"], {"name": "System Auditor"})
        st.sidebar.success(f"Logged in as: **{u['name']}**")
        st.sidebar.info(f"Company: **{tenant_info['name']}** ({u['tenant_id']})")
        st.sidebar.caption(f"Role: {u['role']}")
        if st.sidebar.button("Log Out"):
            st.session_state.current_user = None
            st.rerun()

    # Main Area
    if st.session_state.current_user:
        user = st.session_state.current_user
        tenant_id = user["tenant_id"]
        tenant_name = TENANTS.get(tenant_id, {}).get("name", "System")

        tab_chat, tab_docs, tab_security, tab_admin = st.tabs(["💬 AI Chat", "📁 Documents", "🚨 Security Lab (IDOR Test)", "📊 Admin & Logs"])

        with tab_chat:
            st.subheader(f"Isolated Chat: {tenant_name}")
            query = st.text_input("Ask a question about your company's documents:", placeholder="e.g. What are the Project Falcon specs?")
            if st.button("Submit Question") and query:
                # 1. Retrieve
                passages = retrieve_passages_for_tenant(query, tenant_id)
                # 2. Mock AI Generate
                answer = MockAIService.generate(query, passages, tenant_name)
                record_audit(tenant_id, user["username"], "CHAT_QUERY", 200, f"Query: {query[:30]}")
                st.markdown(answer)
                if passages:
                    with st.expander("Inspected Retrieved Passages (Isolated Context)"):
                        for idx, p in enumerate(passages):
                            st.write(f"**Source #{idx+1} ({p['doc_title']}):** {p['text']}")

        with tab_docs:
            st.subheader(f"Documents Repository for {tenant_name}")
            user_docs = [d for d in DOCUMENTS if d["tenant_id"] == tenant_id]
            for doc in user_docs:
                st.write(f"📄 **{doc['title']}** ({len(doc['chunks'])} passages)")
                st.caption(doc["content"])

        with tab_security:
            st.subheader("Interactive Security & Isolation Demonstration")
            st.write("Test cross-tenant data access (IDOR attack) directly against the backend data layer:")
            target_doc = st.selectbox("Target Document to Fetch", [d["id"] + " (" + d["title"] + " - " + d["tenant_id"] + ")" for d in DOCUMENTS])
            target_id = target_doc.split()[0]
            if st.button("Execute Cross-Tenant Read"):
                res = test_cross_tenant_access_attempt(tenant_id, user["username"], target_id)
                if res.get("blocked"):
                    st.error(f"🛑 Access BLOCKED (HTTP {res['status']}): {res['error']}")
                else:
                    st.success(f"✅ Access Allowed (Belongs to your tenant)")

        with tab_admin:
            st.subheader("Operational & Security Audit Logs")
            if user["role"] == "admin":
                st.dataframe(AUDIT_LOGS)
            else:
                st.warning("Admin role required to view full system logs. Showing current tenant events only:")
                st.dataframe([l for l in AUDIT_LOGS if l["tenant_id"] == tenant_id])
else:
    print("[Tenant AI] Module loaded. USERS and TENANTS in-memory stores initialized.")
