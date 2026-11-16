import { CourtCase, Precedent, ModelMetricComparison, FeatureImportance } from "./types";

export const MOCK_PRECEDENTS: Precedent[] = [
  {
    id: "prec-001",
    title: "Vijay Madanlal Choudhary & Ors vs Union of India & Ors",
    citation: "(2022) 10 SCC 1",
    court: "Supreme Court of India",
    caseType: "CRL.A",
    judgmentDate: "2022-07-27",
    outcome: "Dismissed",
    bench: "A.M. Khanwilkar, Dinesh Maheshwari, C.T. Ravikumar, JJ.",
    similarityScore: 0.884,
    keywordScore: 0.542,
    wordCount: 18450,
    summary: {
      facts:
        "Special Leave Petitions challenging the constitutional validity of several provisions of the Prevention of Money Laundering Act, 2002 (PMLA), particularly Section 45 imposing twin conditions on bail.",
      issue:
        "Whether Section 45(1) twin conditions for grant of bail post-2018 amendment are constitutional and whether Enforcement Case Information Report (ECIR) is equivalent to FIR.",
      holding:
        "The Supreme Court upheld the constitutional validity of Section 45(1) twin conditions. The Court held that an ECIR cannot be equated with an FIR; non-supply of ECIR copy to the accused is not unconstitutional provided the grounds of arrest are disclosed.",
      outcomeText:
        "All challenges to the statutory provisions of the 2002 Act dismissed; principles governing bail under Section 45 reaffirmed.",
    },
    matchedSnippets: [
      "...the twin conditions mentioned in Section 45 of the 2002 Act, though strict, cannot be said to be unreasonable or unconstitutional having regard to the menace of money laundering...",
      "...supply of a copy of ECIR in every case is not mandatory; it is enough if the Enforcement Directorate discloses the grounds of arrest to the person arrested...",
    ],
    fullText: `IN THE SUPREME COURT OF INDIA
CRIMINAL APPELLATE JURISDICTION

CRIMINAL APPEAL NO. 4634 OF 2014
(WITH CONNECTED WRIT PETITIONS AND APPEALS)

VIJAY MADANLAL CHOUDHARY & ORS.                                 ...APPELLANTS
                                   VERSUS
UNION OF INDIA & ORS.                                          ...RESPONDENTS

JUDGMENT
A.M. KHANWILKAR, J.

1. The seminal question involved in this batch of cases is regarding the constitutional validity of the provisions of the Prevention of Money Laundering Act, 2002 as amended from time to time.

2. Broadly, the challenge relates to:
   (i) The validity of Section 3 defining the offence of money-laundering;
   (ii) The twin conditions for grant of bail under Section 45;
   (iii) The power of arrest under Section 19 without supplying a copy of the ECIR;
   (iv) The presumption under Section 24 regarding the proceeds of crime.

3. We have heard learned Senior Counsel appearing for the respective appellants and petitioners, as well as the learned Solicitor General of India appearing for the Union of India.

4. On a careful consideration of the rival submissions, we hold that Section 45 of the 2002 Act satisfies the test of proportionality. Money laundering is not an ordinary offence; it threatens the financial integrity of the nation. The twin conditions—namely that the court must be satisfied that there are reasonable grounds for believing the accused is not guilty, and is not likely to commit any offence while on bail—are constitutional and valid.

5. In conclusion, the appeals and writ petitions are disposed of in the terms recorded above.`,
  },
  {
    id: "prec-002",
    title: "Manish Sisodia vs Directorate of Enforcement",
    citation: "2024 INSC 595",
    court: "Supreme Court of India",
    caseType: "CRL.A",
    judgmentDate: "2024-08-09",
    outcome: "Allowed",
    bench: "B.R. Gavai, K.V. Viswanathan, JJ.",
    similarityScore: 0.842,
    keywordScore: 0.618,
    wordCount: 9240,
    summary: {
      facts:
        "Criminal appeals seeking regular bail in connection with the Delhi Excise Policy case probed by both CBI and ED, following prolonged incarceration of 17 months without commencement of trial.",
      issue:
        "Whether prolonged custody without commencement of trial overrides the statutory twin conditions under Section 45 PMLA by virtue of fundamental right under Article 21.",
      holding:
        "The Supreme Court held that prolonged incarceration without trial infringes the fundamental right to speedy trial under Article 21. Section 45 PMLA does not extinguish constitutional protections where there is no likelihood of trial conclusion in foreseeable future.",
      outcomeText:
        "Appeals allowed; appellant directed to be released on regular bail subject to conditions including surrender of passport.",
    },
    matchedSnippets: [
      "...prolonged incarceration before conviction cannot be turned into punishment without trial. Section 45 PMLA cannot be read to obliterate Article 21 of the Constitution...",
      "...where the trial is not likely to conclude within reasonable time and delay is not attributable to the accused, statutory restrictions on bail must yield to constitutional liberty...",
    ],
    fullText: `IN THE SUPREME COURT OF INDIA
CRIMINAL APPELLATE JURISDICTION

CRIMINAL APPEAL NO. 3295 OF 2024
(Arising out of SLP (Crl.) No. 8781 of 2024)

MANISH SISODIA                                                  ...APPELLANT
                                   VERSUS
DIRECTORATE OF ENFORCEMENT                                     ...RESPONDENT

JUDGMENT
B.R. GAVAI, J.

1. Leave granted.
2. The appellant has approached this Court challenging the judgment of the High Court of Delhi declining to grant bail in cases registered by the Central Bureau of Investigation and the Directorate of Enforcement.
3. The appellant has been incarcerated for a period of 17 months. There are 493 witnesses and thousands of pages of documents. The trial has not even commenced at the stage of framing charges.
4. We are conscious of Section 45 of the PMLA. However, statutory provisions cannot be interpreted in a manner that defeats the guarantee of speedy trial under Article 21. Where custody becomes punitive due to inexcusable delay, bail must be granted.
5. In the result, the appeal is allowed.`,
  },
  {
    id: "prec-003",
    title: "Satender Kumar Antil vs Central Bureau of Investigation & Anr",
    citation: "(2022) 10 SCC 51",
    court: "Supreme Court of India",
    caseType: "SLP(Crl)",
    judgmentDate: "2022-07-11",
    outcome: "Disposed",
    bench: "Sanjay Kishan Kaul, M.M. Sundresh, JJ.",
    similarityScore: 0.795,
    keywordScore: 0.485,
    wordCount: 11200,
    summary: {
      facts:
        "Guidelines issued to trial courts and investigating agencies regarding arrest, remand, and categorization of offences for consideration of bail under CrPC.",
      issue:
        "Whether mechanical arrests and routine dismissals of bail applications congest prisons and how trial courts should exercise discretion across categorized offences.",
      holding:
        "Laid down comprehensive guidelines dividing offences into Category A (bailable/summons), Category B (non-bailable, <7 yrs), Category C (special statutes like PMLA/NDPS), and Category D (economic offences).",
      outcomeText:
        "Directions issued to all High Courts and State Governments to ensure strict compliance with Section 41 and 41A CrPC.",
    },
    matchedSnippets: [
      "...arrest is a draconian measure which must be resorted to only when necessary. Jails in India are overflowing with undertrial prisoners...",
      "...for Category C offences involving special statutes, compliance with statutory preconditions must be balanced with consideration of prolonged custody...",
    ],
    fullText: `IN THE SUPREME COURT OF INDIA
CRIMINAL APPELLATE JURISDICTION

SPECIAL LEAVE TO APPEAL (CRL.) NO. 5191 OF 2021

SATENDER KUMAR ANTIL                                           ...APPELLANT
                                   VERSUS
CENTRAL BUREAU OF INVESTIGATION & ANR.                         ...RESPONDENTS

ORDER
SANJAY KISHAN KAUL, J.

1. Our experience shows that despite repeated pronouncements, magistrate courts and trial courts continue to adopt a routine and mechanical approach in matters of remand and bail.
2. We have categorized offences into four distinct groups (A to D) to streamline bail adjudications across trial courts in the country.
3. Compliance with Section 41 and 41A of the Code is mandatory. Non-compliance must entitle the accused to grant of bail without custodial detention.`,
  },
  {
    id: "prec-004",
    title: "P. Chidambaram vs Directorate of Enforcement",
    citation: "(2019) 9 SCC 24",
    court: "Supreme Court of India",
    caseType: "CRL.A",
    judgmentDate: "2019-12-04",
    outcome: "Allowed",
    bench: "R. Banumathi, A.S. Bopanna, Hrishikesh Roy, JJ.",
    similarityScore: 0.771,
    keywordScore: 0.521,
    wordCount: 8400,
    summary: {
      facts:
        "Appeal against Delhi High Court order denying regular bail in the INX Media PMLA case. Accused had been in custody for 105 days with chargesheet already filed.",
      issue:
        "Whether gravity of economic offence is by itself an absolute ground for refusal of regular bail when investigation is complete.",
      holding:
        "The Court held that economic offences are serious, but gravity alone cannot justify denial of bail when flight risk, tampering with evidence, and influencing witnesses are absent.",
      outcomeText:
        "Appeal allowed; bail granted upon furnishing personal bond of Rs 2 lakhs.",
    },
    matchedSnippets: [
      "...even if allegation is of grave economic offence, it is not a rule that bail should be denied in every case without considering the trinity criteria...",
    ],
    fullText: `IN THE SUPREME COURT OF INDIA
CRIMINAL APPELLATE JURISDICTION

CRIMINAL APPEAL NO. 1831 OF 2019

P. CHIDAMBARAM                                                 ...APPELLANT
                                   VERSUS
DIRECTORATE OF ENFORCEMENT                                     ...RESPONDENT

JUDGMENT
R. BANUMATHI, J.

1. The appellant is in judicial custody since 05.09.2019. The chargesheet has already been filed by the investigating agency.
2. The basic jurisprudence relating to bail remains that bail is the rule and jail is the exception. Gravity of the offence alone is not the sole factor.`,
  },
];

