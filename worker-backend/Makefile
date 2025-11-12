# Makefile for ONE⚡CASH Payment Worker

# Variables
WORKER_NAME = onecash-payment-worker

# Install dependencies
install:
	npm install

# Run worker locally for development
dev:
	npm run dev

# Deploy worker to Cloudflare
deploy:
	npm run deploy

# Test worker endpoints
test:
	node test-worker.js

# Format code
format:
	npx prettier --write .

# Check for linting issues
lint:
	npx eslint .

# Clean node_modules
clean:
	rm -rf node_modules

# Help
help:
	@echo "Available commands:"
	@echo "  install  - Install dependencies"
	@echo "  dev      - Run worker locally for development"
	@echo "  deploy   - Deploy worker to Cloudflare"
	@echo "  test     - Test worker endpoints"
	@echo "  format   - Format code"
	@echo "  lint     - Check for linting issues"
	@echo "  clean    - Clean node_modules"
	@echo "  help     - Show this help message"

.PHONY: install dev deploy test format lint clean help