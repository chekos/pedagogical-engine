/**
 * Portal i18n — static UI string translations for the learner portal.
 *
 * No library needed: components call getPortalStrings(lang) and use
 * the returned object. For interpolation, use t(template, vars).
 */

export type PortalLang = "en" | "es" | "fr" | "zh" | "ar" | "pt";

export interface PortalStrings {
  // page.tsx
  skipToMain: string;
  brandName: string;
  viewAs: string;
  audienceLearner: string;
  audienceParent: string;
  audienceEmployer: string;
  audienceGeneral: string;
  audienceSelectLabel: string;
  loadingProgress: string;
  portalNotFound: string;
  portalNotFoundHelp: string;
  footerReadOnly: string;
  footerPortalCode: string;

  // progress-narrative.tsx
  progressSummary: string;
  skillsCount: string; // "{known} of {total} skills"
  assessed: string;
  inferred: string;
  hasDemonstrated: string; // "{name} has demonstrated proficiency in {skills}."
  andMoreSkills: string; // "and {count} more skills"
  skillsAtLevel: string; // "Skills have been demonstrated at the {level} level and above."
  nextStepsLabel: string; // "Next steps: {skills}."
  nextStepSingular: string;
  nextStepPlural: string;
  noSkillsYet: string;

  // Bloom gerund labels (for progress narrative)
  bloomRemembering: string;
  bloomUnderstanding: string;
  bloomApplying: string;
  bloomAnalyzing: string;
  bloomCreating: string;
  bloomEvaluating: string;

  // Bloom imperative labels (for skill map headers)
  bloomRemember: string;
  bloomUnderstand: string;
  bloomApply: string;
  bloomAnalyze: string;
  bloomCreate: string;
  bloomEvaluate: string;

  // skill-map.tsx
  skillMap: string;
  skillMapEmpty: string;
  inferredLabel: string;
  inferredExplanation: string;
  upNext: string;

  // assessment-cards.tsx
  assessments: string;
  assessmentsEmpty: string;
  readyToTake: string;
  startAssessment: string;
  completed: string;

  // educator-notes.tsx
  notesFromEducator: string;
  pinned: string;
  forAudience: string; // "For {audience}s"

  // language-selector.tsx
  languageLabel: string;
  languageAriaLabel: string;
}

const en: PortalStrings = {
  skipToMain: "Skip to main content",
  brandName: "Pedagogical Engine",
  viewAs: "View as",
  audienceLearner: "Learner",
  audienceParent: "Parent",
  audienceEmployer: "Employer",
  audienceGeneral: "General",
  audienceSelectLabel: "Select audience perspective",
  loadingProgress: "Loading your progress\u2026",
  portalNotFound: "Portal Not Found",
  portalNotFoundHelp:
    "Check that your portal code is correct. If you received a link, make sure it was copied completely.",
  footerReadOnly: "This page is read-only. Your progress is updated by your educator.",
  footerPortalCode: "Portal code:",

  progressSummary: "Progress Summary",
  skillsCount: "{known} of {total} skills",
  assessed: "assessed",
  inferred: "inferred",
  hasDemonstrated: "{name} has demonstrated proficiency in {skills}.",
  andMoreSkills: "and {count} more skills",
  skillsAtLevel: "Skills have been demonstrated at the {level} level and above.",
  nextStepsLabel: "Next steps: {skills}.",
  nextStepSingular: "This is the next skill in the learning path.",
  nextStepPlural: "These are the next skills available in the learning path.",
  noSkillsYet: "No skills have been assessed yet. Complete an assessment to see progress here.",

  bloomRemembering: "remembering",
  bloomUnderstanding: "understanding",
  bloomApplying: "applying",
  bloomAnalyzing: "analyzing",
  bloomCreating: "creating",
  bloomEvaluating: "evaluating",

  bloomRemember: "Remember",
  bloomUnderstand: "Understand",
  bloomApply: "Apply",
  bloomAnalyze: "Analyze",
  bloomCreate: "Create",
  bloomEvaluate: "Evaluate",

  skillMap: "Skill Map",
  skillMapEmpty: "No skills assessed yet. Complete an assessment to build your skill map.",
  inferredLabel: "Inferred",
  inferredExplanation: "These skills are inferred from demonstrated abilities in related areas.",
  upNext: "Up Next",

  assessments: "Assessments",
  assessmentsEmpty: "No assessments yet. Your educator will assign assessments when ready.",
  readyToTake: "Ready to Take",
  startAssessment: "Start",
  completed: "Completed",

  notesFromEducator: "Notes from Your Educator",
  pinned: "Pinned",
  forAudience: "For {audience}s",

  languageLabel: "Language",
  languageAriaLabel: "Select language for portal content",
};

