import $ from "jquery";
import { CaptionTrack, LanguageOption, RawTranscript, TranslateRequest, TranslateResponse, Translation } from "./types";

// Transcript processing ultilities are from: https://github.com/kazuki-sf/YouTube_Summary_with_ChatGPT

export function getTranscript(transcripts: RawTranscript[]): string {
  return transcripts.map((item) => item.text).join(" ");
}

export async function getRawTranscript(link: string): Promise<RawTranscript[]> {
  // Get Transcript
  const transcriptPageResponse = await fetch(link);
  const transcriptPageXml = await transcriptPageResponse.text();

  // Parse Transcript
  const jQueryParse = $.parseHTML(transcriptPageXml);
  const textNodes = jQueryParse[1].childNodes;

  return Array.from(textNodes).map((i: any) => {
    console.log(
      `start: ${i.getAttribute("start")}, dur: ${i.getAttribute(
        "dur"
      )}, text: ${i.textContent.replace(/&#39;/g, "'")}`
    );
    return {
      start: i.getAttribute("start"),
      duration: i.getAttribute("dur"),
      text: i.textContent.replace(/&#39;/g, "'"),
    };
  });
}

export async function getLangOptionsWithLink(
  videoId: string
): Promise<LanguageOption[] | undefined> {
  // Get a transcript URL
  const videoPageResponse = await fetch(
    "https://www.youtube.com/watch?v=" + videoId
  );
  const videoPageHtml = await videoPageResponse.text();
  const splittedHtml = videoPageHtml.split('"captions":');

  if (splittedHtml.length < 2) {
    return undefined; // No Caption Available
  }

  const captions_json = JSON.parse(
    splittedHtml[1].split(',"videoDetails')[0].replace("\n", "")
  );
  const captionTracks: CaptionTrack[] =
    captions_json.playerCaptionsTracklistRenderer.captionTracks;
  const languageOptions = captionTracks.map((i) => i.name.simpleText);
  
  const first = "English"; // Sort by English first
  languageOptions.sort((x, y) => {
    return x.includes(first) ? -1 : y.includes(first) ? 1 : 0;
  });
  languageOptions.sort((x, y) => {
    return x === first ? -1 : y === first ? 1 : 0;
  });

  return languageOptions.map((langName) => {
    const link = captionTracks.find(
      (i) => i.name.simpleText === langName
    )?.baseUrl;
    return {
      language: langName,
      link: link || "",
    };
  });
}

export function getSearchParam(str?: string): Record<string, string> {
  const searchParam = str && str !== "" ? str : window.location.search;

  if (!/\?([a-zA-Z0-9_]+)/i.exec(searchParam)) return {};
  let match: RegExpExecArray | null,
    pl = /\+/g, // Regex for replacing addition symbol with a space
    search = /([^?&=]+)=?([^&]*)/g,
    decode = function (s: string) {
      return decodeURIComponent(s.replace(pl, " "));
    },
    index =
      (/\?([a-zA-Z0-9_]+)/i.exec(searchParam) as RegExpExecArray)["index"] + 1,
    query = searchParam.substring(index);

  let urlParams: Record<string, string> = {};
  while ((match = search.exec(query))) {
    urlParams[decode(match[1])] = decode(match[2]);
  }
  return urlParams;
}
