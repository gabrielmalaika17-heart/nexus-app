# Cahier des charges synthétique - NEXUS

## Vision

NEXUS est une application iPhone de discipline personnelle qui fusionne planification, fitness, sommeil, concentration volontaire et assistant IA contextuel dans une interface futuriste.

## Modules

### PLANIF

L'utilisateur peut créer des tâches, leur donner une catégorie, suivre leur statut et visualiser sa progression quotidienne.

### FITNESS

L'utilisateur suit ses calories, ses pas, son hydratation, sa fréquence cardiaque et accède à des exercices de salle avec démonstrations vidéo.

### SOMMEIL

L'utilisateur visualise son score de récupération, ses phases de sommeil, son historique 7 jours et peut saisir manuellement son coucher/réveil.

### BLOQUER

L'utilisateur lance volontairement une session de concentration. Il choisit les apps, définit l'heure de fin, approuve la session, puis voit un minuteur. Sur iPhone, le blocage réel dépendra des autorisations Apple Screen Time.

### NEXUS AI

L'assistant reçoit le contexte du jour : tâches, progression, sommeil, fitness et focus. Il peut proposer une réorganisation, une séance, une heure de coucher ou un mode focus.

## Architecture cible iOS

- Interface : SwiftUI.
- Données locales : SwiftData.
- Santé : HealthKit.
- Blocage : FamilyControls, ManagedSettings, DeviceActivity.
- Vidéos : AVKit.
- IA : backend léger avec API Claude ou OpenAI.
- Notifications : UserNotifications.
- Widgets futurs : WidgetKit et ActivityKit.

## MVP

Le MVP doit contenir :

- Les 5 onglets.
- Gestion complète des tâches.
- Fitness avec bibliothèque d'exercices.
- Sommeil manuel.
- Mode focus volontaire.
- Assistant IA contextuel basique.

## Risques

- Approbation Apple pour le blocage natif.
- Protection des données santé.
- Coût et confidentialité liés aux appels IA.
- Besoin de vidéos d'exercices légalement utilisables.
