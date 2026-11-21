#!/usr/bin/env python3
"""Cut the Shastraparijna review narration into one file per uddeshaka and write its manifest.

Boundaries are the six ~1.4 s pauses between sections found with ffmpeg silencedetect
(-40 dB, 0.45 s). Re-run only when the source recording changes; check boundaries by ear.
Usage: python3 scripts/split-narration.py   (from web/)
"""
import hashlib, json, re, subprocess
from pathlib import Path

root = Path(__file__).resolve().parent.parent / 'public' / 'narration'
src = root / 'shastraparijna-hi-v1.mp3'
out = root / 'shastraparijna'
out.mkdir(exist_ok=True)

# midpoints of the six section pauses (seconds)
cuts = [117.95, 205.70, 286.60, 358.50, 428.50, 537.60]

lines = (root / 'shastraparijna-hi-v1.txt').read_text(encoding='utf8').split('\n')
sections, cur = [], None
for line in lines:
    m = re.match(r'^([१-७]) · (.+?) \((1\.\d\.\d–\d)\)\s*$', line)
    if m:
        cur = {'title': m.group(2), 'reference': m.group(3), 'paragraphs': []}
        sections.append(cur)
    elif cur is not None and line.strip():
        cur['paragraphs'].append(line.strip())
assert len(sections) == 7, len(sections)

bounds = [0.0] + cuts + [None]
parts = []
for i, sec in enumerate(sections):
    name = f's{i + 1}.mp3'
    cmd = ['ffmpeg', '-y', '-v', 'error', '-i', str(src), '-ss', str(bounds[i])]
    if bounds[i + 1] is not None:
        cmd += ['-to', str(bounds[i + 1])]
    subprocess.run(cmd + ['-c:a', 'libmp3lame', '-b:a', '64k', '-ar', '22050', '-ac', '1', str(out / name)], check=True)
    data = (out / name).read_bytes()
    dur = float(subprocess.check_output(
        ['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(out / name)]))
    parts.append({
        'id': f'shastraparijna:hi:v1:{i + 1}',
        'url': f'/narration/shastraparijna/{name}',
        'bytes': len(data),
        'sha256': hashlib.sha256(data).hexdigest(),
        'duration': round(dur, 2),
        **sec,
    })

manifest = {
    'id': 'shastraparijna',
    'revision': 'hi-v1-review',
    'title': 'शस्त्रपरिज्ञा',
    'status': 'ai-voice-review-copy',
    'recordingId': 'shastraparijna:hi:v1',
    'parts': parts,
}
(out / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf8')
print(sum(p['bytes'] for p in parts), 'bytes;', round(sum(p['duration'] for p in parts), 1), 's')