export const MOCK_CASES: CourtCase[] = [
  {
    id: "case-001",
    caseNo: "CRL.A. 1421/2023",
    caseType: "CRL.A",
    court: "Supreme Court of India",
    filingDate: "2023-04-12",
    hearingsCount: 14,
    status: "hearing",
    bench: "Court No. 4 (Justice B.R. Gavai & Justice K.V. Viswanathan)",
    petitioner: "Hemant Agarwal & Ors.",
    respondent: "Directorate of Enforcement, New Delhi",
    actsSections: ["PMLA §3", "PMLA §4", "PMLA §45", "CrPC §439"],
    description:
      "Regular bail appeal in an alleged mining concession money-laundering case. Appellant has undergone 21 months of pre-trial incarceration. Chargesheet contains 128 witnesses and 14,000 pages of electronic documents. Prosecution has not supplied unredacted copies of digital hash certificates. Applicant invokes Article 21 speedy trial protections in light of Manish Sisodia precedent.",
    top1Similarity: 0.884,
    meanTop5Similarity: 0.812,
    countAboveThreshold: 4,
    matchedPrecedentIds: ["prec-001", "prec-002", "prec-003", "prec-004"],
    prediction: {
      predictedDays: 78,
      complexity: "Medium",
      priorityScore: 84.5,
      confidenceIntervalDays: [60, 95],
      precedentConfidence: 0.91,
      shapFactors: [
        {
          feature: "Precedent Strength (Top-1 Sim 0.884)",
          impact: "reduces_delay",
          impactDays: -52,
          plainEnglishReason:
            "Binding precedent in Manish Sisodia (2024) and Vijay Madanlal provides clear guidelines on Article 21 vs §45 PMLA, narrowing required judicial deliberations.",
        },
        {
          feature: "Prolonged Incarceration (21 months)",
          impact: "reduces_delay",
          impactDays: -38,
          plainEnglishReason:
            "Extended custody triggers priority disposal under Supreme Court speedy trial directives.",
        },
        {
          feature: "Document Volume (14,000 pages)",
          impact: "increases_delay",
          impactDays: +22,
          plainEnglishReason:
            "Large evidentiary annexures require forensic verification during arguments on charges.",
        },
        {
          feature: "Hearing Velocity (14 hearings in 19 months)",
          impact: "increases_delay",
          impactDays: +14,
          plainEnglishReason:
            "Moderate adjournment frequency due to respondent supplementary counter-affidavits.",
        },
      ],
    },
  },
  {
    id: "case-002",
    caseNo: "W.P.(C) 4120/2022",
    caseType: "W.P.(C)",
    court: "High Court of Delhi",
    filingDate: "2022-03-18",
    hearingsCount: 22,
    status: "reserved",
    bench: "Court No. 12 (Justice Prathiba M. Singh)",
    petitioner: "Novartis Healthcare Pvt Ltd",
    respondent: "Union of India & Controller General of Patents",
    actsSections: ["Patents Act §3(d)", "Patents Act §8", "Constitution Art. 226"],
    description:
      "Writ petition challenging rejection of pharmaceutical patent extension application for sustained-release crystalline formulation. Key question of enhanced efficacy under Section 3(d) and retroactivity of examination guidelines.",
    top1Similarity: 0.762,
    meanTop5Similarity: 0.694,
    countAboveThreshold: 2,
    matchedPrecedentIds: ["prec-003"],
    prediction: {
      predictedDays: 32,
      complexity: "High",
      priorityScore: 71.0,
      confidenceIntervalDays: [20, 45],
      precedentConfidence: 0.74,
      shapFactors: [
        {
          feature: "Stage: Judgment Reserved",
          impact: "reduces_delay",
          impactDays: -85,
          plainEnglishReason:
            "Arguments fully concluded on 28-Oct-2024; pronouncement expected within 60 days per court circular.",
        },
        {
          feature: "Technical Patent Domain (§3(d) Efficacy)",
          impact: "increases_delay",
          impactDays: +35,
          plainEnglishReason:
            "Scientific affidavit cross-referencing increases drafting time for final order.",
        },
        {
          feature: "Precedent Divergence (HC vs SC)",
          impact: "increases_delay",
          impactDays: +18,
          plainEnglishReason:
            "Conflicting High Court single bench rulings on molecular polymorphism.",
        },
      ],
    },
  },
  {
    id: "case-003",
    caseNo: "SLP(C) 9842/2024",
    caseType: "SLP(C)",
    court: "Supreme Court of India",
    filingDate: "2024-05-02",
    hearingsCount: 4,
    status: "pending",
    bench: "Court No. 7 (Justice Sanjiv Khanna & Justice Dipankar Datta)",
    petitioner: "Larsen & Toubro Infrastructure Ltd",
    respondent: "National Highways Authority of India (NHAI)",
    actsSections: ["Arbitration Act §34", "Arbitration Act §37", "Commercial Courts Act"],
    description:
      "Special Leave Petition challenging Division Bench setting aside of arbitral award of Rs 342 Crores under Section 37 on grounds of patent illegality and public policy.",
    top1Similarity: 0.815,
    meanTop5Similarity: 0.748,
    countAboveThreshold: 3,
    matchedPrecedentIds: ["prec-001", "prec-003"],
    prediction: {
      predictedDays: 145,
      complexity: "High",
      priorityScore: 58.2,
      confidenceIntervalDays: [110, 180],
      precedentConfidence: 0.82,
      shapFactors: [
        {
          feature: "Commercial Quantum (> Rs 100 Cr)",
          impact: "increases_delay",
          impactDays: +42,
          plainEnglishReason:
            "Complex commercial claims routinely require multi-session hearing schedule.",
        },
        {
          feature: "Recent Section 34 / 37 Precedents (Delhi Airport Metro)",
          impact: "reduces_delay",
          impactDays: -30,
          plainEnglishReason:
            "Strict non-interference precedent in Ssangyong / Delhi Metro limits scope of judicial re-appreciation of evidence.",
        },
      ],
    },
  },
  {
    id: "case-004",
    caseNo: "CRL.A. 612/2021",
    caseType: "CRL.A",
    court: "High Court of Bombay",
    filingDate: "2021-08-14",
    hearingsCount: 31,
    status: "hearing",
    bench: "Court No. 9 (Justice Revati Mohite Dere)",
    petitioner: "State of Maharashtra",
    respondent: "Iqbal Shaikh & Ors.",
    actsSections: ["IPC §302", "IPC §120B", "Arms Act §25", "MCOCA §3(1)"],
    description:
      "State appeal against acquittal of 4 accused in organized crime homicide. Involves electronic CDR voice sample admissibility and retracted confession before Judicial Magistrate under Section 18 MCOCA.",
    top1Similarity: 0.702,
    meanTop5Similarity: 0.641,
    countAboveThreshold: 1,
    matchedPrecedentIds: ["prec-003"],
    prediction: {
      predictedDays: 210,
      complexity: "High",
      priorityScore: 89.0,
      confidenceIntervalDays: [180, 260],
      precedentConfidence: 0.65,
      shapFactors: [
        {
          feature: "Case Age (> 3.5 Years Pending)",
          impact: "reduces_delay",
          impactDays: -60,
          plainEnglishReason:
            "Identified as 'Long-Pending Backlog' under NJDG target clearance program, granting priority listing.",
        },
        {
          feature: "MCOCA Confession Evidentiary Ambiguity",
          impact: "increases_delay",
          impactDays: +48,
          plainEnglishReason:
            "Lack of unified precedent on retracted confessions given to SP-rank officers.",
        },
      ],
    },
  },
  {
    id: "case-005",
    caseNo: "CIV.A. 2198/2023",
    caseType: "CIV.A",
    court: "High Court of Karnataka",
    filingDate: "2023-09-05",
    hearingsCount: 7,
    status: "pending",
    bench: "Court No. 3 (Justice Krishna S. Dixit)",
    petitioner: "Bangalore Metropolitan Transport Corp",
    respondent: "Union Bank of India & Anr",
    actsSections: ["SARFAESI Act §13(4)", "IBC §14 Moratorium", "Contract Act §126"],
    description:
      "Commercial appeal on interplay between IBC Section 14 moratorium and invocation of third-party performance bank guarantees executed prior to corporate insolvency resolution process.",
    top1Similarity: 0.856,
    meanTop5Similarity: 0.792,
    countAboveThreshold: 4,
    matchedPrecedentIds: ["prec-001", "prec-003"],
    prediction: {
      predictedDays: 92,
      complexity: "Medium",
      priorityScore: 78.5,
      confidenceIntervalDays: [75, 115],
      precedentConfidence: 0.89,
      shapFactors: [
        {
          feature: "Binding Supreme Court Authority (SBI vs V. Ramakrishnan)",
          impact: "reduces_delay",
          impactDays: -45,
          plainEnglishReason:
            "Settled law that Section 14 IBC does not bar invocation of independent corporate bank guarantee.",
        },
        {
          feature: "Clean Single-Issue Law Question",
          impact: "reduces_delay",
          impactDays: -25,
          plainEnglishReason:
            "No disputed factual testimony; decision rests entirely on pure question of statutory interpretation.",
        },
      ],
    },
  },
];

