# Nexus OS - Préparation iPhone et Android Capacitor

## Installation

```bash
npm install
npx cap init Nexus com.nexus.app --web-dir=.
npx cap add ios
npx cap add android
npx cap sync ios
npx cap sync android
npx cap open ios
```

Si `capacitor.config.json` existe déjà, `cap init` peut être inutile. Lance alors seulement :

```bash
npm install
npx cap add ios
npx cap add android
npx cap sync ios
npx cap sync android
npx cap open ios
```

## Permissions iOS à ajouter dans Xcode

Ouvre `ios/App/App.xcworkspace`, puis ajoute dans `Info.plist` :

- `NSCameraUsageDescription` : `Nexus utilise la caméra pour prendre une photo de ton repas et estimer les calories.`
- `NSPhotoLibraryUsageDescription` : `Nexus peut accéder à tes photos si tu veux importer une photo de repas.`
- `NSHealthShareUsageDescription` : `Nexus lit tes données santé pour afficher tes pas, ton sommeil, ton activité et ta récupération.`
- `NSHealthUpdateUsageDescription` : `Nexus peut enregistrer certaines données santé si tu l’autorises.`

## HealthKit

Dans Xcode :

1. Sélectionne le target `App`.
2. Ouvre `Signing & Capabilities`.
3. Clique `+ Capability`.
4. Ajoute `HealthKit`.
5. Vérifie le Bundle Identifier : `com.nexus.app`.

## Backend Nexus IA

Ne mets jamais une clé IA dans `index.html` ou `app.js`.

```bash
copy .env.example .env
npm run server
```

Dans `.env`, choisis :

- `AI_PROVIDER=anthropic` avec `ANTHROPIC_API_KEY` pour Claude.
- `AI_PROVIDER=openai` avec `OPENAI_API_KEY` pour OpenAI.

Le frontend appelle `/api/nexus-ai`. En local iPhone/simulateur, adapte l’URL du backend si nécessaire.

## Android

Pour Android :

```bash
npx cap open android
```

Dans Android Studio, vérifie les permissions micro/caméra si elles sont demandées par les plugins. Le suivi sommeil web utilise le microphone avec `getUserMedia`; pour un suivi en arrière-plan écran verrouillé, il faudra plus tard un plugin natif Android/iOS.