const es: PortalStrings = {
  skipToMain: "Saltar al contenido principal",
  brandName: "Motor Pedag\u00f3gico",
  viewAs: "Ver como",
  audienceLearner: "Estudiante",
  audienceParent: "Padre/Madre",
  audienceEmployer: "Empleador",
  audienceGeneral: "General",
  audienceSelectLabel: "Seleccionar perspectiva de audiencia",
  loadingProgress: "Cargando tu progreso\u2026",
  portalNotFound: "Portal no encontrado",
  portalNotFoundHelp:
    "Verifica que tu c\u00f3digo de portal sea correcto. Si recibiste un enlace, aseg\u00farate de que se haya copiado completamente.",
  footerReadOnly: "Esta p\u00e1gina es de solo lectura. Tu progreso es actualizado por tu educador.",
  footerPortalCode: "C\u00f3digo de portal:",

  progressSummary: "Resumen de progreso",
  skillsCount: "{known} de {total} habilidades",
  assessed: "evaluadas",
  inferred: "inferidas",
  hasDemonstrated: "{name} ha demostrado competencia en {skills}.",
  andMoreSkills: "y {count} habilidades m\u00e1s",
  skillsAtLevel: "Las habilidades se han demostrado en el nivel de {level} y superior.",
  nextStepsLabel: "Pr\u00f3ximos pasos: {skills}.",
  nextStepSingular: "Esta es la siguiente habilidad en la ruta de aprendizaje.",
  nextStepPlural: "Estas son las siguientes habilidades disponibles en la ruta de aprendizaje.",
  noSkillsYet:
    "A\u00fan no se han evaluado habilidades. Completa una evaluaci\u00f3n para ver tu progreso aqu\u00ed.",

  bloomRemembering: "recordar",
  bloomUnderstanding: "comprender",
  bloomApplying: "aplicar",
  bloomAnalyzing: "analizar",
  bloomCreating: "crear",
  bloomEvaluating: "evaluar",

  bloomRemember: "Recordar",
  bloomUnderstand: "Comprender",
  bloomApply: "Aplicar",
  bloomAnalyze: "Analizar",
  bloomCreate: "Crear",
  bloomEvaluate: "Evaluar",

  skillMap: "Mapa de habilidades",
  skillMapEmpty:
    "A\u00fan no se han evaluado habilidades. Completa una evaluaci\u00f3n para construir tu mapa de habilidades.",
  inferredLabel: "Inferidas",
  inferredExplanation: "Estas habilidades se infieren de capacidades demostradas en \u00e1reas relacionadas.",
  upNext: "Siguiente",

  assessments: "Evaluaciones",
  assessmentsEmpty: "A\u00fan no hay evaluaciones. Tu educador asignar\u00e1 evaluaciones cuando est\u00e9 listo.",
  readyToTake: "Listas para realizar",
  startAssessment: "Iniciar",
  completed: "Completadas",

  notesFromEducator: "Notas de tu educador",
  pinned: "Fijada",
  forAudience: "Para {audience}s",

  languageLabel: "Idioma",
  languageAriaLabel: "Seleccionar idioma del contenido del portal",
};

