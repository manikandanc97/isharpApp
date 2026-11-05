export type SampleQuestionOption = {
  label: string;
  textEn: string;
  textTa: string;
};

export type SampleQuestion = {
  id: string;
  subject: string;
  topic: string;
  difficulty: "Easy" | "Medium" | "Hard";
  questionEn: string;
  questionTa: string;
  options: SampleQuestionOption[];
  correctOption: string;
  explanationEn: string;
  explanationTa: string;
};

export const sampleDPPQuestions: SampleQuestion[] = [
  {
    id: "Q-NEET-2026-01",
    subject: "Physics",
    topic: "Rotational Motion",
    difficulty: "Medium",
    questionEn:
      "A solid sphere of mass M and radius R rolls without slipping down an inclined plane of inclination θ. What is the acceleration of the sphere?",
    questionTa:
      "M நிறையும் R ஆரமும் கொண்ட ஒரு திண்மக் கோளம் θ சாய்வு கொண்ட சாய்தளத்தில் நழுவாமல் உருளுகிறது. அக்கோளத்தின் முடுக்கம் என்ன?",
    options: [
      { label: "A", textEn: "g sin θ", textTa: "g sin θ" },
      { label: "B", textEn: "(5/7) g sin θ", textTa: "(5/7) g sin θ" },
      { label: "C", textEn: "(2/3) g sin θ", textTa: "(2/3) g sin θ" },
      { label: "D", textEn: "(7/5) g sin θ", textTa: "(7/5) g sin θ" },
    ],
    correctOption: "B",
    explanationEn:
      "For a rolling solid sphere, moment of inertia I = (2/5)MR². Acceleration a = (g sin θ) / (1 + I/MR²) = (g sin θ) / (1 + 2/5) = (5/7) g sin θ.",
    explanationTa:
      "உருளும் திண்மக் கோளத்திற்கு நிலைமத் திருப்புத்திறன் I = (2/5)MR². முடுக்கம் a = (g sin θ) / (1 + I/MR²) = (5/7) g sin θ.",
  },
  {
    id: "Q-NEET-2026-02",
    subject: "Biology (Botany)",
    topic: "Cell Cycle & Division",
    difficulty: "Easy",
    questionEn:
      "Crossing over occurs during which sub-stage of Prophase-I in meiosis?",
    questionTa:
      "குன்றல் பிரிவின் முதல் முன்நிலையின் (Prophase-I) எந்த துணை நிலையில் குறுக்கே கலத்தல் (Crossing over) நடைபெறுகிறது?",
    options: [
      { label: "A", textEn: "Leptotene", textTa: "லெப்டோடீன்" },
      { label: "B", textEn: "Zygotene", textTa: "சைகோடீன்" },
      { label: "C", textEn: "Pachytene", textTa: "பேக்கிட்டீன்" },
      { label: "D", textEn: "Diplotene", textTa: "டிப்ளோட்டீன்" },
    ],
    correctOption: "C",
    explanationEn:
      "Crossing over is an enzyme-mediated process (recombinase) occurring between non-sister chromatids of homologous chromosomes during the Pachytene stage.",
    explanationTa:
      "குறுக்கே கலத்தல் (Crossing over) என்பது ரீகாம்பினேஸ் நொதியால் நிகழும் செயல்முறையாகும். இது பேக்கிட்டீன் (Pachytene) நிலையில் உள்ள ஒத்த நிறமூர்த்தங்களின் உடன்பிறவா குரோமேட்டிட்களுக்கு இடையே நிகழ்கிறது.",
  },
];

