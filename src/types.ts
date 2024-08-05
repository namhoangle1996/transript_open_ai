export interface OpenTabMessage {
  action: string;
  url: string;
  title: string;
  transcript: string;
  prompt: string;
}

export interface InjectTranscriptMessage {
  action: string;
  title: string;
  transcript: string;
  prompt: string;
}

export interface TranslateRequest {
  action: string;
  language: string;
  text: string;
}

export interface TranslateResponse {
  text: string;
}

export interface RawTranscript {
  start: string | null;
  duration: string | null;
  text: string | null;
}

export interface Translation {
  start: string | null;
  duration: string | null;
  text: string | null;
  translated: string | null;
}

export interface LanguageOption {
  language: string;
  link: string;
}

export interface CaptionTrack {
  name: {
    simpleText: string;
  };
  baseUrl: string;
}

export interface TimeChange {
  time: number;
}

export interface YTTimeCurrentChangeEvent extends CustomEvent {
  detail: TimeChange;
}