export const MOCK_MODEL_METRICS: ModelMetricComparison[] = [
  {
    metric: "Mean Absolute Error (MAE)",
    metadataOnly: 148.6,
    withPrecedents: 89.2,
    improvementPct: 40.0,
    unit: "days",
  },
  {
    metric: "Root Mean Square Error (RMSE)",
    metadataOnly: 214.3,
    withPrecedents: 126.8,
    improvementPct: 40.8,
    unit: "days",
  },
  {
    metric: "Coefficient of Determination (R²)",
    metadataOnly: 0.384,
    withPrecedents: 0.712,
    improvementPct: 85.4,
    unit: "score (0-1)",
  },
  {
    metric: "Resolution within ±45 Days",
    metadataOnly: 42.1,
    withPrecedents: 74.6,
    improvementPct: 77.2,
    unit: "% accuracy",
  },
  {
    metric: "Complexity Classification F1",
    metadataOnly: 0.58,
    withPrecedents: 0.84,
    improvementPct: 44.8,
    unit: "macro F1",
  },
];

export const MOCK_FEATURE_IMPORTANCE: FeatureImportance[] = [
  {
    rank: 1,
    featureName: "top1_precedent_similarity",
    category: "Precedent Intelligence",
    meanShap: 0.324,
    direction: "Higher similarity strongly reduces resolution days (settled law effect)",
    description: "Cosine similarity of closest historical Indian Supreme Court / High Court judgment",
  },
  {
    rank: 2,
    featureName: "outcome_agreement_top5",
    category: "Precedent Intelligence",
    meanShap: 0.241,
    direction: "Consensus among precedents accelerates hearings (less bench divergence)",
    description: "Ratio of top-5 precedents reaching identical outcome (Allowed vs Dismissed)",
  },
  {
    rank: 3,
    featureName: "case_filing_age_days",
    category: "Case Metadata",
    meanShap: 0.186,
    direction: "Older cases receive accelerated listing priority under judicial clearance rules",
    description: "Elapsed days since formal case registration in court registry",
  },
  {
    rank: 4,
    featureName: "hearings_count",
    category: "Procedural",
    meanShap: 0.142,
    direction: "High hearing count correlates with procedural adjournments and evidentiary disputes",
    description: "Total recorded listings where judicial orders or arguments occurred",
  },
  {
    rank: 5,
    featureName: "precedent_age_mean",
    category: "Precedent Intelligence",
    meanShap: 0.118,
    direction: "Recent precedents (< 3 years) offer modern legislative alignment",
    description: "Average age of retrieved top-5 matching judgments in years",
  },
  {
    rank: 6,
    featureName: "document_word_count",
    category: "Case Metadata",
    meanShap: 0.089,
    direction: "Higher volume correlates with multi-party annexures and extended arguments",
    description: "Total token length of petition description and grounds",
  },
];
