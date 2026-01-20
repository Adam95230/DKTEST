# Accès depuis votre téléphone

## Configuration automatique

Le site détecte automatiquement l'adresse IP et s'adapte. Les APIs utilisent maintenant l'adresse IP de votre ordinateur au lieu de `localhost`.

## Étapes pour accéder depuis votre téléphone

### 1. Trouver l'adresse IP de votre ordinateur

**Sur Windows :**
```powershell
ipconfig
```
Cherchez l'adresse IPv4 (généralement sous "Carte réseau sans fil Wi-Fi" ou "Adaptateur Ethernet"), par exemple : `192.168.1.100`

**Alternative :**
- Ouvrez PowerShell
- Tapez : `Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.InterfaceAlias -notlike "*Loopback*"} | Select-Object IPAddress`

### 2. Démarrer les serveurs

1. **Démarrer l'API Docker (musique)** - Port 8631
   - Assurez-vous que votre API Docker écoute sur `0.0.0.0:8631` et non `localhost:8631`
   - Si nécessaire, modifiez la configuration Docker pour exposer le port sur toutes les interfaces

2. **Démarrer le serveur d'authentification** - Port 8632
   ```bash
   cd apple-music-frontend
   node server.js
   ```
   Le serveur affichera maintenant : `Network access: http://VOTRE_IP:8632`

3. **Démarrer le serveur de développement Vite** - Port 5173
   ```bash
   npm run dev
   ```
   Vite affichera maintenant l'URL réseau dans la console

### 3. Accéder depuis votre téléphone

1. **Assurez-vous que votre téléphone est sur le même réseau Wi-Fi** que votre ordinateur

2. **Ouvrez le navigateur sur votre téléphone** et allez à :
   ```
   http://VOTRE_IP:5173
   ```
   Remplacez `VOTRE_IP` par l'adresse IP trouvée à l'étape 1 (ex: `192.168.1.100`)

### 4. Configuration de l'API Docker (si nécessaire)

Si votre API Docker n'est pas accessible depuis le réseau local, vous devez :

1. **Vérifier la configuration Docker** pour exposer le port 8631 sur toutes les interfaces
2. **Vérifier le firewall Windows** pour autoriser les connexions entrantes sur les ports 8631, 8632 et 5173

**Autoriser les ports dans le firewall Windows :**
```powershell
# Exécuter en tant qu'administrateur
New-NetFirewallRule -DisplayName "Apple Music API" -Direction Inbound -LocalPort 8631,8632,5173 -Protocol TCP -Action Allow
```

## Dépannage

### Le site ne se charge pas depuis le téléphone
- Vérifiez que tous les appareils sont sur le même réseau Wi-Fi
- Vérifiez que le firewall Windows autorise les connexions
- Vérifiez que les serveurs sont bien démarrés

### Les APIs ne fonctionnent pas
- Vérifiez que l'API Docker écoute sur `0.0.0.0` et non `localhost`
- Vérifiez les logs des serveurs pour voir les erreurs
- Assurez-vous que les ports ne sont pas bloqués par un antivirus

### L'adresse IP change
- Si votre IP change souvent, vous pouvez configurer une IP statique dans les paramètres de votre routeur
- Ou utilisez le nom d'hôte de votre ordinateur si votre routeur le supporte

