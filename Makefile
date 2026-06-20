.PHONY: install install-backend install-frontend backend frontend lint build clean

install: install-backend install-frontend ## Install backend + frontend deps

install-backend: ## Create venv and install backend
	cd backend && uv venv --python 3.12 .venv && . .venv/bin/activate && uv pip install -e .

install-frontend: ## Install frontend deps
	cd frontend && npm install

backend: ## Run FastAPI dev server (http://127.0.0.1:8000)
	cd backend && . .venv/bin/activate && uvicorn app.main:app --reload

frontend: ## Run Vite dev server (http://localhost:5173)
	cd frontend && npm run dev

lint: ## Lint backend (ruff) + frontend (eslint)
	cd backend && . .venv/bin/activate && ruff check app
	cd frontend && npm run lint

build: ## Production build of the frontend
	cd frontend && npm run build

clean: ## Remove the SQLite DB (reseeds on next start)
	rm -f backend/data/naengbu.db
