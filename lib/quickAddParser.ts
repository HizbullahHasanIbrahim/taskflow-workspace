import { TaskPriority } from "@prisma/client";

export interface ParsedQuickAdd {
  title: string;
  dueDate: Date | null;
  priority: TaskPriority | null;
  tagNames: string[];
}

/**
 * Parser NLP untuk Quick-Add berbasis string tunggal
 * Mendukung: tanggal (hari ini, besok, lusa, nama hari, dd/mm), prioritas (!urgent, !high, !medium, !low), dan tag (#tag)
 */
export function parseQuickAdd(raw: string, referenceDate: Date = new Date()): ParsedQuickAdd {
  let title = raw;
  let dueDate: Date | null = null;
  let priority: TaskPriority | null = null;
  const tagNames: string[] = [];

  // 1. Parse Tags (#tag)
  const tagRegex = /#([a-zA-Z0-9\-_]+)/g;
  let match: RegExpExecArray | null;
  while ((match = tagRegex.exec(raw)) !== null) {
    tagNames.push(match[1].toLowerCase());
    title = title.replace(match[0], "");
  }

  // 2. Parse Priority (!urgent, !tinggi, !high, !sedang, !medium, !rendah, !low)
  const prioMap: Record<string, TaskPriority> = {
    "!urgent": TaskPriority.URGENT,
    "!mendesak": TaskPriority.URGENT,
    "!high": TaskPriority.HIGH,
    "!tinggi": TaskPriority.HIGH,
    "!medium": TaskPriority.MEDIUM,
    "!sedang": TaskPriority.MEDIUM,
    "!low": TaskPriority.LOW,
    "!rendah": TaskPriority.LOW,
  };

  const words = title.split(/\s+/);
  const cleanWords: string[] = [];

  for (const word of words) {
    const lower = word.toLowerCase();
    if (prioMap[lower]) {
      priority = prioMap[lower];
    } else {
      cleanWords.push(word);
    }
  }

  title = cleanWords.join(" ");

  // 3. Parse Due Dates (hari ini, besok, lusa, senin-minggu, dd/mm)
  const lowerTitle = title.toLowerCase();
  const ref = new Date(referenceDate);
  ref.setHours(0, 0, 0, 0);

  if (lowerTitle.includes("hari ini") || lowerTitle.includes("today")) {
    dueDate = ref;
    title = title.replace(/hari ini|today/gi, "");
  } else if (lowerTitle.includes("besok") || lowerTitle.includes("tomorrow")) {
    const d = new Date(ref);
    d.setDate(d.getDate() + 1);
    dueDate = d;
    title = title.replace(/besok|tomorrow/gi, "");
  } else if (lowerTitle.includes("lusa")) {
    const d = new Date(ref);
    d.setDate(d.getDate() + 2);
    dueDate = d;
    title = title.replace(/lusa/gi, "");
  } else {
    // Cek nama hari (senin, selasa, rabu, kamis, jumat, sabtu, minggu)
    const days = ["minggu", "senin", "selasa", "rabu", "kamis", "jumat", "sabtu"];
    let foundDayIndex = -1;
    for (let i = 0; i < days.length; i++) {
      if (lowerTitle.includes(days[i])) {
        foundDayIndex = i;
        title = title.replace(new RegExp(days[i], "gi"), "");
        break;
      }
    }

    if (foundDayIndex !== -1) {
      const currentDay = ref.getDay();
      let diff = foundDayIndex - currentDay;
      if (diff <= 0) diff += 7;
      const d = new Date(ref);
      d.setDate(d.getDate() + diff);
      dueDate = d;
    } else {
      // Cek format dd/mm atau d/m
      const dateMatch = title.match(/\b(\d{1,2})\/(\d{1,2})\b/);
      if (dateMatch) {
        const day = parseInt(dateMatch[1], 10);
        const month = parseInt(dateMatch[2], 10) - 1;
        const year = ref.getFullYear();
        const d = new Date(year, month, day);
        if (!isNaN(d.getTime())) {
          dueDate = d;
          title = title.replace(dateMatch[0], "");
        }
      }
    }
  }

  return {
    title: title.replace(/\s+/g, " ").trim(),
    dueDate,
    priority,
    tagNames: Array.from(new Set(tagNames)),
  };
}