const fr: PortalStrings = {
  skipToMain: "Passer au contenu principal",
  brandName: "Moteur P\u00e9dagogique",
  viewAs: "Voir en tant que",
  audienceLearner: "Apprenant",
  audienceParent: "Parent",
  audienceEmployer: "Employeur",
  audienceGeneral: "G\u00e9n\u00e9ral",
  audienceSelectLabel: "S\u00e9lectionner la perspective d\u2019audience",
  loadingProgress: "Chargement de votre progression\u2026",
  portalNotFound: "Portail introuvable",
  portalNotFoundHelp:
    "V\u00e9rifiez que votre code de portail est correct. Si vous avez re\u00e7u un lien, assurez-vous qu\u2019il a \u00e9t\u00e9 copi\u00e9 enti\u00e8rement.",
  footerReadOnly:
    "Cette page est en lecture seule. Votre progression est mise \u00e0 jour par votre \u00e9ducateur.",
  footerPortalCode: "Code du portail :",

  progressSummary: "R\u00e9sum\u00e9 de la progression",
  skillsCount: "{known} sur {total} comp\u00e9tences",
  assessed: "\u00e9valu\u00e9es",
  inferred: "inf\u00e9r\u00e9es",
  hasDemonstrated: "{name} a d\u00e9montr\u00e9 sa ma\u00eetrise en {skills}.",
  andMoreSkills: "et {count} comp\u00e9tences suppl\u00e9mentaires",
  skillsAtLevel:
    "Les comp\u00e9tences ont \u00e9t\u00e9 d\u00e9montr\u00e9es au niveau {level} et au-dessus.",
  nextStepsLabel: "Prochaines \u00e9tapes : {skills}.",
  nextStepSingular: "C\u2019est la prochaine comp\u00e9tence dans le parcours d\u2019apprentissage.",
  nextStepPlural:
    "Ce sont les prochaines comp\u00e9tences disponibles dans le parcours d\u2019apprentissage.",
  noSkillsYet:
    "Aucune comp\u00e9tence n\u2019a encore \u00e9t\u00e9 \u00e9valu\u00e9e. Compl\u00e9tez une \u00e9valuation pour voir votre progression ici.",

  bloomRemembering: "m\u00e9moriser",
  bloomUnderstanding: "comprendre",
  bloomApplying: "appliquer",
  bloomAnalyzing: "analyser",
  bloomCreating: "cr\u00e9er",
  bloomEvaluating: "\u00e9valuer",

  bloomRemember: "M\u00e9moriser",
  bloomUnderstand: "Comprendre",
  bloomApply: "Appliquer",
  bloomAnalyze: "Analyser",
  bloomCreate: "Cr\u00e9er",
  bloomEvaluate: "\u00c9valuer",

  skillMap: "Carte des comp\u00e9tences",
  skillMapEmpty:
    "Aucune comp\u00e9tence \u00e9valu\u00e9e pour le moment. Compl\u00e9tez une \u00e9valuation pour construire votre carte.",
  inferredLabel: "Inf\u00e9r\u00e9es",
  inferredExplanation:
    "Ces comp\u00e9tences sont inf\u00e9r\u00e9es \u00e0 partir de capacit\u00e9s d\u00e9montr\u00e9es dans des domaines connexes.",
  upNext: "\u00c0 venir",

  assessments: "\u00c9valuations",
  assessmentsEmpty:
    "Pas encore d\u2019\u00e9valuations. Votre \u00e9ducateur les assignera quand il sera pr\u00eat.",
  readyToTake: "Pr\u00eates \u00e0 passer",
  startAssessment: "Commencer",
  completed: "Termin\u00e9es",

  notesFromEducator: "Notes de votre \u00e9ducateur",
  pinned: "\u00c9pingl\u00e9e",
  forAudience: "Pour les {audience}s",

  languageLabel: "Langue",
  languageAriaLabel: "S\u00e9lectionner la langue du contenu du portail",
};

