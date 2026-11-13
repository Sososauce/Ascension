// Exercices issus de free-exercise-db (github.com/yuhonas/free-exercise-db).
// Sélection, noms et consignes traduits en français pour l'appli.
// Les images sont dans public/exercises/<id>-0.jpg et <id>-1.jpg.

export type ExerciseKind = 'force' | 'endurance' | 'mobilite'
export type ExerciseGroup = 'jambes' | 'pousser' | 'tirer' | 'gainage' | 'cardio' | 'cardio_long' | 'souplesse'
/** Matériel minimal requis. */
export type ExerciseGear = 'aucun' | 'halteres' | 'salle'

export interface Exercise {
  id: string
  name: string
  kind: ExerciseKind
  group: ExerciseGroup
  gear: ExerciseGear
  /** 1 débutant, 2 intermédiaire, 3 avancé. */
  level: 1 | 2 | 3
  /** 'reps' : on compte des répétitions ; 'time' : on tient ou on enchaîne pendant une durée. */
  mode: 'reps' | 'time'
  /** Vrai si l'exercice se fait un côté puis l'autre. */
  perSide?: boolean
  steps: string[]
}

export const EXERCISES: Exercise[] = [
  // ——— Force, poids du corps
  {
    id: 'Pushups', name: 'Pompes', kind: 'force', group: 'pousser', gear: 'aucun', level: 1, mode: 'reps',
    steps: [
      'Allonge-toi face au sol, mains un peu plus écartées que les épaules, bras tendus, corps bien droit.',
      "Descends en inspirant jusqu'à ce que la poitrine frôle le sol.",
      'Repousse le sol en expirant pour revenir bras tendus, en contractant les pectoraux.',
      'Marque une courte pause en haut avant de redescendre.',
    ],
  },
  {
    id: 'Incline_Push-Up', name: 'Pompes inclinées', kind: 'force', group: 'pousser', gear: 'aucun', level: 1, mode: 'reps',
    steps: [
      "Place-toi face à un banc ou un support stable et pose les mains sur le bord, un peu plus écartées que les épaules.",
      'Recule les pieds pour avoir le corps et les bras bien droits.',
      'En gardant le corps gainé, plie les bras pour amener la poitrine vers le bord du support.',
      'Repousse jusqu\'à tendre les bras.',
    ],
  },
  {
    id: 'Bodyweight_Squat', name: 'Squat au poids du corps', kind: 'force', group: 'jambes', gear: 'aucun', level: 1, mode: 'reps',
    steps: [
      'Tiens-toi debout, pieds écartés à la largeur des épaules. Tu peux placer les mains derrière la tête.',
      'Plie les genoux et les hanches en envoyant les fesses vers l\'arrière.',
      'Descends aussi bas que tu peux, puis remonte sans temps mort.',
      'Garde la tête et la poitrine hautes et pousse les genoux vers l\'extérieur.',
    ],
  },
  {
    id: 'Butt_Lift_Bridge', name: 'Pont fessier', kind: 'force', group: 'jambes', gear: 'aucun', level: 1, mode: 'reps',
    steps: [
      'Allonge-toi sur le dos, bras le long du corps, genoux pliés, pieds à la largeur des épaules.',
      'Pousse dans les talons pour décoller les hanches en gardant le dos droit. Expire pendant la montée.',
      'Tiens une seconde en haut.',
      'Redescends lentement en inspirant.',
    ],
  },
  {
    id: 'Plank', name: 'Planche', kind: 'force', group: 'gainage', gear: 'aucun', level: 1, mode: 'time',
    steps: [
      'Place-toi face au sol, en appui sur les avant-bras et la pointe des pieds.',
      'Les coudes sont pliés, juste sous les épaules.',
      'Garde le corps parfaitement aligné et tiens la position.',
      'Pour corser, lève un bras ou une jambe.',
    ],
  },
  {
    id: 'Crunches', name: 'Crunchs', kind: 'force', group: 'gainage', gear: 'aucun', level: 1, mode: 'reps',
    steps: [
      'Allonge-toi sur le dos, genoux pliés, pieds à plat au sol.',
      'Pose les mains de chaque côté de la tête, coudes ouverts, sans croiser les doigts derrière la nuque.',
      'Plaque le bas du dos au sol et enroule les épaules pour les décoller, en expirant.',
      'Tiens une seconde en haut, puis redescends lentement.',
    ],
  },
  {
    id: 'Dead_Bug', name: 'Dead bug', kind: 'force', group: 'gainage', gear: 'aucun', level: 1, mode: 'reps',
    steps: [
      'Allonge-toi sur le dos, bras tendus vers le plafond, hanches et genoux pliés à 90 degrés.',
      'Expire fort pour abaisser les côtes et plaquer le dos au sol. Garde cette position tout du long.',
      "Tends une jambe jusqu'à frôler le sol, sans décoller le bas du dos.",
      'Reviens, puis change de jambe.',
    ],
  },
  {
    id: 'Bench_Dips', name: 'Dips sur banc', kind: 'force', group: 'pousser', gear: 'aucun', level: 1, mode: 'reps',
    steps: [
      'Dos à un banc ou une chaise stable, pose les mains sur le bord, à la largeur des épaules, bras tendus.',
      'Allonge les jambes devant toi.',
      "Descends lentement en pliant les coudes jusqu'à un angle d'environ 90 degrés, en inspirant.",
      'Remonte en poussant avec les triceps, en expirant.',
    ],
  },
  {
    id: 'Pullups', name: 'Tractions', kind: 'force', group: 'tirer', gear: 'salle', level: 2, mode: 'reps',
    steps: [
      'Saisis la barre, paumes vers l\'avant, mains à la largeur des épaules ou un peu plus.',
      'Bras tendus, incline légèrement le buste vers l\'arrière et sors la poitrine.',
      "Tire-toi vers le haut en ramenant les épaules et les coudes vers le bas et l'arrière, jusqu'à ce que la barre arrive à hauteur de poitrine. Expire.",
      'Redescends lentement, bras tendus, en inspirant.',
    ],
  },
  // ——— Force, haltères
  {
    id: 'Goblet_Squat', name: 'Squat goblet', kind: 'force', group: 'jambes', gear: 'halteres', level: 1, mode: 'reps',
    steps: [
      'Debout, tiens un haltère à deux mains contre la poitrine.',
      "Descends en squat entre tes jambes, aussi bas que possible.",
      'Garde la poitrine et la tête hautes, le dos droit.',
      'En bas, marque une pause, écarte les genoux avec les coudes, puis remonte.',
    ],
  },
  {
    id: 'Dumbbell_Floor_Press', name: 'Développé au sol avec haltères', kind: 'force', group: 'pousser', gear: 'halteres', level: 1, mode: 'reps',
    steps: [
      'Allonge-toi au sol, un haltère dans chaque main, genoux pliés.',
      'Commence bras tendus au-dessus de toi.',
      "Descends les haltères jusqu'à ce que l'arrière des bras touche le sol.",
      'Marque une pause en bas, puis repousse en tendant les coudes.',
    ],
  },
  {
    id: 'Bent_Over_Two-Dumbbell_Row', name: 'Rowing buste penché avec haltères', kind: 'force', group: 'tirer', gear: 'halteres', level: 1, mode: 'reps',
    steps: [
      'Un haltère dans chaque main, paumes face à face, plie légèrement les genoux et penche le buste en avant, dos droit, presque parallèle au sol.',
      'Laisse les bras pendre à la verticale. Garde la tête relevée.',
      'Sans bouger le buste, tire les haltères vers les côtés du torse, coudes près du corps, en expirant.',
      'Serre les omoplates une seconde, puis redescends lentement en inspirant.',
    ],
  },
  {
    id: 'Dumbbell_Shoulder_Press', name: 'Développé épaules avec haltères', kind: 'force', group: 'pousser', gear: 'halteres', level: 2, mode: 'reps',
    steps: [
      'Assis sur un banc avec dossier ou une chaise, amène les haltères à hauteur d\'épaules, paumes vers l\'avant.',
      "Expire et pousse les haltères vers le haut jusqu'à ce qu'ils se rejoignent.",
      'Marque une courte pause en haut.',
      'Redescends lentement à hauteur d\'épaules en inspirant.',
    ],
  },
  {
    id: 'Dumbbell_Bicep_Curl', name: 'Curl biceps avec haltères', kind: 'force', group: 'tirer', gear: 'halteres', level: 1, mode: 'reps',
    steps: [
      'Debout, un haltère dans chaque main, bras tendus, coudes près du buste, paumes vers l\'avant.',
      'Sans bouger le haut des bras, monte les haltères en contractant les biceps, en expirant.',
      "Continue jusqu'à hauteur d'épaules et tiens une courte pause.",
      'Redescends lentement en inspirant.',
    ],
  },
  {
    id: 'Dumbbell_Lunges', name: 'Fentes avec haltères', kind: 'force', group: 'jambes', gear: 'halteres', level: 1, mode: 'reps', perSide: true,
    steps: [
      'Debout, buste droit, un haltère dans chaque main le long du corps.',
      "Fais un grand pas en avant et descends en gardant le buste droit. Inspire pendant la descente.",
      'Le genou avant ne dépasse pas la pointe du pied, le tibia reste vertical.',
      'Pousse dans le talon avant pour revenir debout, en expirant. Change de jambe.',
    ],
  },
  {
    id: 'Stiff-Legged_Dumbbell_Deadlift', name: 'Soulevé de terre jambes tendues avec haltères', kind: 'force', group: 'jambes', gear: 'halteres', level: 2, mode: 'reps',
    steps: [
      'Debout, un haltère dans chaque main, pieds à la largeur des épaules ou plus serrés, genoux légèrement fléchis.',
      "Sans bouger les genoux, penche le buste en avant, dos droit, en descendant les haltères vers le dessus des pieds.",
      "Descends jusqu'à sentir l'étirement à l'arrière des cuisses.",
      'Redresse-toi en poussant les hanches vers l\'avant.',
    ],
  },
  {
    id: 'Standing_Dumbbell_Triceps_Extension', name: 'Extension triceps debout avec haltère', kind: 'force', group: 'pousser', gear: 'halteres', level: 1, mode: 'reps',
    steps: [
      'Debout, pieds à la largeur des épaules, tiens un haltère à deux mains et monte-le au-dessus de la tête, bras tendus.',
      'Garde le haut des bras près de la tête, coudes rentrés.',
      "Descends l'haltère derrière la tête en pliant les coudes, en inspirant.",
      'Remonte en tendant les bras, en expirant.',
    ],
  },
  // ——— Force, salle
  {
    id: 'Barbell_Squat', name: 'Squat à la barre', kind: 'force', group: 'jambes', gear: 'salle', level: 2, mode: 'reps',
    steps: [
      'Dans une cage à squat, règle la barre juste sous la hauteur des épaules, place-la sur le haut du dos et décroche-la.',
      'Recule, pieds à la largeur des épaules, pointes légèrement ouvertes, tête droite.',
      "Descends lentement en pliant les genoux et les hanches, dos droit, jusqu'à ce que les cuisses soient au moins parallèles au sol. Inspire.",
      'Remonte en poussant dans les talons, en expirant.',
    ],
  },
  {
    id: 'Barbell_Bench_Press_-_Medium_Grip', name: 'Développé couché à la barre', kind: 'force', group: 'pousser', gear: 'salle', level: 2, mode: 'reps',
    steps: [
      'Allonge-toi sur un banc plat. Avec une prise moyenne, décroche la barre et tiens-la bras tendus au-dessus de toi.',
      "Descends lentement en inspirant jusqu'à ce que la barre touche le milieu de la poitrine.",
      'Après une courte pause, repousse la barre en expirant.',
      'Garde le contrôle : la descente dure environ deux fois plus longtemps que la montée.',
    ],
  },
  {
    id: 'Wide-Grip_Lat_Pulldown', name: 'Tirage vertical prise large', kind: 'force', group: 'tirer', gear: 'salle', level: 1, mode: 'reps',
    steps: [
      'Assieds-toi à la machine de tirage, règle le cale-genoux à ta taille.',
      'Saisis la barre en prise large, paumes vers l\'avant. Incline le buste d\'environ 30 degrés vers l\'arrière et sors la poitrine.',
      "Tire la barre jusqu'en haut de la poitrine en ramenant les épaules et les coudes vers le bas et l'arrière. Expire.",
      'Serre les omoplates une seconde, puis remonte lentement, bras tendus, en inspirant.',
    ],
  },
  {
    id: 'Seated_Cable_Rows', name: 'Tirage horizontal à la poulie', kind: 'force', group: 'tirer', gear: 'salle', level: 1, mode: 'reps',
    steps: [
      'Assieds-toi à la poulie basse, pieds sur les repose-pieds, genoux légèrement fléchis.',
      'Saisis la poignée et redresse-toi, buste droit, bras tendus, poitrine sortie.',
      "Sans bouger le buste, tire la poignée vers le ventre, coudes près du corps, en expirant.",
      'Serre le dos une seconde, puis reviens lentement en inspirant.',
    ],
  },
  {
    id: 'Leg_Press', name: 'Presse à cuisses', kind: 'force', group: 'jambes', gear: 'salle', level: 1, mode: 'reps',
    steps: [
      'Installe-toi sur la presse, pieds sur le plateau à la largeur des épaules.',
      'Déverrouille les sécurités et pousse le plateau jusqu\'à tendre les jambes, sans verrouiller les genoux.',
      "Descends lentement en inspirant jusqu'à ce que les genoux forment un angle de 90 degrés.",
      'Repousse en appuyant surtout avec les talons, en expirant. Reverrouille les sécurités à la fin.',
    ],
  },
  {
    id: 'Barbell_Deadlift', name: 'Soulevé de terre à la barre', kind: 'force', group: 'tirer', gear: 'salle', level: 3, mode: 'reps',
    steps: [
      'Debout devant la barre chargée, dos aussi droit que possible, plie les genoux, penche-toi et saisis la barre, mains à la largeur des épaules.',
      'Soulève en poussant dans les jambes tout en redressant le buste, en expirant.',
      'En haut, sors la poitrine et serre les omoplates.',
      'Redescends en pliant les genoux et en penchant le buste, dos droit, en inspirant.',
    ],
  },
  // ——— Endurance
  {
    id: 'Mountain_Climbers', name: 'Mountain climbers', kind: 'endurance', group: 'cardio', gear: 'aucun', level: 1, mode: 'time',
    steps: [
      'Mets-toi en position de pompe, en appui sur les mains et la pointe des pieds.',
      'Ramène un genou sous la hanche.',
      "Inverse les jambes de façon explosive : tends la jambe pliée et ramène l'autre genou.",
      'Enchaîne en alternant, à ton rythme.',
    ],
  },
  {
    id: 'Star_Jump', name: 'Sauts en étoile', kind: 'endurance', group: 'cardio', gear: 'aucun', level: 1, mode: 'time',
    steps: [
      'Debout, détendu, pieds à la largeur des épaules, bras le long du corps.',
      'Descends en demi-squat puis saute le plus haut possible.',
      'En l\'air, étends tout le corps en écartant bras et jambes.',
      'Ramène bras et jambes et amortis la réception avec les jambes.',
    ],
  },
  {
    id: 'Freehand_Jump_Squat', name: 'Squats sautés', kind: 'endurance', group: 'cardio', gear: 'aucun', level: 2, mode: 'time',
    steps: [
      'Bras croisés sur la poitrine, tête haute, dos droit, pieds à la largeur des épaules.',
      "Descends en squat en inspirant, jusqu'à ce que les cuisses soient parallèles au sol ou plus bas.",
      'Pousse sur l\'avant des pieds et saute le plus haut possible, en expirant.',
      'À la réception, redescends aussitôt en squat et enchaîne.',
    ],
  },
  {
    id: 'Trail_Running_Walking', name: 'Course ou marche rapide', kind: 'endurance', group: 'cardio_long', gear: 'aucun', level: 1, mode: 'time',
    steps: [
      'Mets de bonnes chaussures et pars à une allure où tu peux encore parler.',
      'En montée, ce sont les mollets et les fessiers qui travaillent.',
      'En descente, fais de plus petits pas et garde les genoux fléchis pour limiter les chocs.',
      'Si tu cours, alterne avec de la marche quand tu en as besoin.',
    ],
  },
  {
    id: 'Bicycling_Stationary', name: 'Vélo stationnaire', kind: 'endurance', group: 'cardio_long', gear: 'salle', level: 1, mode: 'time',
    steps: [
      'Assieds-toi sur le vélo et règle la selle à ta hauteur.',
      'Choisis le mode manuel ou un programme. Il faut parfois commencer à pédaler pour allumer la console.',
      "Ajuste la résistance au fil de la séance.",
      'Les poignées peuvent mesurer ton rythme cardiaque pour t\'aider à rester à la bonne intensité.',
    ],
  },
  {
    id: 'Rowing_Stationary', name: 'Rameur', kind: 'endurance', group: 'cardio_long', gear: 'salle', level: 2, mode: 'time',
    steps: [
      'Assieds-toi sur le rameur, talons calés au fond des repose-pieds, sangles serrées.',
      'Départ : genoux pliés contre la poitrine, buste légèrement penché en avant, dos droit.',
      'Pousse dans les jambes, puis, jambes presque tendues, tire la poignée vers le ventre en te penchant un peu en arrière.',
      'Reviens dans l\'ordre inverse : bras, buste, puis jambes.',
    ],
  },
  {
    id: 'Running_Treadmill', name: 'Course sur tapis', kind: 'endurance', group: 'cardio_long', gear: 'salle', level: 1, mode: 'time',
    steps: [
      'Monte sur le tapis et choisis le mode manuel ou un programme.',
      "Règle la vitesse sur une allure que tu peux tenir, puis l'inclinaison pour faire varier l'intensité.",
      'Garde le buste droit et le regard devant toi.',
      'Ralentis progressivement avant de t\'arrêter.',
    ],
  },
  // ——— Mobilité
  {
    id: 'Cat_Stretch', name: 'Dos de chat', kind: 'mobilite', group: 'souplesse', gear: 'aucun', level: 1, mode: 'time',
    steps: [
      'Mets-toi à quatre pattes, mains et genoux au sol.',
      'Rentre le ventre et arrondis la colonne, le bas du dos, les épaules et la nuque en laissant tomber la tête.',
      'Tiens la position en respirant calmement.',
    ],
  },
  {
    id: 'Childs_Pose', name: "Posture de l'enfant", kind: 'mobilite', group: 'souplesse', gear: 'aucun', level: 1, mode: 'time',
    steps: [
      'À quatre pattes, avance les mains devant toi.',
      'Assieds-toi sur les talons en laissant les bras glisser au sol pour étirer toute la colonne.',
      'Pose le front au sol, relâche-toi et respire dans le dos.',
      'Évite cette position si tu as des problèmes de genoux.',
    ],
  },
  {
    id: 'Kneeling_Hip_Flexor', name: 'Étirement du fléchisseur de hanche', kind: 'mobilite', group: 'souplesse', gear: 'aucun', level: 1, mode: 'time', perSide: true,
    steps: [
      'À genoux sur un tapis, avance le pied droit à plat au sol et allonge la jambe gauche derrière toi, dessus du pied au sol.',
      "Déplace ton poids vers l'avant jusqu'à sentir l'étirement dans la hanche.",
      'Tiens, puis change de côté.',
    ],
  },
  {
    id: 'Hamstring_Stretch', name: 'Étirement des ischio-jambiers', kind: 'mobilite', group: 'souplesse', gear: 'aucun', level: 1, mode: 'time', perSide: true,
    steps: [
      'Allonge-toi sur le dos, une jambe levée, hanche à 90 degrés, l\'autre jambe à plat au sol.',
      'Passe une ceinture, une serviette ou un élastique autour de l\'avant du pied.',
      "Tire doucement pour mettre en tension le mollet et l'arrière de la cuisse.",
      'Tiens, puis change de jambe.',
    ],
  },
  {
    id: 'Arm_Circles', name: 'Cercles de bras', kind: 'mobilite', group: 'souplesse', gear: 'aucun', level: 1, mode: 'time',
    steps: [
      'Debout, tends les bras sur les côtés, parallèles au sol.',
      "Fais lentement des cercles d'environ 30 cm de diamètre, en respirant normalement.",
      'À mi-temps, inverse le sens de rotation.',
    ],
  },
  {
    id: 'Inchworm', name: 'Chenille', kind: 'mobilite', group: 'souplesse', gear: 'aucun', level: 1, mode: 'time',
    steps: [
      'Debout, pieds serrés, jambes tendues, penche-toi et pose les mains au sol devant toi.',
      "Avance les mains l'une après l'autre, en ne pliant qu'aux hanches, jusqu'à la position de pompe.",
      'Garde les mains en place et rapproche les pieds à petits pas, jambes tendues.',
      'Recommence.',
    ],
  },
  {
    id: 'Knee_Across_The_Body', name: 'Torsion allongée, genou croisé', kind: 'mobilite', group: 'souplesse', gear: 'aucun', level: 1, mode: 'time', perSide: true,
    steps: [
      'Allonge-toi sur le dos, jambe droite tendue.',
      'Plie la jambe gauche et amène-la de l\'autre côté du corps, en maintenant le genou vers le sol avec la main droite. Le genou n\'a pas besoin de toucher le sol.',
      'Pose le bras gauche le long du corps et tourne la tête à gauche.',
      'Laisse le bas du dos s\'étirer, puis change de côté.',
    ],
  },
  {
    id: 'Chest_And_Front_Of_Shoulder_Stretch', name: 'Étirement poitrine et épaules au bâton', kind: 'mobilite', group: 'souplesse', gear: 'aucun', level: 1, mode: 'time',
    steps: [
      'Debout, jambes serrées, tiens un bâton ou un manche à balai, prise un peu plus large que les épaules, paumes vers le bas.',
      'Monte lentement le bâton au-dessus puis derrière la tête.',
      'Reviens tout aussi lentement, sans forcer.',
    ],
  },
]

export const EXERCISE_BY_ID: Record<string, Exercise> = Object.fromEntries(EXERCISES.map((e) => [e.id, e]))
