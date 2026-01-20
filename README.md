# Apple Music Clone - ADK's Music

Un clone complet d'Apple Music avec design identique, utilisant LRCLIB pour les paroles et une API YouTube (pm-ytm) sous Docker.

## ✨ Fonctionnalités

- 🎵 Interface identique à Apple Music (macOS/Windows)
- 🌓 Mode sombre par défaut (comme Apple Music)
- 🎨 Design pixel-perfect avec les couleurs et animations d'Apple
- 📱 Responsive sur tous les appareils
- 🎤 Paroles synchronisées via LRCLIB
- 🎧 Lecture via API YouTube (pm-ytm sous Docker)
- 💾 Playlists personnalisées
- ❤️ Système de favoris
- 📊 Statistiques d'écoute
- ⌨️ Raccourcis clavier

## 🎨 Design

Le design a été refait pour correspondre exactement à Apple Music :

- **Couleurs** : Thème sombre profond (#000000, #1c1c1e)
- **Typographie** : SF Pro Display/Text avec letterspacing Apple
- **Spacing** : Espacements exacts d'Apple Music
- **Animations** : Transitions cubic-bezier(0.25, 0.1, 0.25, 1)
- **Player** : Barre de lecture style Apple Music (80px de hauteur)
- **Cards** : Album cards avec hover effects identiques
- **Blur effects** : backdrop-filter avec blur(40-60px)

## 🚀 Installation

```bash
# Installer les dépendances
npm install

# Démarrer le serveur de développement
npm run dev

# Builder pour la production
npm run build

# Démarrer le serveur backend
npm run server
```

## 🐳 Docker (pm-ytm)

Le projet utilise pm-ytm pour l'API YouTube. Assurez-vous que le conteneur Docker est en cours d'exécution :

```bash
docker run -d -p 3000:3000 pm-ytm
```

## 📁 Structure

```
.
├── src/
│   ├── components/       # Composants React
│   │   ├── AppleMusicLayout.tsx  # Layout principal
│   │   ├── Player.tsx            # Barre de lecture
│   │   ├── HomePage.tsx          # Page d'accueil
│   │   └── ...
│   ├── context/         # Contexts React (Auth, Player)
│   ├── hooks/           # Custom hooks
│   ├── services/        # API services
│   │   ├── api.ts       # API YouTube/LRCLIB
│   │   └── storage.ts   # LocalStorage
│   └── index.css        # Styles globaux Apple Music
├── data/                # Données utilisateurs/playlists
├── server.js            # Serveur Express
└── package.json
```

## 🎹 Raccourcis clavier

- **Espace** : Lecture/Pause
- **←/→** : Piste précédente/suivante
- **Cmd/Ctrl + K** : Recherche
- **Cmd/Ctrl + L** : Afficher les paroles
- **Cmd/Ctrl + ,** : Paramètres

## 🎯 Technologies

- **React 19** + TypeScript
- **Vite** pour le build
- **Express** pour le backend
- **LRCLIB** pour les paroles
- **pm-ytm** (Docker) pour la lecture YouTube
- **LocalStorage** pour la persistance

## 📱 Responsive

Le site est entièrement responsive avec des breakpoints Apple :

- Desktop : 1024px+
- Tablet : 768px - 1023px
- Mobile : < 768px

## 🌐 Hébergement

Pour héberger en production :

1. Builder le projet : `npm run build`
2. Déployer le dossier `dist/`
3. Configurer le serveur backend (`server.js`)
4. S'assurer que pm-ytm est accessible

## 📄 License

Ce projet est un clone éducatif d'Apple Music. Tous les droits de design appartiennent à Apple Inc.

## 🙏 Crédits

- Design : Apple Inc. (Apple Music)
- Paroles : LRCLIB API
- Musique : YouTube via pm-ytm
- Développement : ADK

---

**Note** : Ce projet est uniquement à des fins éducatives et de démonstration. Il n'est pas affilié à Apple Inc.