const zh: PortalStrings = {
  skipToMain: "\u8df3\u5230\u4e3b\u8981\u5185\u5bb9",
  brandName: "\u6559\u5b66\u5f15\u64ce",
  viewAs: "\u67e5\u770b\u89c6\u89d2",
  audienceLearner: "\u5b66\u4e60\u8005",
  audienceParent: "\u5bb6\u957f",
  audienceEmployer: "\u96c7\u4e3b",
  audienceGeneral: "\u901a\u7528",
  audienceSelectLabel: "\u9009\u62e9\u53d7\u4f17\u89c6\u89d2",
  loadingProgress: "\u6b63\u5728\u52a0\u8f7d\u4f60\u7684\u8fdb\u5ea6\u2026",
  portalNotFound: "\u672a\u627e\u5230\u95e8\u6237",
  portalNotFoundHelp:
    "\u8bf7\u68c0\u67e5\u4f60\u7684\u95e8\u6237\u4ee3\u7801\u662f\u5426\u6b63\u786e\u3002\u5982\u679c\u4f60\u6536\u5230\u4e86\u94fe\u63a5\uff0c\u8bf7\u786e\u4fdd\u5b8c\u6574\u590d\u5236\u3002",
  footerReadOnly:
    "\u6b64\u9875\u9762\u4e3a\u53ea\u8bfb\u3002\u4f60\u7684\u8fdb\u5ea6\u7531\u4f60\u7684\u6559\u80b2\u8005\u66f4\u65b0\u3002",
  footerPortalCode: "\u95e8\u6237\u4ee3\u7801\uff1a",

  progressSummary: "\u8fdb\u5ea6\u6458\u8981",
  skillsCount: "{known} / {total} \u9879\u6280\u80fd",
  assessed: "\u5df2\u8bc4\u4f30",
  inferred: "\u5df2\u63a8\u65ad",
  hasDemonstrated: "{name}\u5df2\u5c55\u793a\u4e86\u5728{skills}\u65b9\u9762\u7684\u80fd\u529b\u3002",
  andMoreSkills: "\u53ca\u5176\u4ed6{count}\u9879\u6280\u80fd",
  skillsAtLevel: "\u6280\u80fd\u5df2\u5728{level}\u7ea7\u522b\u53ca\u4ee5\u4e0a\u5f97\u5230\u9a8c\u8bc1\u3002",
  nextStepsLabel: "\u4e0b\u4e00\u6b65\uff1a{skills}\u3002",
  nextStepSingular: "\u8fd9\u662f\u5b66\u4e60\u8def\u5f84\u4e2d\u7684\u4e0b\u4e00\u9879\u6280\u80fd\u3002",
  nextStepPlural:
    "\u8fd9\u4e9b\u662f\u5b66\u4e60\u8def\u5f84\u4e2d\u63a5\u4e0b\u6765\u53ef\u7528\u7684\u6280\u80fd\u3002",
  noSkillsYet:
    "\u5c1a\u672a\u8bc4\u4f30\u4efb\u4f55\u6280\u80fd\u3002\u5b8c\u6210\u4e00\u6b21\u8bc4\u4f30\u4ee5\u5728\u6b64\u5904\u67e5\u770b\u8fdb\u5ea6\u3002",

  bloomRemembering: "\u8bb0\u5fc6",
  bloomUnderstanding: "\u7406\u89e3",
  bloomApplying: "\u5e94\u7528",
  bloomAnalyzing: "\u5206\u6790",
  bloomCreating: "\u521b\u9020",
  bloomEvaluating: "\u8bc4\u4ef7",

  bloomRemember: "\u8bb0\u5fc6",
  bloomUnderstand: "\u7406\u89e3",
  bloomApply: "\u5e94\u7528",
  bloomAnalyze: "\u5206\u6790",
  bloomCreate: "\u521b\u9020",
  bloomEvaluate: "\u8bc4\u4ef7",

  skillMap: "\u6280\u80fd\u56fe\u8c31",
  skillMapEmpty:
    "\u5c1a\u672a\u8bc4\u4f30\u4efb\u4f55\u6280\u80fd\u3002\u5b8c\u6210\u4e00\u6b21\u8bc4\u4f30\u4ee5\u6784\u5efa\u4f60\u7684\u6280\u80fd\u56fe\u8c31\u3002",
  inferredLabel: "\u63a8\u65ad\u7684",
  inferredExplanation:
    "\u8fd9\u4e9b\u6280\u80fd\u662f\u4ece\u76f8\u5173\u9886\u57df\u4e2d\u5c55\u793a\u7684\u80fd\u529b\u63a8\u65ad\u51fa\u6765\u7684\u3002",
  upNext: "\u63a5\u4e0b\u6765",

  assessments: "\u8bc4\u4f30",
  assessmentsEmpty:
    "\u6682\u65e0\u8bc4\u4f30\u3002\u4f60\u7684\u6559\u80b2\u8005\u4f1a\u5728\u51c6\u5907\u597d\u65f6\u5206\u914d\u8bc4\u4f30\u3002",
  readyToTake: "\u53ef\u4ee5\u5f00\u59cb",
  startAssessment: "\u5f00\u59cb",
  completed: "\u5df2\u5b8c\u6210",

  notesFromEducator: "\u6559\u80b2\u8005\u7b14\u8bb0",
  pinned: "\u5df2\u7f6e\u9876",
  forAudience: "\u9488\u5bf9{audience}",

  languageLabel: "\u8bed\u8a00",
  languageAriaLabel: "\u9009\u62e9\u95e8\u6237\u5185\u5bb9\u8bed\u8a00",
};

