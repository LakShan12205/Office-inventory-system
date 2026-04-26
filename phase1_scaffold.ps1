$root = "C:\Users\ASUS\Documents\Ai_agent"

$dirs = @(
  "$root\backend\app\api",
  "$root\backend\app\core",
  "$root\backend\app\models",
  "$root\backend\app\schemas",
  "$root\backend\app\services",
  "$root\backend\app\data",
  "$root\backend\app\utils",
  "$root\backend\tests",
  "$root\frontend\app\dashboard",
  "$root\frontend\app\upload",
  "$root\frontend\app\analysis\[reportId]",
  "$root\frontend\app\reports\history",
  "$root\frontend\app\reports\[reportId]",
  "$root\frontend\components\layout",
  "$root\frontend\components\ui",
  "$root\frontend\lib",
  "$root\frontend\types",
  "$root\frontend\public"
)

foreach ($dir in $dirs) {
  New-Item -ItemType Directory -Force -Path $dir | Out-Null
}

$files = @{
  "$root\README.md" = @"
# Cybersecurity Report Analysis Agent

Internal AI-powered dashboard for parsing and analyzing cybersecurity reports.

This repository is being built in phases.
"@;
  "$root\backend\README.md" = @"
# Backend

FastAPI backend for report ingestion, parsing, enrichment, scoring, and history retrieval.

Phase 1 currently includes the project skeleton and placeholder services.
"@;
  "$root\backend\requirements.txt" = @"
fastapi==0.115.12
uvicorn[standard]==0.34.2
sqlalchemy==2.0.40
psycopg2-binary==2.9.10
pydantic-settings==2.9.1
python-multipart==0.0.20
pypdf==5.4.0
python-docx==1.1.2
"@;
  "$root\backend\.env.example" = @"
APP_NAME=Cybersecurity Report Analysis Agent API
APP_ENV=development
APP_HOST=0.0.0.0
APP_PORT=8000
DATABASE_URL=postgresql+psycopg2://postgres:postgres@localhost:5432/cyber_reports
LLM_PROVIDER=mock
LLM_MODEL=gpt-4.1-mini
LLM_API_KEY=your_api_key_here
LOG_LEVEL=INFO
"@;
  "$root\backend\app\__init__.py" = "";
  "$root\backend\app\api\__init__.py" = "";
  "$root\backend\app\core\__init__.py" = "";
  "$root\backend\app\models\__init__.py" = @"
\"\"\"Database models package.\"\"\"
"@;
  "$root\backend\app\schemas\__init__.py" = @"
\"\"\"Pydantic schemas package.\"\"\"
"@;
  "$root\backend\app\services\__init__.py" = @"
\"\"\"Analysis services package.\"\"\"
"@;
  "$root\backend\app\utils\__init__.py" = "";
  "$root\backend\app\main.py" = @"
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes_analysis import router as analysis_router
from app.api.routes_reports import router as reports_router
from app.core.config import settings
from app.utils.logger import configure_logging

configure_logging(settings.log_level)

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description="Internal API for cybersecurity report analysis.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(reports_router, prefix="/api/reports", tags=["reports"])
app.include_router(analysis_router, prefix="/api/analysis", tags=["analysis"])


@app.get("/health", tags=["health"])
def healthcheck() -> dict[str, str]:
    return {"status": "ok", "environment": settings.app_env}
"@;
  "$root\backend\app\core\config.py" = @"
from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = Field(default="Cybersecurity Report Analysis Agent API")
    app_env: str = Field(default="development")
    app_host: str = Field(default="0.0.0.0")
    app_port: int = Field(default=8000)
    database_url: str = Field(default="postgresql+psycopg2://postgres:postgres@localhost:5432/cyber_reports")
    llm_provider: str = Field(default="mock")
    llm_model: str = Field(default="gpt-4.1-mini")
    llm_api_key: str = Field(default="")
    log_level: str = Field(default="INFO")
    allowed_origins: list[str] = Field(default=["http://localhost:3000"])

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", case_sensitive=False)


@lru_cache(maxsize=1)
def get_settings() -> "Settings":
    return Settings()


settings = get_settings()
"@;
  "$root\backend\app\core\database.py" = @"
from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import settings


class Base(DeclarativeBase):
    \"\"\"Base SQLAlchemy model class.\"\"\"


engine = create_engine(settings.database_url, future=True, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
"@;
  "$root\backend\app\api\routes_reports.py" = @"
import logging
from uuid import UUID

from fastapi import APIRouter, File, HTTPException, UploadFile

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/upload")
async def upload_report(file: UploadFile = File(...)) -> dict:
    logger.info("Received report upload", extra={"filename": file.filename})
    return {
        "message": "Upload endpoint scaffolded.",
        "file_name": file.filename,
        "status": "pending_phase_2",
    }


@router.post("/analyze")
async def analyze_report() -> dict:
    return {
        "message": "Analyze endpoint scaffolded.",
        "status": "pending_phase_2",
    }


@router.get("")
def list_reports() -> dict:
    return {"items": [], "total": 0}


@router.get("/{report_id}")
def get_report(report_id: UUID) -> dict:
    raise HTTPException(status_code=404, detail=f"Report {report_id} not available in Phase 1 scaffold")


@router.get("/{report_id}/summary")
def get_report_summary(report_id: UUID) -> dict:
    raise HTTPException(status_code=404, detail=f"Summary for report {report_id} not available in Phase 1 scaffold")
"@;
  "$root\backend\app\api\routes_analysis.py" = @"
from fastapi import APIRouter

from app.services.analysis_pipeline import run_analysis_pipeline

router = APIRouter()


@router.post("/run")
def run_analysis() -> dict:
    return run_analysis_pipeline(raw_text="Sample suspicious activity report for scaffold validation.")
"@;
  "$root\backend\app\models\report.py" = @"
\"\"\"Report model placeholder for Phase 2.\"\"\"
"@;
  "$root\backend\app\models\entity.py" = @"
\"\"\"Extracted entity model placeholder for Phase 2.\"\"\"
"@;
  "$root\backend\app\models\mapping.py" = @"
\"\"\"MITRE and NIST mapping model placeholder for Phase 2.\"\"\"
"@;
  "$root\backend\app\models\analysis_result.py" = @"
\"\"\"Analysis result model placeholder for Phase 2.\"\"\"
"@;
  "$root\backend\app\schemas\common.py" = @"
from pydantic import BaseModel


class MessageResponse(BaseModel):
    message: str
"@;
  "$root\backend\app\schemas\report.py" = @"
\"\"\"Report schemas placeholder for Phase 2.\"\"\"
"@;
  "$root\backend\app\schemas\analysis.py" = @"
\"\"\"Analysis schemas placeholder for Phase 2.\"\"\"
"@;
  "$root\backend\app\services\file_parser.py" = @"
import logging
from pathlib import Path

logger = logging.getLogger(__name__)


def parse_report_file(file_path: str) -> str:
    logger.info("Parsing file", extra={"file_path": file_path})
    suffix = Path(file_path).suffix.lower()
    return f"Phase 1 parser placeholder for {suffix or 'text'} files."
"@;
  "$root\backend\app\services\text_cleaner.py" = @"
def clean_text(raw_text: str) -> str:
    return " ".join(raw_text.split())
"@;
  "$root\backend\app\services\document_understanding_agent.py" = @"
import logging

from app.services.report_classifier import classify_report
from app.services.text_cleaner import clean_text

logger = logging.getLogger(__name__)


def run_document_understanding_agent(raw_text: str) -> dict:
    cleaned_text = clean_text(raw_text)
    report_type = classify_report(cleaned_text)
    result = {
        "cleaned_text": cleaned_text,
        "report_type": report_type,
        "document_summary": "Phase 1 document understanding summary placeholder.",
    }
    logger.info("Document understanding completed", extra={"report_type": report_type})
    return result
"@;
  "$root\backend\app\services\report_classifier.py" = @"
REPORT_TYPES = [
    "phishing",
    "malware",
    "vulnerability",
    "suspicious login",
    "insider threat",
    "data exposure",
    "general incident",
]


def classify_report(text: str) -> str:
    lower_text = text.lower()
    if "phish" in lower_text or "spoofed" in lower_text:
        return "phishing"
    if "powershell" in lower_text or "malware" in lower_text or "payload" in lower_text:
        return "malware"
    if "cve-" in lower_text or "vulnerability" in lower_text or "patch" in lower_text:
        return "vulnerability"
    return "general incident"
"@;
  "$root\backend\app\services\entity_extractor.py" = @"
import logging

logger = logging.getLogger(__name__)


def run_entity_extraction_agent(text: str) -> dict:
    logger.info("Entity extraction started")
    return {
        "ip_addresses": [],
        "domains": [],
        "email_addresses": [],
        "cves": [],
        "usernames": [],
        "hostnames": [],
        "urls": [],
    }
"@;
  "$root\backend\app\services\mitre_mapper.py" = @"
import logging

logger = logging.getLogger(__name__)


def run_mitre_mapping_agent(text: str, report_type: str) -> list[dict]:
    logger.info("MITRE mapping started", extra={"report_type": report_type})
    return [
        {
            "tactic": "Execution",
            "technique_id": "T1059.001",
            "technique_name": "PowerShell",
            "confidence": 0.42,
            "reason": "Phase 1 placeholder mapping.",
        }
    ]
"@;
  "$root\backend\app\services\nist_mapper.py" = @"
import logging

logger = logging.getLogger(__name__)


def run_nist_mapping_agent(text: str, report_type: str) -> list[dict]:
    logger.info("NIST mapping started", extra={"report_type": report_type})
    return [
        {
            "function": "Detect",
            "confidence": 0.51,
            "explanation": "Phase 1 placeholder mapping.",
        }
    ]
"@;
  "$root\backend\app\services\risk_scorer.py" = @"
import logging

logger = logging.getLogger(__name__)


def run_risk_scoring_agent(report_type: str, mitre_mappings: list[dict], entity_bundle: dict) -> dict:
    logger.info("Risk scoring started", extra={"report_type": report_type})
    return {
        "severity": "Medium",
        "confidence_score": 0.58,
        "reasoning": "Phase 1 placeholder score derived from scaffold defaults.",
    }
"@;
  "$root\backend\app\services\summarizer.py" = @"
import logging

logger = logging.getLogger(__name__)


def run_summary_generation_agent(report_type: str, risk_result: dict, mitre_mappings: list[dict], nist_mappings: list[dict]) -> dict:
    logger.info("Summary generation started", extra={"report_type": report_type})
    return {
        "analyst_summary": "Phase 1 analyst summary placeholder.",
        "manager_summary": "Phase 1 management summary placeholder.",
        "recommended_actions": [
            "Validate report ingestion and parsing flow.",
            "Confirm database models in Phase 2.",
            "Refine enrichment logic in Phase 3.",
        ],
        "overall_reasoning": "Mappings and severity are placeholder outputs until the backend services are fully implemented.",
    }
"@;
  "$root\backend\app\services\analysis_pipeline.py" = @"
import logging

from app.services.document_understanding_agent import run_document_understanding_agent
from app.services.entity_extractor import run_entity_extraction_agent
from app.services.mitre_mapper import run_mitre_mapping_agent
from app.services.nist_mapper import run_nist_mapping_agent
from app.services.risk_scorer import run_risk_scoring_agent
from app.services.summarizer import run_summary_generation_agent

logger = logging.getLogger(__name__)


def run_analysis_pipeline(raw_text: str) -> dict:
    \"\"\"Deterministic agent-style orchestration with transparent intermediate outputs.\"\"\"
    logger.info("Analysis pipeline started")

    document_result = run_document_understanding_agent(raw_text)
    entity_result = run_entity_extraction_agent(document_result["cleaned_text"])
    mitre_result = run_mitre_mapping_agent(document_result["cleaned_text"], document_result["report_type"])
    nist_result = run_nist_mapping_agent(document_result["cleaned_text"], document_result["report_type"])
    risk_result = run_risk_scoring_agent(document_result["report_type"], mitre_result, entity_result)
    summary_result = run_summary_generation_agent(
        document_result["report_type"],
        risk_result,
        mitre_result,
        nist_result,
    )

    final_result = {
        "report_type": document_result["report_type"],
        "severity": risk_result["severity"],
        "confidence_score": risk_result["confidence_score"],
        "entities": entity_result,
        "mitre_mappings": mitre_result,
        "nist_mappings": nist_result,
        "analyst_summary": summary_result["analyst_summary"],
        "manager_summary": summary_result["manager_summary"],
        "recommended_actions": summary_result["recommended_actions"],
        "overall_reasoning": summary_result["overall_reasoning"],
        "debug": {
            "document_understanding": document_result,
            "entity_extraction": entity_result,
            "mitre_mapping": mitre_result,
            "nist_mapping": nist_result,
            "risk_scoring": risk_result,
            "summary_generation": summary_result,
        },
    }
    logger.info("Analysis pipeline completed", extra={"report_type": final_result["report_type"]})
    return final_result
"@;
  "$root\backend\app\utils\logger.py" = @"
import logging


def configure_logging(log_level: str) -> None:
    logging.basicConfig(
        level=getattr(logging, log_level.upper(), logging.INFO),
        format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    )
"@;
  "$root\backend\app\data\mitre_mapping_seed.json" = @"
[
  {
    "keywords": ["powershell", "encodedcommand", "script block"],
    "tactic": "Execution",
    "technique_id": "T1059.001",
    "technique_name": "PowerShell"
  },
  {
    "keywords": ["phishing", "spoofed login", "credential harvest"],
    "tactic": "Initial Access",
    "technique_id": "T1566",
    "technique_name": "Phishing"
  }
]
"@;
  "$root\backend\app\data\nist_mapping_seed.json" = @"
[
  {
    "keywords": ["policy", "governance", "ownership"],
    "function": "Govern",
    "explanation": "Governance-related findings"
  },
  {
    "keywords": ["detect", "alert", "monitoring"],
    "function": "Detect",
    "explanation": "Detection and monitoring findings"
  }
]
"@;
  "$root\frontend\README.md" = @"
# Frontend

Next.js frontend for the internal analyst dashboard.

Phase 1 currently includes the page structure and UI placeholders.
"@;
  "$root\frontend\.env.example" = @"
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
"@;
  "$root\frontend\package.json" = @"
{
  "name": "cybersecurity-report-analysis-agent-frontend",
  "private": true,
  "version": "0.1.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  }
}
"@;
  "$root\frontend\tsconfig.json" = @"
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "es2022"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
"@;
  "$root\frontend\next-env.d.ts" = @"
/// <reference types="next" />
/// <reference types="next/image-types/global" />
"@;
  "$root\frontend\app\layout.tsx" = @"
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
"@;
  "$root\frontend\app\page.tsx" = @"
export default function HomePage() {
  return <main>Internal dashboard scaffold placeholder.</main>;
}
"@;
  "$root\frontend\app\dashboard\page.tsx" = @"
export default function DashboardPage() {
  return <main>Dashboard page scaffold.</main>;
}
"@;
  "$root\frontend\app\upload\page.tsx" = @"
export default function UploadPage() {
  return <main>Upload report page scaffold.</main>;
}
"@;
  "$root\frontend\app\analysis\[reportId]\page.tsx" = @"
export default function AnalysisResultPage() {
  return <main>Analysis result page scaffold.</main>;
}
"@;
  "$root\frontend\app\reports\history\page.tsx" = @"
export default function ReportHistoryPage() {
  return <main>Report history page scaffold.</main>;
}
"@;
  "$root\frontend\app\reports\[reportId]\page.tsx" = @"
export default function ReportDetailsPage() {
  return <main>Report details page scaffold.</main>;
}
"@;
  "$root\frontend\components\layout\sidebar.tsx" = @"
export function Sidebar() {
  return <aside>Sidebar scaffold.</aside>;
}
"@;
  "$root\frontend\lib\api.ts" = @"
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
"@;
  "$root\frontend\types\index.ts" = @"
export type Placeholder = string;
"@
}

foreach ($entry in $files.GetEnumerator()) {
  $parent = Split-Path -Parent $entry.Key
  if (-not (Test-Path $parent)) {
    New-Item -ItemType Directory -Force -Path $parent | Out-Null
  }
  [System.IO.File]::WriteAllText($entry.Key, $entry.Value)
}
