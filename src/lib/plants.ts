// Codex des plantes (copie générée de Ricochet/plants.py — ne pas modifier à la main).
export type PlantCategory = 'soin' | 'miel' | 'neutre' | 'toxique'
export interface Plant { name: string; category: PlantCategory; effect: number | null; seasons: number[] | null; description: string; shelfDays: number }
export const SEASONS = ["Mauvaise saison", "Feuilles nouvelles", "Feuilles vertes", "Feuilles mortes"]
export const PLANT_LIMIT = 20
export const PLANT_EXPIRY_DAYS = 30
export const PLANTS: Plant[] = [
  {
    "name": "Achillée Millefeuille",
    "category": "soin",
    "effect": 1,
    "seasons": [
      1,
      2
    ],
    "description": "Antidote et nettoyage de plaie, pas de soin direct.",
    "shelfDays": 30
  },
  {
    "name": "Bardane",
    "category": "soin",
    "effect": 2,
    "seasons": [
      3,
      0
    ],
    "description": "Racine utilisée contre les infections de morsures.",
    "shelfDays": 30
  },
  {
    "name": "Bourrache",
    "category": "soin",
    "effect": 2,
    "seasons": [
      1,
      2
    ],
    "description": "+1 PV supplémentaire pour les reines qui allaitent.",
    "shelfDays": 30
  },
  {
    "name": "Cataire",
    "category": "soin",
    "effect": 4,
    "seasons": [
      1,
      2,
      3
    ],
    "description": "Menthe des chats. Traitement des maladies graves, plante la plus puissante du codex.",
    "shelfDays": 30
  },
  {
    "name": "Cerfeuil",
    "category": "soin",
    "effect": 2,
    "seasons": [
      1,
      2
    ],
    "description": "Infections internes et douleurs abdominales.",
    "shelfDays": 30
  },
  {
    "name": "Consoude",
    "category": "soin",
    "effect": 3,
    "seasons": [
      1,
      2
    ],
    "description": "Fractures, tendons et plaies profondes.",
    "shelfDays": 30
  },
  {
    "name": "Écorce de Saule",
    "category": "soin",
    "effect": 1,
    "seasons": null,
    "description": "Analgésique, soulage sans guérir directement.",
    "shelfDays": 30
  },
  {
    "name": "Graines de Coquelicot",
    "category": "soin",
    "effect": 1,
    "seasons": [
      2
    ],
    "description": "Soulagement de la douleur, pas de soin direct.",
    "shelfDays": 30
  },
  {
    "name": "Menthe Aquatique",
    "category": "soin",
    "effect": 1,
    "seasons": [
      1,
      2,
      3
    ],
    "description": "Maux de ventre et nausées légères.",
    "shelfDays": 30
  },
  {
    "name": "Plantain",
    "category": "soin",
    "effect": 1,
    "seasons": [
      1,
      2,
      3
    ],
    "description": "Irritations mineures et petites plaies.",
    "shelfDays": 30
  },
  {
    "name": "Prêle",
    "category": "soin",
    "effect": 2,
    "seasons": [
      1,
      2
    ],
    "description": "Nettoyage de plaies infectées.",
    "shelfDays": 30
  },
  {
    "name": "Souci",
    "category": "soin",
    "effect": 2,
    "seasons": [
      1,
      2,
      3
    ],
    "description": "Prévention et traitement de l'infection cutanée.",
    "shelfDays": 30
  },
  {
    "name": "Tanaisie",
    "category": "soin",
    "effect": 2,
    "seasons": [
      2,
      3
    ],
    "description": "Toux persistante et douleurs articulaires.",
    "shelfDays": 30
  },
  {
    "name": "Toile d'Araignée",
    "category": "soin",
    "effect": 1,
    "seasons": null,
    "description": "Arrêt du saignement.",
    "shelfDays": 30
  },
  {
    "name": "Verge d'Or",
    "category": "soin",
    "effect": 2,
    "seasons": [
      2,
      3
    ],
    "description": "Cicatrisation des plaies récentes.",
    "shelfDays": 30
  },
  {
    "name": "Baies de Genévrier",
    "category": "soin",
    "effect": 2,
    "seasons": [
      3,
      0
    ],
    "description": "Douleurs abdominales et difficultés respiratoires.",
    "shelfDays": 30
  },
  {
    "name": "Mousse",
    "category": "neutre",
    "effect": null,
    "seasons": null,
    "description": "Litière confortable, isolation. Aucun effet mécanique.",
    "shelfDays": 30
  },
  {
    "name": "Fougère",
    "category": "neutre",
    "effect": null,
    "seasons": [
      1,
      2,
      3
    ],
    "description": "Camouflage et confort. Aucun effet mécanique.",
    "shelfDays": 30
  },
  {
    "name": "Écorce de Pin",
    "category": "neutre",
    "effect": null,
    "seasons": null,
    "description": "Aucun effet mécanique direct.",
    "shelfDays": 30
  },
  {
    "name": "Feuilles de Chêne",
    "category": "neutre",
    "effect": null,
    "seasons": [
      2,
      3
    ],
    "description": "Aucun effet mécanique direct.",
    "shelfDays": 30
  },
  {
    "name": "Miel",
    "category": "miel",
    "effect": 1,
    "seasons": [
      1,
      2
    ],
    "description": "Apaise la gorge et les brûlures. Ajouté à un remède (+1 au jet de soin), il fait passer les plantes amères.",
    "shelfDays": 120
  },
  {
    "name": "Baies d'If",
    "category": "toxique",
    "effect": -10,
    "seasons": [
      3,
      0
    ],
    "description": "TRÈS DANGEREUX. -10 PV par dose ingérée.",
    "shelfDays": 30
  },
  {
    "name": "Grande Ciguë",
    "category": "toxique",
    "effect": -8,
    "seasons": [
      1,
      2
    ],
    "description": "DANGEREUX. -8 PV par dose ingérée.",
    "shelfDays": 30
  },
  {
    "name": "Graines de Digitale",
    "category": "toxique",
    "effect": -8,
    "seasons": [
      2,
      3
    ],
    "description": "DANGEREUX. -8 PV par dose ingérée.",
    "shelfDays": 30
  },
  {
    "name": "Morelle Noire",
    "category": "toxique",
    "effect": -5,
    "seasons": [
      2,
      3
    ],
    "description": "Toxique. -5 PV par dose ingérée.",
    "shelfDays": 30
  },
  {
    "name": "Aconit",
    "category": "toxique",
    "effect": -10,
    "seasons": [
      1,
      2
    ],
    "description": "Tue-Loup. TRÈS DANGEREUX. -10 PV par dose ingérée ou contact prolongé.",
    "shelfDays": 30
  },
  {
    "name": "Tanaisie en excès",
    "category": "toxique",
    "effect": -3,
    "seasons": [
      2,
      3
    ],
    "description": "Surdosage de Tanaisie. -3 PV.",
    "shelfDays": 30
  }
]