const ar: PortalStrings = {
  skipToMain: "\u0627\u0646\u062a\u0642\u0644 \u0625\u0644\u0649 \u0627\u0644\u0645\u062d\u062a\u0648\u0649 \u0627\u0644\u0631\u0626\u064a\u0633\u064a",
  brandName: "\u0645\u062d\u0631\u0643 \u0627\u0644\u062a\u0639\u0644\u064a\u0645",
  viewAs: "\u0639\u0631\u0636 \u0643\u0640",
  audienceLearner: "\u0645\u062a\u0639\u0644\u0645",
  audienceParent: "\u0648\u0644\u064a \u0623\u0645\u0631",
  audienceEmployer: "\u0635\u0627\u062d\u0628 \u0639\u0645\u0644",
  audienceGeneral: "\u0639\u0627\u0645",
  audienceSelectLabel: "\u0627\u062e\u062a\u0631 \u0645\u0646\u0638\u0648\u0631 \u0627\u0644\u062c\u0645\u0647\u0648\u0631",
  loadingProgress: "\u062c\u0627\u0631\u064d \u062a\u062d\u0645\u064a\u0644 \u062a\u0642\u062f\u0645\u0643\u2026",
  portalNotFound: "\u0627\u0644\u0628\u0648\u0627\u0628\u0629 \u063a\u064a\u0631 \u0645\u0648\u062c\u0648\u062f\u0629",
  portalNotFoundHelp:
    "\u062a\u062d\u0642\u0642 \u0645\u0646 \u0635\u062d\u0629 \u0631\u0645\u0632 \u0627\u0644\u0628\u0648\u0627\u0628\u0629. \u0625\u0630\u0627 \u062a\u0644\u0642\u064a\u062a \u0631\u0627\u0628\u0637\u064b\u0627\u060c \u062a\u0623\u0643\u062f \u0645\u0646 \u0646\u0633\u062e\u0647 \u0628\u0627\u0644\u0643\u0627\u0645\u0644.",
  footerReadOnly:
    "\u0647\u0630\u0647 \u0627\u0644\u0635\u0641\u062d\u0629 \u0644\u0644\u0642\u0631\u0627\u0621\u0629 \u0641\u0642\u0637. \u064a\u062a\u0645 \u062a\u062d\u062f\u064a\u062b \u062a\u0642\u062f\u0645\u0643 \u0628\u0648\u0627\u0633\u0637\u0629 \u0627\u0644\u0645\u0639\u0644\u0645.",
  footerPortalCode: "\u0631\u0645\u0632 \u0627\u0644\u0628\u0648\u0627\u0628\u0629:",

  progressSummary: "\u0645\u0644\u062e\u0635 \u0627\u0644\u062a\u0642\u062f\u0645",
  skillsCount: "{known} \u0645\u0646 {total} \u0645\u0647\u0627\u0631\u0629",
  assessed: "\u062a\u0645 \u062a\u0642\u064a\u064a\u0645\u0647\u0627",
  inferred: "\u0645\u0633\u062a\u0646\u062a\u062c\u0629",
  hasDemonstrated: "\u0623\u0638\u0647\u0631 {name} \u0643\u0641\u0627\u0621\u0629 \u0641\u064a {skills}.",
  andMoreSkills: "\u0648{count} \u0645\u0647\u0627\u0631\u0627\u062a \u0623\u062e\u0631\u0649",
  skillsAtLevel: "\u062a\u0645 \u0625\u062b\u0628\u0627\u062a \u0627\u0644\u0645\u0647\u0627\u0631\u0627\u062a \u0641\u064a \u0645\u0633\u062a\u0648\u0649 {level} \u0648\u0645\u0627 \u0641\u0648\u0642.",
  nextStepsLabel: "\u0627\u0644\u062e\u0637\u0648\u0627\u062a \u0627\u0644\u062a\u0627\u0644\u064a\u0629: {skills}.",
  nextStepSingular: "\u0647\u0630\u0647 \u0647\u064a \u0627\u0644\u0645\u0647\u0627\u0631\u0629 \u0627\u0644\u062a\u0627\u0644\u064a\u0629 \u0641\u064a \u0645\u0633\u0627\u0631 \u0627\u0644\u062a\u0639\u0644\u0645.",
  nextStepPlural: "\u0647\u0630\u0647 \u0647\u064a \u0627\u0644\u0645\u0647\u0627\u0631\u0627\u062a \u0627\u0644\u062a\u0627\u0644\u064a\u0629 \u0627\u0644\u0645\u062a\u0627\u062d\u0629 \u0641\u064a \u0645\u0633\u0627\u0631 \u0627\u0644\u062a\u0639\u0644\u0645.",
  noSkillsYet:
    "\u0644\u0645 \u064a\u062a\u0645 \u062a\u0642\u064a\u064a\u0645 \u0623\u064a \u0645\u0647\u0627\u0631\u0627\u062a \u0628\u0639\u062f. \u0623\u0643\u0645\u0644 \u062a\u0642\u064a\u064a\u0645\u064b\u0627 \u0644\u0631\u0624\u064a\u0629 \u062a\u0642\u062f\u0645\u0643 \u0647\u0646\u0627.",

  bloomRemembering: "\u062a\u0630\u0643\u0631",
  bloomUnderstanding: "\u0641\u0647\u0645",
  bloomApplying: "\u062a\u0637\u0628\u064a\u0642",
  bloomAnalyzing: "\u062a\u062d\u0644\u064a\u0644",
  bloomCreating: "\u0625\u0628\u062f\u0627\u0639",
  bloomEvaluating: "\u062a\u0642\u0648\u064a\u0645",

  bloomRemember: "\u062a\u0630\u0643\u0631",
  bloomUnderstand: "\u0641\u0647\u0645",
  bloomApply: "\u062a\u0637\u0628\u064a\u0642",
  bloomAnalyze: "\u062a\u062d\u0644\u064a\u0644",
  bloomCreate: "\u0625\u0628\u062f\u0627\u0639",
  bloomEvaluate: "\u062a\u0642\u0648\u064a\u0645",

  skillMap: "\u062e\u0631\u064a\u0637\u0629 \u0627\u0644\u0645\u0647\u0627\u0631\u0627\u062a",
  skillMapEmpty:
    "\u0644\u0645 \u064a\u062a\u0645 \u062a\u0642\u064a\u064a\u0645 \u0623\u064a \u0645\u0647\u0627\u0631\u0627\u062a \u0628\u0639\u062f. \u0623\u0643\u0645\u0644 \u062a\u0642\u064a\u064a\u0645\u064b\u0627 \u0644\u0628\u0646\u0627\u0621 \u062e\u0631\u064a\u0637\u0629 \u0645\u0647\u0627\u0631\u0627\u062a\u0643.",
  inferredLabel: "\u0645\u0633\u062a\u0646\u062a\u062c\u0629",
  inferredExplanation:
    "\u0647\u0630\u0647 \u0627\u0644\u0645\u0647\u0627\u0631\u0627\u062a \u0645\u0633\u062a\u0646\u062a\u062c\u0629 \u0645\u0646 \u0642\u062f\u0631\u0627\u062a \u062a\u0645 \u0625\u062b\u0628\u0627\u062a\u0647\u0627 \u0641\u064a \u0645\u062c\u0627\u0644\u0627\u062a \u0630\u0627\u062a \u0635\u0644\u0629.",
  upNext: "\u0627\u0644\u062a\u0627\u0644\u064a",

  assessments: "\u0627\u0644\u062a\u0642\u064a\u064a\u0645\u0627\u062a",
  assessmentsEmpty:
    "\u0644\u0627 \u062a\u0648\u062c\u062f \u062a\u0642\u064a\u064a\u0645\u0627\u062a \u0628\u0639\u062f. \u0633\u064a\u0642\u0648\u0645 \u0645\u0639\u0644\u0645\u0643 \u0628\u062a\u0639\u064a\u064a\u0646 \u0627\u0644\u062a\u0642\u064a\u064a\u0645\u0627\u062a \u0639\u0646\u062f\u0645\u0627 \u064a\u0643\u0648\u0646 \u062c\u0627\u0647\u0632\u064b\u0627.",
  readyToTake: "\u062c\u0627\u0647\u0632\u0629 \u0644\u0644\u0628\u062f\u0621",
  startAssessment: "\u0627\u0628\u062f\u0623",
  completed: "\u0645\u0643\u062a\u0645\u0644\u0629",

  notesFromEducator: "\u0645\u0644\u0627\u062d\u0638\u0627\u062a \u0645\u0646 \u0645\u0639\u0644\u0645\u0643",
  pinned: "\u0645\u062b\u0628\u062a\u0629",
  forAudience: "\u0644\u0640{audience}",

  languageLabel: "\u0627\u0644\u0644\u063a\u0629",
  languageAriaLabel: "\u0627\u062e\u062a\u0631 \u0644\u063a\u0629 \u0645\u062d\u062a\u0648\u0649 \u0627\u0644\u0628\u0648\u0627\u0628\u0629",
};

