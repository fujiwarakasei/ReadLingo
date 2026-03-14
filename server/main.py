"""
MFA forced-alignment backend for ReadLingo.
Accepts WAV audio + text, returns word-level timestamps.
"""

import base64
import os
import subprocess
import tempfile

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from praatio import textgrid
from pydantic import BaseModel

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class AlignRequest(BaseModel):
    audio_base64: str  # WAV file encoded as base64
    text: str


class WordTiming(BaseModel):
    word: str
    start: float
    end: float


@app.post("/api/align")
async def align(req: AlignRequest):
    with tempfile.TemporaryDirectory() as tmpdir:
        # Decode and write WAV file
        wav_path = os.path.join(tmpdir, "utterance.wav")
        with open(wav_path, "wb") as f:
            f.write(base64.b64decode(req.audio_base64))

        # Resample to 16kHz mono (MFA requirement)
        resampled_path = os.path.join(tmpdir, "resampled.wav")
        resample = subprocess.run(
            ["ffmpeg", "-y", "-i", wav_path, "-ar", "16000", "-ac", "1", resampled_path],
            capture_output=True,
        )
        if resample.returncode != 0:
            return {"error": f"ffmpeg resample failed: {resample.stderr.decode()}", "words": []}
        os.replace(resampled_path, wav_path)

        # Write transcript (.lab file)
        lab_path = os.path.join(tmpdir, "utterance.lab")
        with open(lab_path, "w") as f:
            f.write(req.text)

        # Run MFA alignment
        output_dir = os.path.join(tmpdir, "output")
        os.makedirs(output_dir)

        result = subprocess.run(
            [
                "mfa", "align",
                tmpdir,
                "english_mfa",
                "english_mfa",
                output_dir,
                "--clean",
                "--single_speaker",
            ],
            capture_output=True,
            text=True,
        )

        if result.returncode != 0:
            return {"error": result.stderr, "words": []}

        # Parse TextGrid output
        tg_path = os.path.join(output_dir, "utterance.TextGrid")
        if not os.path.exists(tg_path):
            return {"error": "TextGrid not generated", "words": []}

        tg = textgrid.openTextgrid(tg_path, includeEmptyIntervals=False)
        word_tier = tg.getTier("words")

        words = []
        for interval in word_tier.entries:
            if interval.label and interval.label.strip():
                words.append(
                    WordTiming(
                        word=interval.label,
                        start=round(interval.start, 3),
                        end=round(interval.end, 3),
                    )
                )

        return {"words": [w.model_dump() for w in words]}
