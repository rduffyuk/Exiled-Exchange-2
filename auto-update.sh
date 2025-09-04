#!/bin/bash

# Exiled Exchange 2 Auto-Update Script
# This script checks for updates, rebuilds if needed, and runs the app

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

LOG_FILE="$SCRIPT_DIR/auto-update.log"
APPIMAGE_PATH="$SCRIPT_DIR/main/dist/Exiled Exchange 2-0.11.3.AppImage"
PID_FILE="/tmp/exiled-exchange-2.pid"

# Function to log messages
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Function to kill existing instance
kill_existing() {
    if [ -f "$PID_FILE" ]; then
        OLD_PID=$(cat "$PID_FILE")
        if kill -0 "$OLD_PID" 2>/dev/null; then
            log_message "Killing existing instance (PID: $OLD_PID)"
            kill "$OLD_PID"
            sleep 2
        fi
        rm -f "$PID_FILE"
    fi
}

# Function to build the app
build_app() {
    log_message "Building application..."
    
    # Build renderer
    cd "$SCRIPT_DIR/renderer"
    npm install --silent
    npm run make-index-files
    npm run build
    
    # Build main
    cd "$SCRIPT_DIR/main"
    npm install --silent
    npm run build
    npm run package
    
    # Make AppImage executable
    chmod +x "$APPIMAGE_PATH"
    
    log_message "Build complete"
}

# Function to check for updates
check_and_update() {
    log_message "Checking for updates..."
    
    # Fetch latest changes
    git fetch origin
    
    # Check if we're behind
    LOCAL=$(git rev-parse HEAD)
    REMOTE=$(git rev-parse origin/master)
    
    if [ "$LOCAL" != "$REMOTE" ]; then
        log_message "Updates available. Pulling changes..."
        git pull origin master
        
        # Rebuild the application
        build_app
        
        return 0  # Updated
    else
        log_message "Already up to date"
        return 1  # No updates
    fi
}

# Function to run the app
run_app() {
    log_message "Starting Exiled Exchange 2..."
    
    # Kill any existing instance
    kill_existing
    
    # Run the AppImage in background
    "$APPIMAGE_PATH" --no-sandbox &
    APP_PID=$!
    echo $APP_PID > "$PID_FILE"
    
    log_message "Started with PID: $APP_PID"
}

# Main execution
main() {
    case "${1:-}" in
        "check")
            check_and_update
            if [ $? -eq 0 ]; then
                kill_existing
                run_app
            fi
            ;;
        "force-build")
            build_app
            kill_existing
            run_app
            ;;
        "run")
            run_app
            ;;
        "stop")
            kill_existing
            ;;
        *)
            # Default: check for updates and run
            check_and_update
            run_app
            ;;
    esac
}

main "$@"