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
export declare class Features {
    private _config;
    constructor(config?: Partial<FeaturesConfig>);
    getFileUploadEnabled(): boolean;
    setFileUploadEnabled(v: boolean): this;
    getFileUploadExtensions(): string[];
    setFileUploadExtensions(exts: string[]): this;
    getFileUploadTypes(): string[];
    setFileUploadTypes(types: string[]): this;
    getFileUploadMethods(): string[];
    setFileUploadMethods(methods: string[]): this;
    getFileUploadLimits(): number;
    setFileUploadLimits(n: number): this;
    getFileUploadImageEnabled(): boolean;
    setFileUploadImageEnabled(v: boolean): this;
    getFileUploadImageLimits(): number;
    setFileUploadImageLimits(n: number): this;
    getFileUploadImageMethods(): string[];
    setFileUploadImageMethods(m: string[]): this;
    getFileUploadConfig(): FileUploadConfig;
    setFileUploadConfigItem(key: string, value: number): this;
    getOpeningStatement(): string;
    setOpeningStatement(text: string): this;
    getRetrieverEnabled(): boolean;
    setRetrieverEnabled(v: boolean): this;
    getSensitiveWordEnabled(): boolean;
    setSensitiveWordEnabled(v: boolean): this;
    getSpeechToTextEnabled(): boolean;
    setSpeechToTextEnabled(v: boolean): this;
    getSuggestedQuestions(): string[];
    setSuggestedQuestions(qs: string[]): this;
    addSuggestedQuestion(q: string): this;
    removeSuggestedQuestion(index: number): this;
    getSuggestedQuestionsAfterAnswer(): boolean;
    setSuggestedQuestionsAfterAnswer(v: boolean): this;
    getTextToSpeechEnabled(): boolean;
    setTextToSpeechEnabled(v: boolean): this;
    getTextToSpeechLang(): string;
    setTextToSpeechLang(lang: string): this;
    getTextToSpeechVoice(): string;
    setTextToSpeechVoice(voice: string): this;
    get config(): FeaturesConfig;
    toYAML(w: YAMLWriter): void;
    static fromYAML(raw: Record<string, unknown>): Features;
}
export {};
