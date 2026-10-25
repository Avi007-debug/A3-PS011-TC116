.PHONY: help demo test testbed-up testbed-down scenario-t0 scenario-t1 scenario-t2 lint frontend-dev frontend-build backend-dev

help:
	@echo "======================================================================"
	@echo "ArgusASM - Autonomous Attack-Surface Inventory & Drift Sentinel"
	@echo "AIORI Hackathon 2026 - Problem Statement PS-011"
	@echo "======================================================================"
	@echo "Targets:"
	@echo "  make demo            - Run automated 10-step seeded validation runner"
	@echo "  make test            - Execute full pytest test suite"
	@echo "  make lint            - Run terminology and wording lint test"
	@echo "  make testbed-up      - Launch 5-container Docker lab testbed"
	@echo "  make testbed-down    - Stop Docker lab testbed containers"
	@echo "  make scenario-t0     - Switch lab perimeter to T0 Clean Baseline"
	@echo "  make scenario-t1     - Switch lab perimeter to T1 Drifted State (3 Seeds)"
	@echo "  make scenario-t2     - Switch lab perimeter to T2 Remediated State"
	@echo "  make backend-dev     - Start FastAPI backend on port 8000"
	@echo "  make frontend-dev    - Start Vite frontend on port 5173"
	@echo "  make frontend-build  - Compile production frontend bundle"
	@echo "======================================================================"

demo:
	python tests/seeded_validation.py

test:
	python -m pytest tests/ -v

lint:
	python -m pytest tests/test_wording_lint.py -v

testbed-up:
	docker compose -f testbed/docker-compose.yml up -d

testbed-down:
	docker compose -f testbed/docker-compose.yml down

scenario-t0:
	python testbed/run_scenarios.py --state T0

scenario-t1:
	python testbed/run_scenarios.py --state T1

scenario-t2:
	python testbed/run_scenarios.py --state T2

backend-dev:
	uvicorn backend.app:app --host 0.0.0.0 --port 8000 --reload

frontend-dev:
	cd frontend && npm run dev

frontend-build:
	cd frontend && npm run build
