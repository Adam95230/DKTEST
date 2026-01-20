export interface LyricLine {
  time: number; // Time in seconds
  text: string;
}

/**
 * Parse LRC format lyrics
 * Format: [mm:ss.xx] or [mm:ss] text
 * Also handles plain text (non-synchronized lyrics)
 */
export function parseLRC(lrcText: string): LyricLine[] {
  const lines: LyricLine[] = [];
  const timeRegex = /\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]/g;

  // Check if text contains LRC time tags
  const hasTimeTags = timeRegex.test(lrcText);
  timeRegex.lastIndex = 0; // Reset regex

  if (!hasTimeTags) {
    // Plain text lyrics - display all at once (time 0)
    const textLines = lrcText.split('\n').filter((line) => line.trim());
    textLines.forEach((text) => {
      lines.push({ time: 0, text: text.trim() });
    });
    return lines;
  }

  // Parse LRC format
  const textLines = lrcText.split('\n');

  for (const line of textLines) {
    const matches = Array.from(line.matchAll(timeRegex));
    const text = line.replace(timeRegex, '').trim();

    if (matches.length > 0 && text) {
      for (const match of matches) {
        const minutes = parseInt(match[1], 10);
        const seconds = parseInt(match[2], 10);
        const milliseconds = match[3] ? parseInt(match[3].padEnd(3, '0'), 10) : 0;

        const timeInSeconds = minutes * 60 + seconds + milliseconds / 1000;
        lines.push({ time: timeInSeconds, text });
      }
    }
  }

  // Sort by time
  lines.sort((a, b) => a.time - b.time);

  return lines;
}

/**
 * Get the current lyric line index based on current time
 */
export function getCurrentLyricIndex(lyrics: LyricLine[], currentTime: number): number {
  for (let i = lyrics.length - 1; i >= 0; i--) {
    if (currentTime >= lyrics[i].time) {
      return i;
    }
  }
  return -1;
}

