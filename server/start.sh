#!/bin/bash
# Start the MFA alignment backend server
# Requires: conda environment "mfa" with montreal-forced-aligner, fastapi, uvicorn, praatio

source /opt/homebrew/Caskroom/miniforge/base/etc/profile.d/conda.sh
conda activate mfa
cd "$(dirname "$0")"
uvicorn main:app --host 0.0.0.0 --port 8000
