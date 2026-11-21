import { mkdir, readFile, writeFile, cp } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
await mkdir(path.join(root, 'public/audio/fixture-v1'), { recursive: true });
await mkdir(path.join(root, 'public/content/fixture-v1'), { recursive: true });
await cp(path.join(root, '../prototype/fonts'), path.join(root, 'public/fonts'), {
  recursive: true,
});
await cp(path.join(root, '../prototype/styles.css'), path.join(root, 'src/prototype-tokens.css'));

// Rasterize the existing arch/leaf mark without a platform graphics dependency.
await mkdir(path.join(root, 'public/icons'), { recursive: true });
function pngChunk(type, data) {
  const body = Buffer.concat([Buffer.from(type), data]);
  let crc = 0xffffffff;
  for (const byte of body) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  const header = Buffer.alloc(4);
  header.writeUInt32BE(data.length);
  const tail = Buffer.alloc(4);
  tail.writeUInt32BE((crc ^ 0xffffffff) >>> 0);
  return Buffer.concat([header, body, tail]);
}
for (const size of [192, 512]) {
  const rows = Buffer.alloc(size * (size * 3 + 1));
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const px = x / size,
        py = y / size;
      const radius = Math.hypot(px - 0.5, py - 0.42);
      const arch =
        py < 0.42
          ? Math.abs(radius - 0.27) < 0.009
          : py < 0.78 && Math.abs(Math.abs(px - 0.5) - 0.27) < 0.009;
      const stem = Math.abs(px - 0.5) < 0.008 && py > 0.43 && py < 0.74;
      const left = ((px - 0.425) / 0.085) ** 2 + ((py - 0.565) / 0.055) ** 2 < 1;
      const right = ((px - 0.575) / 0.085) ** 2 + ((py - 0.505) / 0.055) ** 2 < 1;
      const offset = y * (size * 3 + 1) + 1 + x * 3;
      Buffer.from(arch || stem || left || right ? [75, 89, 63] : [247, 246, 240]).copy(
        rows,
        offset,
      );
    }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size);
  header.writeUInt32BE(size, 4);
  header[8] = 8;
  header[9] = 2;
  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', header),
    pngChunk('IDAT', deflateSync(rows)),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
  await writeFile(path.join(root, `public/icons/icon-${size}.png`), png);
}

// Deterministic, originally authored PCM calibration: two 15-minute parts.
// These tones verify real audio transport, not speech or scripture quality.
const sampleRate = 8000;
const duration = 900;
const assets = [];
for (let part = 0; part < 2; part++) {
  const dataBytes = sampleRate * duration * 2;
  const wav = Buffer.alloc(44 + dataBytes);
  wav.write('RIFF', 0);
  wav.writeUInt32LE(36 + dataBytes, 4);
  wav.write('WAVEfmt ', 8);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(sampleRate, 24);
  wav.writeUInt32LE(sampleRate * 2, 28);
  wav.writeUInt16LE(2, 32);
  wav.writeUInt16LE(16, 34);
  wav.write('data', 36);
  wav.writeUInt32LE(dataBytes, 40);
  for (let sample = 0; sample < sampleRate * duration; sample++) {
    const seconds = sample / sampleRate;
    const pulseTime = seconds % 5;
    const marker = Math.floor(seconds / 60) % 3;
    const frequency = (part === 0 ? 330 : 440) + marker * 110;
    const envelope = pulseTime < 1.6 ? Math.min(pulseTime * 15, 1, (1.6 - pulseTime) * 15) : 0;
    const value = Math.round(Math.sin(2 * Math.PI * frequency * seconds) * envelope * 5000);
    wav.writeInt16LE(value, 44 + sample * 2);
  }
  const name = `calibration-part-${part + 1}.wav`;
  const output = path.join(root, 'public/audio/fixture-v1', name);
  const sha256 = createHash('sha256').update(wav).digest('hex');
  let current;
  try {
    current = createHash('sha256')
      .update(await readFile(output))
      .digest('hex');
  } catch {}
  if (current !== sha256) await writeFile(output, wav);
  assets.push({
    id: `fixture:calibration:part-${part + 1}`,
    url: `/audio/fixture-v1/${name}`,
    bytes: wav.length,
    sha256,
    duration,
  });
}

const chapter = {
  id: 'fixture:reflection',
  revision: 'fixture-v1',
  status: 'interface-fixture',
  title: 'ठहरें, पढ़ें, मनन करें।',
  audio: assets,
  passages: [
    {
      id: 'fixture:reflection:1',
      reference: 'DEMO-1',
      title: 'ठहरकर देखना',
      meaning:
        'किसी परिचित रास्ते पर चलते हुए हम अक्सर आसपास की छोटी बातों पर ध्यान नहीं देते। एक क्षण ठहरकर देखना, अपने अनुभव को अधिक स्पष्टता से समझने की शुरुआत हो सकता है।',
    },
    {
      id: 'fixture:reflection:2',
      reference: 'DEMO-2',
      title: 'ध्यान से सुनना',
      meaning:
        'जब कोई अपनी बात कह रहा हो, तो उत्तर सोचने से पहले उसकी पूरी बात सुनने का अभ्यास करें। सुनने के लिए समय देना, समझने के लिए जगह बनाना है।',
    },
    {
      id: 'fixture:reflection:3',
      reference: 'DEMO-3',
      title: 'विचार से व्यवहार तक',
      meaning:
        'किसी विचार को समझ लेना और उसे अपने व्यवहार में उतारना अलग अनुभव हैं। दिन की एक छोटी घटना पर लौटकर देखें: आपने क्या देखा, कैसे प्रतिक्रिया दी, और अगली बार क्या बदलना चाहेंगे?',
    },
  ].map((passage, index) => ({
    ...passage,
    paragraphs: [
      'पढ़ने का यह स्थान आपको एक विचार के साथ कुछ समय बिताने देता है। जल्दी आगे बढ़ना आवश्यक नहीं है। चाहें तो पाठ दोबारा पढ़ें या अपनी सुविधा से अगले अंश पर जाएँ।',
      'लंबा अंश पढ़ते समय इसी पृष्ठ में नीचे स्क्रॉल करें। अगला अंश अपने आप नहीं खुलेगा। बड़े अक्षरों और अलग font में भी पूरा लेखन पढ़ा जा सकता है।',
      ...(index === 2
        ? [
            'एक शांत जगह पर बैठकर अपने दिन की किसी छोटी घटना को याद करें। उसे समझने के लिए अपने आप को समय दें। यह अनुच्छेद केवल लंबे पाठ और स्थानीय reading position का परीक्षण करने के लिए है।',
            'यह नमूना किसी जैन आगम का अनुवाद या व्याख्या नहीं है। वास्तविक सामग्री में मूल पाठ, अर्थ, व्याख्या, प्रामाणिक संदर्भ और स्रोत की समीक्षा अलग-अलग दिखाई जाएगी।',
          ]
        : []),
    ],
  })),
};
await writeFile(
  path.join(root, 'public/content/fixture-v1/chapter.json'),
  JSON.stringify(chapter, null, 2),
);
console.log(
  'Prepared local fonts, reader fixture and 30 minutes of deterministic calibration audio.',
);
