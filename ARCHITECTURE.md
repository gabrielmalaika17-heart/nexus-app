# Analyse et architecture - NEXUS

## Diagnostic

L'idée est réalisable, mais elle doit être séparée en deux niveaux :

- Prototype produit : interface, parcours utilisateur, tâches, fitness, sommeil, focus volontaire, assistant IA.
- Application iPhone native : accès HealthKit, vidéos AVKit, stockage SwiftData, éventuel blocage Screen Time avec autorisation Apple.

Le prototype actuel sert à valider le produit avant d'investir dans le développement iOS complet.

## IA capable de programmer le projet

Claude peut aider à programmer une grande partie du projet : SwiftUI, architecture, modèles de données, logique de recommandations et backend IA. ChatGPT ou Codex peuvent aussi aider fortement pour le code, le debug et la transformation du prototype en vraie app.

Aucune IA ne peut garantir seule :

- l'approbation Apple pour le blocage d'applications ;
- la publication App Store ;
- les certificats développeur ;
- les tests réels sur iPhone ;
- les droits sur les vidéos d'exercices.

## Stack cible

- iOS : SwiftUI.
- Données : SwiftData.
- Santé/fitness/sommeil : HealthKit.
- Blocage volontaire : FamilyControls, ManagedSettings, DeviceActivity.
- Vidéos : AVKit.
- IA : backend Node, Swift server ou Python léger qui appelle Claude/OpenAI.
- Notifications : UserNotifications.
- Extension future : Apple Watch, WidgetKit, ActivityKit.

## Plan de réalisation

### Phase 1 - MVP visible

- Convertir la maquette actuelle en SwiftUI.
- Créer les modèles Task, Workout, Exercise, SleepEntry, FocusSession.
- Sauvegarder localement avec SwiftData.
- Faire fonctionner les 5 onglets sans dépendre encore de HealthKit.

### Phase 2 - Données réelles

- Ajouter HealthKit pour pas, calories, fréquence cardiaque et sommeil.
- Ajouter les vidéos réelles d'exercices.
- Créer des programmes salle simples : Force, Cardio, HIIT, Full body.
- Ajouter l'analyse photo des repas via une API IA capable d'estimer les calories.
- Connecter Apple Watch via HealthKit, et Fitbit/Garmin via leurs API officielles si nécessaire.
- Transformer la simulation actuelle de smartwatch en connecteurs réels : Apple Health/HealthKit côté iPhone natif, Google Fit/Fitbit/Garmin/Samsung via OAuth et API serveur.
- Remplacer les animations CSS d'exercices par des vidéos licenciées ou produites par le projet.

### Phase 3 - IA contextuelle

- Créer un backend sécurisé.
- Envoyer un résumé structuré de la journée à Claude ou OpenAI.
- Ajouter les suggestions rapides et la réorganisation automatique.

### Phase 4 - Blocage iPhone avancé

- Implémenter le parcours volontaire.
- Tester FamilyControls/ManagedSettings/DeviceActivity.
- Demander l'entitlement Apple Family Controls.
- Garder un guide Temps d'écran comme solution de secours.

## Décision importante

La version 1 doit être vendue comme un outil de concentration volontaire, pas comme une app qui contrôle l'utilisateur. C'est plus sain, plus crédible et plus réaliste pour iPhone.
