import type { CurriculumTopic } from "./curriculum-types";

// Standard NEET topics for top chapters
const KNOWN_TOPICS: Record<string, string[]> = {
  "Physical World and Measurement": [
    "Units of Measurement & SI System",
    "Dimensional Analysis & Applications",
    "Errors in Measurement & Significant Figures",
    "Vernier Callipers and Screw Gauge Principles",
  ],
  "Kinematics": [
    "Frame of Reference & Straight Line Motion",
    "Instantaneous Speed and Velocity",
    "Uniform Acceleration & Kinematic Equations",
    "Motion in a Plane: Vectors & Projectile Motion",
    "Uniform Circular Motion",
  ],
  "Laws of Motion": [
    "Newton's First and Second Laws",
    "Impulse and Conservation of Momentum",
    "Static and Kinetic Friction",
    "Dynamics of Uniform Circular Motion",
    "Banking of Curves and Free-Body Diagrams",
  ],
  "Work, Energy and Power": [
    "Work Done by Constant & Variable Forces",
    "Kinetic Energy and Work-Energy Theorem",
    "Potential Energy & Conservation of Mechanical Energy",
    "Collisions in One and Two Dimensions",
  ],
  "Thermodynamics": [
    "Thermal Equilibrium & Zeroth Law",
    "First Law of Thermodynamics & Applications",
    "Isothermal and Adiabatic Processes",
    "Second Law of Thermodynamics & Carnot Engine",
    "Entropy and Reversible/Irreversible Changes",
  ],
  "Ray Optics and Optical Instruments": [
    "Reflection of Light & Spherical Mirrors",
    "Refraction, Total Internal Reflection & Optical Fibres",
    "Refraction through Lenses and Lens Maker's Formula",
    "Refraction through a Prism & Dispersion",
    "Microscopes and Astronomical Telescopes",
  ],
  "Some Basic Concepts of Chemistry": [
    "Nature of Matter & Laws of Chemical Combinations",
    "Atomic and Molecular Masses & Mole Concept",
    "Molar Mass, Percentage Composition & Empirical Formula",
    "Stoichiometry and Calculations Based on Stoichiometry",
  ],
  "Structure of Atom": [
    "Discovery of Sub-atomic Particles & Bohr's Model",
    "Dual Nature of Matter & de Broglie Principle",
    "Heisenberg Uncertainty Principle",
    "Quantum Mechanical Model & Quantum Numbers",
    "Aufbau Principle, Pauli Exclusion & Hund's Rule",
  ],
  "Chemical Bonding and Molecular Structure": [
    "Ionic Bonding and Lattice Enthalpy",
    "Covalent Bond, VSEPR Theory & Molecular Shapes",
    "Valence Bond Theory and Hybridization (sp, sp2, sp3, d)",
    "Molecular Orbital Theory of Homonuclear Diatomics",
    "Hydrogen Bonding & Dipole Moments",
  ],
  "Equilibrium": [
    "Equilibrium in Physical and Chemical Processes",
    "Law of Chemical Equilibrium and Equilibrium Constant (Kc, Kp)",
    "Le Chatelier's Principle & Applications",
    "Ionic Equilibrium: Acids, Bases and pH Scale",
    "Buffer Solutions and Solubility Product (Ksp)",
  ],
  "Cell: The Unit of Life": [
    "Cell Theory and Cell as a Basic Unit of Life",
    "Prokaryotic vs Eukaryotic Cells Architecture",
    "Plant Cell vs Animal Cell Structures",
    "Endomembrane System: ER, Golgi, Lysosomes, Vacuoles",
    "Mitochondria, Chloroplasts, Ribosomes and Cytoskeleton",
    "Nucleus, Chromosomes and Nuclear Pore Complex",
  ],
  "Plant Physiology": [
    "Transport of Water and Solutes in Plants",
    "Mineral Nutrition and Deficiency Symptoms",
    "Photosynthesis in Higher Plants (Light & Dark Reactions)",
    "Respiration in Plants: Glycolysis, Krebs Cycle & ETC",
    "Plant Growth Regulators and Photoperiodism",
  ],
  "Human Physiology": [
    "Digestion and Absorption Mechanism",
    "Breathing and Exchange of Gases",
    "Body Fluids and Circulation (Cardiovascular Dynamics)",
    "Excretory Products and Elimination (Nephron Function)",
    "Locomotion and Movement (Muscles & Skeletal Framework)",
    "Neural Control and Coordination (Sensory Organs)",
    "Chemical Coordination and Integration (Endocrine Axis)",
  ],
  "Genetics and Evolution": [
    "Mendelian Principles of Inheritance & Deviations",
    "Chromosomal Theory of Inheritance & Sex Determination",
    "Molecular Basis of Inheritance (DNA Replication, Transcription, Translation)",
    "Gene Expression and Lac Operon Model",
    "Theories of Evolution and Hardy-Weinberg Equilibrium",
  ],
};

export function generateDefaultTopicsForChapter(
  chapterTitle: string,
  chapterIndex: number
): CurriculumTopic[] {
  // Check known topics exact or fuzzy
  const matchedKey = Object.keys(KNOWN_TOPICS).find((k) =>
    chapterTitle.toLowerCase().includes(k.toLowerCase()) ||
    k.toLowerCase().includes(chapterTitle.toLowerCase())
  );

  const titles = matchedKey
    ? KNOWN_TOPICS[matchedKey]
    : [
        `${chapterTitle} – Fundamental Principles & Core Concepts`,
        `${chapterTitle} – Derivations & Analytical Frameworks`,
        `${chapterTitle} – High-Yield NEET Problem Solving & Numerical Applications`,
        `${chapterTitle} – Previous Years Exam Analysis & Revision Module`,
      ];

  return titles.map((title, idx) => ({
    id: `topic-${chapterIndex + 1}-${idx + 1}-${Date.now().toString(36)}`,
    title,
    position: idx + 1,
    isCovered: true,
    estimatedHours: 2 + (idx % 3),
  }));
}
