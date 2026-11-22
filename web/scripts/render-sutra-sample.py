"""Render the bounded first-uddeshaka review sample; never synthesize missing meanings."""
from pathlib import Path
import argparse
import hashlib
import json
import wave
import lameenc
from piper import PiperVoice


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--model', required=True, type=Path)
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    study = json.loads((root / 'public/content/shastraparijna-v2/study.json').read_text(encoding='utf-8'))
    output = root / 'public/narration/meaning-v1'
    output.mkdir(parents=True, exist_ok=True)
    work = root.parent / '.audio-work/sample'
    work.mkdir(parents=True, exist_ok=True)
    voice = PiperVoice.load(str(args.model))
    parts = []
    transcript = []
    for index, meaning in enumerate(study['meanings']):
        reference = meaning['reference']
        book, section, number = reference.split('.')
        if section != '1':
            raise ValueError('This renderer is limited to the first uddeshaka review sample.')
        spoken = f'प्रथम उद्देशक। सूत्र {number}। {meaning["text"]}'
        if index == 0:
            spoken = 'यह कृत्रिम आवाज़ में हिन्दी अर्थ की समीक्षा प्रति है। ' + spoken
        wav_path = work / f'u{section}-s{number}.wav'
        with wave.open(str(wav_path), 'wb') as wav_file:
            voice.synthesize_wav(spoken, wav_file)
        with wave.open(str(wav_path), 'rb') as wav_file:
            rate = wav_file.getframerate()
            frames = wav_file.getnframes()
            pcm = wav_file.readframes(frames)
        encoder = lameenc.Encoder()
        encoder.set_in_sample_rate(rate)
        encoder.set_channels(1)
        encoder.set_bit_rate(64)
        encoder.set_quality(2)
        audio = bytes(encoder.encode(pcm)) + bytes(encoder.flush())
        name = f'u{section}-s{number}.mp3'
        (output / name).write_bytes(audio)
        parts.append({
            'id': f'{study["id"]}:{section}:{number}',
            'url': f'/narration/meaning-v1/{name}',
            'duration': frames / rate,
            'bytes': len(audio),
            'sha256': hashlib.sha256(audio).hexdigest(),
        })
        transcript.append(f'{reference}\n{spoken}')
        print(f'{reference}: {frames / rate:.1f}s', flush=True)
    (output / 'manifest.json').write_text(json.dumps({
        'recordingId': 'shastraparijna:hindi-meaning:sample-v1',
        'status': 'draft-review-sample',
        'sourceRevision': study['revision'],
        'voiceModelSha256': hashlib.sha256(args.model.read_bytes()).hexdigest(),
        'parts': parts,
    }, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    (output / 'transcript.txt').write_text('\n\n'.join(transcript) + '\n', encoding='utf-8')


if __name__ == '__main__':
    main()
