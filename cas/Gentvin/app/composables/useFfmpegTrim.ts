import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg'

let _ffmpeg: any | null = null

async function getFF() {
  if (_ffmpeg) return _ffmpeg
  const ffmpeg = createFFmpeg({ log: false })
  await ffmpeg.load()
  _ffmpeg = ffmpeg
  return ffmpeg
}

function pickExtByMime(mime: string, fallback: string) {
  if (mime.includes('mp4')) return 'mp4'
  if (mime.includes('webm')) return 'webm'
  if (mime.includes('ogg')) return 'ogg'
  if (mime.includes('mpeg')) return 'mp3'
  if (mime.includes('wav')) return 'wav'
  return fallback
}

export function useFfmpegTrim() {
  async function trim(file: File, startSec: number, durationSec: number, kind: 'video' | 'audio'): Promise<Blob> {
    const ff = await getFF()
    const inExt = pickExtByMime(file.type || '', kind === 'video' ? 'mp4' : 'mp3')
    const outExt = inExt // пытаемся сохранить контейнер
    const inName = input.${inExt}
    const outName = out.${outExt}
    ff.FS('writeFile', inName, await fetchFile(file))

// 1) Быстрый режим: без перекодирования (c copy). Может не сработать, если начало не на ключевом кадре.
try {
  await ff.run(
    '-ss', String(Math.max(0, startSec)),
    '-i', inName,
    '-t', String(Math.max(0.1, durationSec)),
    '-c', 'copy',
    '-movflags', 'faststart',
    outName
  )
} catch {
  // 2) Fallback: перекодирование (универсальнее, но медленнее)
  // Для видео используем mpeg4/aac, для аудио — aac/mp3 (в зависимости от доступных кодеков).
  const args = kind === 'video'
    ? [
        '-ss', String(Math.max(0, startSec)),
        '-i', inName,
        '-t', String(Math.max(0.1, durationSec)),
        '-vf', 'format=yuv420p',
        '-c:v', 'mpeg4',
        '-qscale:v', '5',
        '-c:a', 'aac',
        '-b:a', '128k',
        outName
      ]
    : [
        '-ss', String(Math.max(0, startSec)),
        '-i', inName,
        '-t', String(Math.max(0.1, durationSec)),
        '-c:a', 'aac',
        '-b:a', '128k',
        outName
      ]
  await ff.run(...args)
}

const data = ff.FS('readFile', outName)
ff.FS('unlink', inName)
ff.FS('unlink', outName)
const mime = kind === 'video' ? 'video/mp4' : (file.type || 'audio/mpeg')
return new Blob([data.buffer], { type: mime })
  
}

return { trim }
}