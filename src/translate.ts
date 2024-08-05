import {
  RawTranscript,
  TranslateRequest,
  TranslateResponse,
  Translation,
} from "./types";

export async function translateTranscript(
  rawTranscripts: RawTranscript[]
): Promise<Translation[] | undefined> {
  const charLimit = 4000;

  // create batches of translate source
  const translateBatches: string[] = [];
  let translateBatch: string = "";
  rawTranscripts.forEach((transcript, index) => {
    if (translateBatch.length > charLimit || index == rawTranscripts.length-1) {
      translateBatches.push(translateBatch);
      translateBatch = "";
    }

    translateBatch += "\n\n" + transcript.text;
  });

  console.log("translateBatches.length", translateBatches.length);
  // call google translate api
  const translated = await translate(translateBatches, "vi", 400);

  if (!translated) {
    return;
  }

  console.log("response translate: ", translated);

  // map back from batch to transcript item
  const translatedSentence: string[] = [];
  translated.forEach((t) => {
    const sentences = t.text.split("\n\n");
    sentences.forEach((s: string) => {
      translatedSentence.push(s.trim());
    });
  });

  return rawTranscripts.map((transcript, index) => {
    const t: Translation = {
      start: transcript.start,
      duration: transcript.duration,
      text: transcript.text,
      translated: translatedSentence[index],
    };
    return t;
  });
}

export function chunkTranslation(
  translation: Translation[],
  size: number
): Translation[] {
  const result: Translation[] = [];

  for (let i = 0; i < translation.length; i += size) {
    const chunk = translation.slice(i, i + size);
    const mergedTranslation: Translation = {
      start: chunk[0].start,
      duration: null,
      text: chunk
        .map((t) => t.text)
        .filter((t): t is string => t !== null)
        .join(" "),
      translated: chunk
        .map((t) => t.translated)
        .filter((t): t is string => t !== null)
        .join(" "),
    };

    // Calculate the total duration of the chunk
    const firstStart = chunk[0].start;
    const lastTranslation = chunk[chunk.length - 1];
    const lastStart = lastTranslation.start;
    const lastDuration = lastTranslation.duration;

    if (firstStart !== null && lastStart !== null && lastDuration !== null) {
      const startTime = parseFloat(firstStart);
      const endTime = parseFloat(lastStart) + parseFloat(lastDuration);
      mergedTranslation.duration = (endTime - startTime).toFixed(3);
    }

    result.push(mergedTranslation);
  }

  return result;
}

async function translate(
  sources: string[],
  language: string,
  delayMilisecond: number
): Promise<TranslateResponse[] | undefined> {
  try {
    const results: TranslateResponse[] = [];

    for (const source of sources) {
      const msg: TranslateRequest = {
        action: "translate",
        language: language,
        text: source,
      };

      const result = await chrome.runtime.sendMessage(msg);
      results.push(result);

      // Add delay after each call, except for the last one
      if (source !== sources[sources.length - 1]) {
        await sleep(delayMilisecond);
      }
    }

    return results;
  } catch (error) {
    console.error("An error occurred", error);
    return undefined;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
