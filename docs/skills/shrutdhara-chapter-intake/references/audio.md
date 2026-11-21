# Low-cost Hindi audio production

## Audition and choose

Use the same 20–40 seconds across candidates. Include a normal sentence, a list, and several words likely to be mispronounced. Use one consistent speaker, short paragraph pauses, and modest pacing. Score fidelity and pronunciation before naturalness. Keep the current acceptable voice when an alternative adds little. Fix the speakable Hindi or punctuation first if a voice consistently mishandles a word, while preserving the published reading text. Retain the actual spoken wording in the transcript.

The Pratham Piper Hindi voice shipped for the noncommercial शस्त्रपरिज्ञा review copy. It is a candidate for a no-per-character-cost local render, not an automatic quality or licensing approval for every chapter. The [Pratham card](https://huggingface.co/rhasspy/piper-voices/blob/1af0d6b/hi/hi_IN/pratham/medium/MODEL_CARD) identifies CC BY-NC-SA training material. Preserve credits and restrictions when applicable. Rohan was used for a prior local draft, but its card identifies a Lessac base with additional terms. Do not infer permitted use from the Hindi training dataset alone. Check current primary model and provider sources before adopting a new voice.

For a different local or hosted voice, audition with the same script. Check output use and downloads, unit pricing, any limits on voice use, and whether sending the script is appropriate. Compare a paid option only if the local candidate fails the listened quality bar. Avoid per-user synthesis. Generate static audio once and reuse it.

## Render a sample and full chapter

Use an ordered list of UTF-8 `.txt` files, one per section, with only speakable text. Put the spoken synthetic voice disclosure in the first section. Keep source numbers, stage directions, citations, and internal review notes in the coverage ledger unless intended to be spoken. Use the established voice's official Piper model and adjacent `.onnx.json`, pinned to a known revision. Reuse existing model and dependency caches. Install official packages in an isolated environment if absent. The renderer never downloads assets, calls a provider, or publishes.

```sh
# With Python, Piper and lameenc installed in the same environment:
python scripts/render.py --model hi_IN-pratham-medium.onnx --output audition.mp3 sample.txt
python scripts/render.py --model hi_IN-pratham-medium.onnx --output chapter-hi-v1.mp3 01.txt 02.txt 03.txt
# Plan the latter command without synthesis by adding --plan.
# Assemble checked, compatible WAVs from a different renderer without --model:
python scripts/render.py --output chapter-hi-v1.mp3 01.wav 02.wav 03.wav
```

Resolve the script path relative to the skill folder. Piper mode caches WAVs by spoken text, model/config bytes, installed Piper version and render settings. `--cache` can point several chapters at one working cache. A single section edit invalidates only that section. The adjacent `.mp3.json` records order, start/duration, input digests, and MP3 digest. Inspect it before curating public credits or timestamps. The renderer rejects silent, malformed, or mismatched audio and assembles MP3 using one encoder. Check the actual spoken duration and listen to the accepted recording. For an app release package, include only the intended public files and avoid uploading the cache, model weights, or this internal report.
