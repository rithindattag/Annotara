#!/usr/bin/env bash
set -euo pipefail

# Colors for nicer output
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
RESET="\033[0m"

function command_exists() {
  command -v "$1" >/dev/null 2>&1
}

function section() {
  echo -e "\n${YELLOW}==> $1${RESET}"
}

function success() {
  echo -e "${GREEN}$1${RESET}"
}

function warn() {
  echo -e "${YELLOW}$1${RESET}"
}

function error() {
  echo -e "${RED}$1${RESET}" >&2
}

section "Checking Docker prerequisites"

if ! command_exists docker; then
  error "Docker CLI is not installed or not in PATH."
  echo "Please install Docker Desktop or Docker Engine: https://docs.docker.com/get-docker/"
  exit 1
fi
success "Docker CLI detected ($(docker --version))."

if docker info >/dev/null 2>&1; then
  success "Docker daemon is running and accessible."
else
  error "Docker daemon is not running or you do not have permission to access it."
  echo "Start Docker Desktop or ensure your user is added to the docker group."
  exit 1
fi

if command_exists "docker" && docker compose version >/dev/null 2>&1; then
  success "docker compose V2 is available."
elif command_exists docker-compose; then
  warn "docker compose V2 not found, but docker-compose V1 is available. The project will still work."
else
  error "Neither docker compose V2 nor docker-compose is installed."
  echo "Install the latest Docker Desktop / CLI with Compose support."
  exit 1
fi

section "Optional validation"
if docker compose config >/dev/null 2>&1; then
  success "docker-compose.yml parsed successfully."
else
  warn "docker compose config failed. Verify docker-compose.yml manually."
fi

section "All prerequisite checks complete!"
success "You are ready to run 'docker compose up --build'."
