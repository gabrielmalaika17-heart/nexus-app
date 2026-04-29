# NEXUS - Prototype planner, fitness, sommeil, focus et IA

Ce dossier contient une première version interactive du projet NEXUS. C'est un prototype web mobile qui permet de valider l'expérience avant de passer à une vraie application iPhone en SwiftUI.

## Ouvrir le prototype sur ton ordinateur

Ouvre `index.html` dans un navigateur.

## Installer sur iPhone

Pour que l'iPhone puisse l'installer comme une app, il faut une URL web. Le fichier local Windows ne peut pas etre ajoute proprement depuis Safari iPhone.

La meilleure option gratuite :

1. Mettre ce dossier sur GitHub.
2. Activer GitHub Pages.
3. Ouvrir l'URL GitHub Pages sur l'iPhone avec Safari.
4. Appuyer sur Partager.
5. Choisir Ajouter a l'ecran d'accueil.

Ensuite NEXUS s'ouvre comme une app plein ecran. Le mode hors ligne fonctionne apres une premiere ouverture depuis l'URL.

## Ce qui fonctionne déjà

- Navigation en 5 sections : PLANIF, FITNESS, SOMMEIL, BLOQUER, NEXUS AI.
- Mode visuel holographique HUD avec switch classique/holographique.
- Tableau de bord central Nexus avec noyau IA, anneaux radar et modules flottants.
- Direction artistique rapprochée du design premium fourni : fond noir/bleu profond, cyan néon, violet, vert énergie, cartes glass et navigation basse HUD.
- Écran Home rapproché de la nouvelle référence : focus actif, statut système, accès rapide 2x4 et agenda du jour premium.
- Planification intelligente : catégories rapides, vues jour/semaine/mois, tâches détaillées, rappels, répétitions, priorités 1-5, édition, suppression et suggestions Nexus IA.
- Panneau premium d'ajout/modification de tâche inspiré des maquettes fournies.
- Ajout et validation de tâches avec catégories colorées.
- Progression globale de la journée.
- Sauvegarde locale dans le navigateur.
- Installation PWA avec `manifest.webmanifest` et `sw.js`.
- Tableau fitness avec anneaux, rythme cardiaque animé et exercices de salle.
- Fiches d'exercices détaillées en français avec visuel animé, onglets, instructions, historique, graphiques et records.
- Bibliothèque salle et maison, programmes prêts à utiliser, ajout à l'entraînement du jour et notation de performance.
- Suivi nutrition type MacroFactor : calories, protéines, glucides, lipides, fibres, portions, photo de repas préparée pour IA et correction manuelle.
- Profil complet : poids, poids cible, taille, âge, sexe, activité, fréquence, objectif, délai et rythme.
- Tableau de bord progression : poids, calories restantes, eau, pas, messages d'ajustement.
- Préparation smartwatch : Apple Watch, Fitbit et Garmin côté interface, avec intégration réelle à faire via HealthKit/API plus tard.
- Sommeil avec score, phases, historique et saisie coucher/réveil.
- Focus volontaire avec sélection d'apps, heure de fin, confirmation utilisateur et minuteur.
- Assistant NEXUS AI simulé avec réponses basées sur le contexte local.

## Limites réalistes iPhone

Le blocage réel d'applications sur iPhone devra passer par les frameworks Apple Screen Time, notamment FamilyControls, ManagedSettings et DeviceActivity. La logique doit rester volontaire : l'utilisateur choisit les apps, approuve la session et garde le contrôle.

## Suite technique recommandée

1. Refaire cette interface en SwiftUI.
2. Ajouter SwiftData pour les tâches, séances, nuits et sessions focus.
3. Ajouter HealthKit pour fitness/sommeil.
4. Remplacer les démonstrations simulées par des vidéos possédées ou licenciées.
5. Brancher NEXUS AI sur un backend sécurisé qui appelle Claude ou OpenAI.
6. Demander l'entitlement Apple Family Controls si le blocage natif devient prioritaire.
