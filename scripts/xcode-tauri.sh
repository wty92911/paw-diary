#!/bin/bash

# Set up PATH for Xcode to find node and yarn
export PATH="/opt/homebrew/bin:/Users/wty92911/.npm-global/bin:$PATH"

# Execute the yarn tauri ios xcode-script command with all arguments passed through
yarn tauri ios xcode-script "$@"