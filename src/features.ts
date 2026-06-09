import { YAMLWriter } from "./serializer";

interface FileUploadImage {
  enabled: boolean;
  number_limits: number;
  transfer_methods: string[];
}

interface FileUploadConfig {
  audio_file_size_limit: number;
  batch_count_limit: number;
  file_size_limit: number;
  image_file_batch_limit: number;
  image_file_size_limit: number;
  single_chunk_attachment_limit: number;
  video_file_size_limit: number;
  workflow_file_upload_limit: number;
}

interface FileUpload {
  allowed_file_extensions: string[];
  allowed_file_types: string[];
  allowed_file_upload_methods: string[];
  enabled: boolean;
  fileUploadConfig: FileUploadConfig;
  image: FileUploadImage;
  number_limits: number;
}

interface RetrieverResource {
  enabled: boolean;
}

interface SensitiveWordConfig {
  enabled: boolean;
}

interface SpeechToTextConfig {
  enabled: boolean;
}

interface SuggestedAfterAnswer {
  enabled: boolean;
}

interface TextToSpeechConfig {
  enabled: boolean;
  language: string;
  voice: string;
}

export interface FeaturesConfig {
  file_upload: FileUpload;
  opening_statement: string;
  retriever_resource: RetrieverResource;
  sensitive_word_avoidance: SensitiveWordConfig;
  speech_to_text: SpeechToTextConfig;
  suggested_questions: string[];
  suggested_questions_after_answer: SuggestedAfterAnswer;
  text_to_speech: TextToSpeechConfig;
}

export class Features {
  private _config: FeaturesConfig;

  constructor(config?: Partial<FeaturesConfig>) {
    this._config = {
      file_upload: config?.file_upload ?? {
        allowed_file_extensions: [],
        allowed_file_types: [],
        allowed_file_upload_methods: [],
        enabled: false,
        fileUploadConfig: {
          audio_file_size_limit: 50, batch_count_limit: 5, file_size_limit: 15,
          image_file_batch_limit: 10, image_file_size_limit: 10,
          single_chunk_attachment_limit: 10, video_file_size_limit: 100,
          workflow_file_upload_limit: 10,
        },
        image: { enabled: false, number_limits: 3, transfer_methods: [] },
        number_limits: 3,
      },
      opening_statement: config?.opening_statement ?? "",
      retriever_resource: config?.retriever_resource ?? { enabled: false },
      sensitive_word_avoidance: config?.sensitive_word_avoidance ?? { enabled: false },
      speech_to_text: config?.speech_to_text ?? { enabled: false },
      suggested_questions: config?.suggested_questions ?? [],
      suggested_questions_after_answer: config?.suggested_questions_after_answer ?? { enabled: false },
      text_to_speech: config?.text_to_speech ?? { enabled: false, language: "", voice: "" },
    };
  }

  // --- file_upload ---
  getFileUploadEnabled(): boolean { return this._config.file_upload.enabled; }
  setFileUploadEnabled(v: boolean): this { this._config.file_upload.enabled = v; return this; }
  getFileUploadExtensions(): string[] { return this._config.file_upload.allowed_file_extensions; }
  setFileUploadExtensions(exts: string[]): this { this._config.file_upload.allowed_file_extensions = exts; return this; }
  getFileUploadTypes(): string[] { return this._config.file_upload.allowed_file_types; }
  setFileUploadTypes(types: string[]): this { this._config.file_upload.allowed_file_types = types; return this; }
  getFileUploadMethods(): string[] { return this._config.file_upload.allowed_file_upload_methods; }
  setFileUploadMethods(methods: string[]): this { this._config.file_upload.allowed_file_upload_methods = methods; return this; }
  getFileUploadLimits(): number { return this._config.file_upload.number_limits; }
  setFileUploadLimits(n: number): this { this._config.file_upload.number_limits = n; return this; }
  getFileUploadImageEnabled(): boolean { return this._config.file_upload.image.enabled; }
  setFileUploadImageEnabled(v: boolean): this { this._config.file_upload.image.enabled = v; return this; }
  getFileUploadImageLimits(): number { return this._config.file_upload.image.number_limits; }
  setFileUploadImageLimits(n: number): this { this._config.file_upload.image.number_limits = n; return this; }
  getFileUploadImageMethods(): string[] { return this._config.file_upload.image.transfer_methods; }
  setFileUploadImageMethods(m: string[]): this { this._config.file_upload.image.transfer_methods = m; return this; }
  getFileUploadConfig(): FileUploadConfig { return this._config.file_upload.fileUploadConfig; }
  setFileUploadConfigItem(key: string, value: number): this {
    (this._config.file_upload.fileUploadConfig as any)[key] = value;
    return this;
  }

  // --- opening_statement ---
  getOpeningStatement(): string { return this._config.opening_statement; }
  setOpeningStatement(text: string): this { this._config.opening_statement = text; return this; }

  // --- retriever_resource ---
  getRetrieverEnabled(): boolean { return this._config.retriever_resource.enabled; }
  setRetrieverEnabled(v: boolean): this { this._config.retriever_resource.enabled = v; return this; }

