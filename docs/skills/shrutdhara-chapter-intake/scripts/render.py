#!/usr/bin/env python3
"""Render ordered Piper sections or join supplied PCM WAVs into a narration MP3."""

import argparse
from array import array
from hashlib import file_digest, sha256
from importlib.metadata import version
import json
from pathlib import Path
import subprocess
import sys
from tempfile import TemporaryDirectory
import wave


def digest(path):
    with path.open('rb') as source:
        return file_digest(source, 'sha256').hexdigest()


def read_wav(path):
    with wave.open(str(path), 'rb') as source:
        if source.getnchannels() != 1 or source.getsampwidth() != 2:
            raise ValueError(f'{path.name}: expected mono 16-bit PCM WAV')
        rate = source.getframerate()
        if rate not in (16000, 22050, 24000, 32000, 44100, 48000):
            raise ValueError(f'{path.name}: unsupported sample rate {rate}')
        frames = source.getnframes()
        pcm = source.readframes(frames)
    if len(pcm) != frames * 2 or frames < rate // 4:
        raise ValueError(f'{path.name}: truncated or too short')
    samples = array('h', pcm)
    if sys.byteorder != 'little':
        samples.byteswap()
    if sum(sample * sample for sample in samples) < 80**2 * len(samples):
        raise ValueError(f'{path.name}: silent or too quiet')
    return rate, frames, pcm


def plan_sections(args):
    if not args.model:
        return [(path, path, digest(path)) for path in args.sections]

    config = args.model.with_suffix('.onnx.json')
    voice = {
        'model_sha256': digest(args.model),
        'config_sha256': digest(config),
        'piper': version('piper-tts'),
        'length_scale': args.length_scale,
        'sentence_silence': 0.22,
    }
    voice_key = json.dumps(voice, sort_keys=True).encode('utf-8')
    plan = []
    for path in args.sections:
        text = path.read_text(encoding='utf-8-sig').strip()
        if not text:
            raise ValueError(f'{path.name}: empty spoken text')
        spoken = text.encode('utf-8')
        key = sha256(voice_key + b'\0' + spoken).hexdigest()
        plan.append((path, args.cache / f'{key}.wav', sha256(spoken).hexdigest()))
    return plan


def render_section(source, cached, args):
    if cached.exists():
        try:
            return read_wav(cached)
        except (ValueError, wave.Error, EOFError):
            if not args.model:
                raise

    args.cache.mkdir(parents=True, exist_ok=True)
    with TemporaryDirectory(dir=args.cache) as folder:
        folder = Path(folder)
        text = folder / 'spoken.txt'
        wav = folder / 'speech.wav'
        text.write_text(source.read_text(encoding='utf-8-sig').strip() + '\n', encoding='utf-8')
        subprocess.run([
            sys.executable, '-m', 'piper', '-m', str(args.model), '-i', str(text),
            '-f', str(wav), '--sentence-silence', '0.22', '--length-scale', str(args.length_scale),
        ], check=True)
        validated = read_wav(wav)
        wav.replace(cached)
    return validated


def assemble(plan, args):
    import lameenc

    args.output.parent.mkdir(parents=True, exist_ok=True)
    with TemporaryDirectory(dir=args.output.parent) as folder:
        output = Path(folder) / 'narration.mp3'
        manifest = Path(folder) / 'narration.json'
        report = {'sections': []}
        elapsed_frames = 0
        encoder = None
        with output.open('wb') as audio:
            for source, cached, source_digest in plan:
                sample_rate, frames, pcm = render_section(source, cached, args)
                if encoder is None:
                    rate = sample_rate
                    encoder = lameenc.Encoder()
                    encoder.set_in_sample_rate(rate)
                    encoder.set_channels(1)
                    encoder.set_bit_rate(64)
                    encoder.set_quality(2)
                else:
                    if sample_rate != rate:
                        raise ValueError(f'{source.name}: expected {rate} Hz, got {sample_rate} Hz')
                    gap_frames = round(args.gap * rate)
                    audio.write(encoder.encode(b'\0\0' * gap_frames))
                    elapsed_frames += gap_frames
                report['sections'].append({
                    'input': source.name,
                    'input_sha256': source_digest,
                    'wav_sha256': digest(cached),
                    'start_s': round(elapsed_frames / rate, 3),
                    'duration_s': round(frames / rate, 3),
                })
                audio.write(encoder.encode(pcm))
                elapsed_frames += frames
            audio.write(encoder.flush())
        report.update({
            'audio': args.output.name,
            'duration_s': round(elapsed_frames / rate, 3),
            'sha256': digest(output),
            'bytes': output.stat().st_size,
        })
        manifest.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        output.replace(args.output)
        manifest.replace(args.output.with_suffix('.mp3.json'))
    print(f"{args.output.name}: {report['duration_s']:.1f}s, {report['bytes']:,} bytes")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('sections', nargs='+', type=Path, help='ordered .txt (Piper mode) or .wav files')
    parser.add_argument('--output', required=True, type=Path, help='destination .mp3 path')
    parser.add_argument('--model', type=Path, help='local Piper .onnx with adjacent .onnx.json')
    parser.add_argument('--cache', type=Path, help='Piper section cache directory')
    parser.add_argument('--length-scale', type=float, default=1.06)
    parser.add_argument('--gap', type=float, default=1.2, help='silence in seconds between sections')
    parser.add_argument('--plan', action='store_true', help='list inputs and cache files without rendering')
    args = parser.parse_args()

    expected = '.txt' if args.model else '.wav'
    if any(section.suffix.lower() != expected or not section.is_file() for section in args.sections):
        parser.error(f'all sections must be existing {expected} files')
    if args.output.suffix != '.mp3' or not (0.5 <= args.length_scale <= 2 and 0 <= args.gap <= 5):
        parser.error('use an .mp3 destination, length scale 0.5–2, and gap 0–5 seconds')
    args.cache = args.cache or args.output.parent / '.tts-cache'

    try:
        plan = plan_sections(args)
        if args.plan:
            for source, cached, _ in plan:
                status = ('cache present' if cached.exists() else 'render') if args.model else 'supplied WAV'
                print(f'{source.name}: {status}')
        else:
            assemble(plan, args)
    except (OSError, ValueError, EOFError, wave.Error, ImportError, subprocess.CalledProcessError) as error:
        parser.exit(1, f'Could not prepare narration: {error}\n')


if __name__ == '__main__':
    main()