const pt: PortalStrings = {
  skipToMain: "Pular para o conte\u00fado principal",
  brandName: "Motor Pedag\u00f3gico",
  viewAs: "Ver como",
  audienceLearner: "Estudante",
  audienceParent: "Respons\u00e1vel",
  audienceEmployer: "Empregador",
  audienceGeneral: "Geral",
  audienceSelectLabel: "Selecionar perspectiva do p\u00fablico",
  loadingProgress: "Carregando seu progresso\u2026",
  portalNotFound: "Portal n\u00e3o encontrado",
  portalNotFoundHelp:
    "Verifique se o c\u00f3digo do portal est\u00e1 correto. Se voc\u00ea recebeu um link, certifique-se de que foi copiado completamente.",
  footerReadOnly:
    "Esta p\u00e1gina \u00e9 somente leitura. Seu progresso \u00e9 atualizado pelo seu educador.",
  footerPortalCode: "C\u00f3digo do portal:",

  progressSummary: "Resumo do progresso",
  skillsCount: "{known} de {total} habilidades",
  assessed: "avaliadas",
  inferred: "inferidas",
  hasDemonstrated: "{name} demonstrou profici\u00eancia em {skills}.",
  andMoreSkills: "e mais {count} habilidades",
  skillsAtLevel: "As habilidades foram demonstradas no n\u00edvel de {level} e acima.",
  nextStepsLabel: "Pr\u00f3ximos passos: {skills}.",
  nextStepSingular: "Esta \u00e9 a pr\u00f3xima habilidade no caminho de aprendizagem.",
  nextStepPlural:
    "Estas s\u00e3o as pr\u00f3ximas habilidades dispon\u00edveis no caminho de aprendizagem.",
  noSkillsYet:
    "Nenhuma habilidade foi avaliada ainda. Complete uma avalia\u00e7\u00e3o para ver seu progresso aqui.",

  bloomRemembering: "lembrar",
  bloomUnderstanding: "compreender",
  bloomApplying: "aplicar",
  bloomAnalyzing: "analisar",
  bloomCreating: "criar",
  bloomEvaluating: "avaliar",

  bloomRemember: "Lembrar",
  bloomUnderstand: "Compreender",
  bloomApply: "Aplicar",
  bloomAnalyze: "Analisar",
  bloomCreate: "Criar",
  bloomEvaluate: "Avaliar",

  skillMap: "Mapa de habilidades",
  skillMapEmpty:
    "Nenhuma habilidade avaliada ainda. Complete uma avalia\u00e7\u00e3o para construir seu mapa de habilidades.",
  inferredLabel: "Inferidas",
  inferredExplanation:
    "Estas habilidades s\u00e3o inferidas a partir de capacidades demonstradas em \u00e1reas relacionadas.",
  upNext: "Pr\u00f3ximas",

  assessments: "Avalia\u00e7\u00f5es",
  assessmentsEmpty:
    "Nenhuma avalia\u00e7\u00e3o ainda. Seu educador atribuir\u00e1 avalia\u00e7\u00f5es quando estiver pronto.",
  readyToTake: "Prontas para realizar",
  startAssessment: "Iniciar",
  completed: "Conclu\u00eddas",

  notesFromEducator: "Notas do seu educador",
  pinned: "Fixada",
  forAudience: "Para {audience}s",

  languageLabel: "Idioma",
  languageAriaLabel: "Selecionar idioma do conte\u00fado do portal",
};

const translations: Record<string, PortalStrings> = { en, es, fr, zh, ar, pt };

/** Get translated strings, falling back to English for unknown languages. */
export function getPortalStrings(lang: string): PortalStrings {
  return translations[lang] ?? en;
}

/** Simple template interpolation: replaces {key} placeholders with values. */
export function t(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? `{${key}}`));
}

/** Map a bloom level key to the gerund form in the current language. */
export function bloomGerund(level: string, s: PortalStrings): string {
  const map: Record<string, string> = {
    knowledge: s.bloomRemembering,
    comprehension: s.bloomUnderstanding,
    application: s.bloomApplying,
    analysis: s.bloomAnalyzing,
    synthesis: s.bloomCreating,
    evaluation: s.bloomEvaluating,
  };
  return map[level] ?? level;
}

/** Map a bloom level key to the imperative/header form in the current language. */
export function bloomDisplay(level: string, s: PortalStrings): string {
  const map: Record<string, string> = {
    knowledge: s.bloomRemember,
    comprehension: s.bloomUnderstand,
    application: s.bloomApply,
    analysis: s.bloomAnalyze,
    synthesis: s.bloomCreate,
    evaluation: s.bloomEvaluate,
  };
  return map[level] ?? level;
}