  // --- sensitive_word_avoidance ---
  getSensitiveWordEnabled(): boolean { return this._config.sensitive_word_avoidance.enabled; }
  setSensitiveWordEnabled(v: boolean): this { this._config.sensitive_word_avoidance.enabled = v; return this; }

  // --- speech_to_text ---
  getSpeechToTextEnabled(): boolean { return this._config.speech_to_text.enabled; }
  setSpeechToTextEnabled(v: boolean): this { this._config.speech_to_text.enabled = v; return this; }

  // --- suggested_questions ---
  getSuggestedQuestions(): string[] { return this._config.suggested_questions; }
  setSuggestedQuestions(qs: string[]): this { this._config.suggested_questions = qs; return this; }
  addSuggestedQuestion(q: string): this { this._config.suggested_questions.push(q); return this; }
  removeSuggestedQuestion(index: number): this { this._config.suggested_questions.splice(index, 1); return this; }

  // --- suggested_questions_after_answer ---
  getSuggestedQuestionsAfterAnswer(): boolean { return this._config.suggested_questions_after_answer.enabled; }
  setSuggestedQuestionsAfterAnswer(v: boolean): this { this._config.suggested_questions_after_answer.enabled = v; return this; }

  // --- text_to_speech ---
  getTextToSpeechEnabled(): boolean { return this._config.text_to_speech.enabled; }
  setTextToSpeechEnabled(v: boolean): this { this._config.text_to_speech.enabled = v; return this; }
  getTextToSpeechLang(): string { return this._config.text_to_speech.language; }
  setTextToSpeechLang(lang: string): this { this._config.text_to_speech.language = lang; return this; }
  getTextToSpeechVoice(): string { return this._config.text_to_speech.voice; }
  setTextToSpeechVoice(voice: string): this { this._config.text_to_speech.voice = voice; return this; }

  get config(): FeaturesConfig { return this._config; }

  toYAML(w: YAMLWriter): void {
    const f = this._config;
    w.key("features");
    w.incIndent();
    w.key("file_upload");
    w.incIndent();
    w.key("allowed_file_extensions");
    f.file_upload.allowed_file_extensions.forEach(e => w.raw(`- ${e}`));
    w.key("allowed_file_types");
    f.file_upload.allowed_file_types.forEach(t => w.raw(`- ${t}`));
    w.key("allowed_file_upload_methods");
    f.file_upload.allowed_file_upload_methods.forEach(m => w.raw(`- ${m}`));
    w.keyVal("enabled", f.file_upload.enabled);
    w.key("fileUploadConfig");
    w.incIndent();
    w.keyVal("audio_file_size_limit", f.file_upload.fileUploadConfig.audio_file_size_limit);
    w.keyVal("batch_count_limit", f.file_upload.fileUploadConfig.batch_count_limit);
    w.keyVal("file_size_limit", f.file_upload.fileUploadConfig.file_size_limit);
    w.keyVal("image_file_batch_limit", f.file_upload.fileUploadConfig.image_file_batch_limit);
    w.keyVal("image_file_size_limit", f.file_upload.fileUploadConfig.image_file_size_limit);
    w.keyVal("single_chunk_attachment_limit", f.file_upload.fileUploadConfig.single_chunk_attachment_limit);
    w.keyVal("video_file_size_limit", f.file_upload.fileUploadConfig.video_file_size_limit);
    w.keyVal("workflow_file_upload_limit", f.file_upload.fileUploadConfig.workflow_file_upload_limit);
    w.decIndent();
    w.key("image");
    w.incIndent();
    w.keyVal("enabled", f.file_upload.image.enabled);
    w.keyVal("number_limits", f.file_upload.image.number_limits);
    w.key("transfer_methods");
    f.file_upload.image.transfer_methods.forEach(m => w.raw(`- ${m}`));
    w.decIndent();
    w.keyVal("number_limits", f.file_upload.number_limits);
    w.decIndent();
    w.keyQuoted("opening_statement", f.opening_statement);
    w.key("retriever_resource");
    w.incIndent();
    w.keyVal("enabled", f.retriever_resource.enabled);
    w.decIndent();
    w.key("sensitive_word_avoidance");
    w.incIndent();
    w.keyVal("enabled", f.sensitive_word_avoidance.enabled);
    w.decIndent();
    w.key("speech_to_text");
    w.incIndent();
    w.keyVal("enabled", f.speech_to_text.enabled);
    w.decIndent();
    w.key("suggested_questions");
    f.suggested_questions.forEach(q => w.raw(`- ${q}`));
    w.key("suggested_questions_after_answer");
    w.incIndent();
    w.keyVal("enabled", f.suggested_questions_after_answer.enabled);
    w.decIndent();
    w.key("text_to_speech");
    w.incIndent();
    w.keyVal("enabled", f.text_to_speech.enabled);
    w.keyQuoted("language", f.text_to_speech.language);
    w.keyQuoted("voice", f.text_to_speech.voice);
    w.decIndent();
    w.decIndent();
  }

  static fromYAML(raw: Record<string, unknown>): Features {
    return new Features(raw as Partial<FeaturesConfig>);
  }
}
