/**
 * A string representing a locale
 */
export type Locale =
  | "cs"
  | "de"
  /**
   * NOTE: 'en' is not a seperate locale in typescript, but the default of diagnostic messages
   */
  | "en"
  | "es"
  | "fr"
  | "it"
  | "ja"
  | "ko"
  | "pl"
  | "pt-br"
  | "ru"
  | "tr"
  | "zh-cn"
  | "zh-tw";

export type Category = "Error" | "Message" | "Suggestion";

export interface DiagnosticMessageInfo {
  category: Category;
  code: number;
}

/**
 * A string representing a `DiagnosticMessageTemplate`
 * @example
 * ```ts
 * const template = "'{0}' index type '{1}' is not assignable to '{2}' index type '{3}'.";
 * ```
 */
export type DiagnosticMessageTemplate = string;

/**
 * The `propertyKey` is the message template
 * @see {@link DiagnosticMessageTemplate}
 */
export type DiagnosticMessagesReference = Record<
  DiagnosticMessageTemplate,
  DiagnosticMessageInfo
>;

/**
 * A type alias to indicate the string is a diagnostic message id, internally in the compiler it is a property of the `Diagnostics` object.
 * This allows the compiler to internally swap the strings based on what locale is being used.
 * These identifiers always end on the error code they are assigned to.
 * @example
 * ```ts
 * const key = "_0_index_type_1_is_not_assignable_to_2_index_type_3_2413"
 * const diagnostic = Diagnostics[key];
 * ```
 */
type DiagnosticMessageIdentifier = string;

export type LocalizedDiagnosticeMessageMap = Record<
  DiagnosticMessageIdentifier,
  DiagnosticMessageTemplate
>;

/**
 * A typescript error code to use as a lookup key
 * NOTE: I don't think these are considered 'stable', even though the typescript world (like stackoverflow, tooling) depends on it.
 *       If it breaks, it breaks
 * @example
 * ```ts
 * const errorCode = 2322; // Type '{0}' is not assignable to type '{1}'.
 * ```
 */
type ErrorCode = number;

/**
 * A lookup table that maps error codes to their respective diagnostic message template.
 * @example
 * ```ts
 * // using the `en` (default) locale as an example
 * declare const diagnosticMessageMap: DiagnosticMessageMap;
 * const errorCode = 2322;
 * const template = diagnosticMessageMap[errorCode];
 * // -> Type '{0}' is not assignable to type '{1}'
 */
export type DiagnosticMessageMap = Record<ErrorCode, DiagnosticMessageTemplate>;

/**
 * A lookup table that containes all locales, where error codes map to their respective diagnostic message template
 * @example
 * ```ts
 * declare const diagnosticMessageLocalesMap: DiagnosticMessageLocalesMap;
 * const spanishLocale = 'es';
 * const errorCode = 2322;
 * const diagnosticMessageTemplateInSpanish = diagnosticMessageLocalesMap[spanishLocale][errorCode];
 * // -> El tipo '{0}' no se puede asignar al tipo '{1}'.
 *
 * // with the english locale
 * const englishLocale = 'en';
 * const diagnosticMessageTemplateInEnglish = diagnosticMessageLocalesMap[englishLocale][errorCode];
 * // -> Type '{0}' is not assignable to type '{1}'
 * ```
 */
export type DiagnosticMessageLocalesMap = Record<Locale, DiagnosticMessageMap>;
