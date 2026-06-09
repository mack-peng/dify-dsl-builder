"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Features = void 0;
class Features {
    _config;
    constructor(config) {
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
    getFileUploadEnabled() { return this._config.file_upload.enabled; }
    setFileUploadEnabled(v) { this._config.file_upload.enabled = v; return this; }
    getFileUploadExtensions() { return this._config.file_upload.allowed_file_extensions; }
    setFileUploadExtensions(exts) { this._config.file_upload.allowed_file_extensions = exts; return this; }
    getFileUploadTypes() { return this._config.file_upload.allowed_file_types; }
    setFileUploadTypes(types) { this._config.file_upload.allowed_file_types = types; return this; }
    getFileUploadMethods() { return this._config.file_upload.allowed_file_upload_methods; }
    setFileUploadMethods(methods) { this._config.file_upload.allowed_file_upload_methods = methods; return this; }
    getFileUploadLimits() { return this._config.file_upload.number_limits; }
    setFileUploadLimits(n) { this._config.file_upload.number_limits = n; return this; }
    getFileUploadImageEnabled() { return this._config.file_upload.image.enabled; }
    setFileUploadImageEnabled(v) { this._config.file_upload.image.enabled = v; return this; }
    getFileUploadImageLimits() { return this._config.file_upload.image.number_limits; }
    setFileUploadImageLimits(n) { this._config.file_upload.image.number_limits = n; return this; }
    getFileUploadImageMethods() { return this._config.file_upload.image.transfer_methods; }
    setFileUploadImageMethods(m) { this._config.file_upload.image.transfer_methods = m; return this; }
    getFileUploadConfig() { return this._config.file_upload.fileUploadConfig; }
    setFileUploadConfigItem(key, value) {
        this._config.file_upload.fileUploadConfig[key] = value;
        return this;
    }
    // --- opening_statement ---
    getOpeningStatement() { return this._config.opening_statement; }
    setOpeningStatement(text) { this._config.opening_statement = text; return this; }
    // --- retriever_resource ---
    getRetrieverEnabled() { return this._config.retriever_resource.enabled; }
    setRetrieverEnabled(v) { this._config.retriever_resource.enabled = v; return this; }
    // --- sensitive_word_avoidance ---
    getSensitiveWordEnabled() { return this._config.sensitive_word_avoidance.enabled; }
    setSensitiveWordEnabled(v) { this._config.sensitive_word_avoidance.enabled = v; return this; }
    // --- speech_to_text ---
    getSpeechToTextEnabled() { return this._config.speech_to_text.enabled; }
    setSpeechToTextEnabled(v) { this._config.speech_to_text.enabled = v; return this; }
    // --- suggested_questions ---
    getSuggestedQuestions() { return this._config.suggested_questions; }
    setSuggestedQuestions(qs) { this._config.suggested_questions = qs; return this; }
    addSuggestedQuestion(q) { this._config.suggested_questions.push(q); return this; }
    removeSuggestedQuestion(index) { this._config.suggested_questions.splice(index, 1); return this; }
    // --- suggested_questions_after_answer ---
    getSuggestedQuestionsAfterAnswer() { return this._config.suggested_questions_after_answer.enabled; }
    setSuggestedQuestionsAfterAnswer(v) { this._config.suggested_questions_after_answer.enabled = v; return this; }
    // --- text_to_speech ---
    getTextToSpeechEnabled() { return this._config.text_to_speech.enabled; }
    setTextToSpeechEnabled(v) { this._config.text_to_speech.enabled = v; return this; }
    getTextToSpeechLang() { return this._config.text_to_speech.language; }
    setTextToSpeechLang(lang) { this._config.text_to_speech.language = lang; return this; }
    getTextToSpeechVoice() { return this._config.text_to_speech.voice; }
    setTextToSpeechVoice(voice) { this._config.text_to_speech.voice = voice; return this; }
    get config() { return this._config; }
    toYAML(w) {
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
    static fromYAML(raw) {
        return new Features(raw);
    }
}
exports.Features = Features;
