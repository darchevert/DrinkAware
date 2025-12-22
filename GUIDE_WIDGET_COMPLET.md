# Guide complet : Créer un APK avec le widget Android

## 📋 Prérequis

- Node.js installé
- EAS CLI installé (`npm install -g eas-cli`)
- Compte Expo (gratuit)

## 🚀 Étapes pour générer l'APK avec le widget

### Étape 1 : Vérifier que vous êtes connecté à EAS

```bash
eas login
```

### Étape 2 : Générer les fichiers natifs Android (IMPORTANT !)

Cette étape est **cruciale** pour que le widget soit inclus dans l'APK :

```bash
npx expo prebuild --platform android --clean
```

Cette commande :
- Génère tous les fichiers natifs Android nécessaires
- S'assure que vos fichiers de widget sont bien intégrés
- Prépare le projet pour la compilation

**⚠️ Important** : Si vous avez déjà un dossier `android/`, cette commande va le nettoyer et le régénérer. Vos fichiers de widget seront préservés car ils sont dans les bons emplacements.

### Étape 3 : Vérifier que MainApplication.java contient le WidgetPackage

Ouvrez le fichier : `android/app/src/main/java/com/suslec/sobrietytracker/MainApplication.java`

Il doit contenir :
```java
import com.suslec.sobrietytracker.WidgetPackage;

// Et dans getPackages() :
packages.add(new WidgetPackage());
```

✅ **C'est déjà fait dans votre projet !**

### Étape 4 : Vérifier AndroidManifest.xml

Ouvrez : `android/app/src/main/AndroidManifest.xml`

Il doit contenir le receiver pour le widget. ✅ **C'est déjà fait !**

### Étape 5 : Générer l'APK avec EAS

```bash
eas build --platform android --profile preview --clear-cache
```

Cette commande :
- Nettoie le cache pour éviter les problèmes
- Compile l'application avec tous les fichiers natifs
- Génère un APK que vous pouvez installer

### Étape 6 : Télécharger et installer l'APK

1. Une fois le build terminé, EAS vous donnera un lien pour télécharger l'APK
2. Téléchargez l'APK sur votre tablette Android
3. Installez-le (vous devrez peut-être autoriser l'installation depuis des sources inconnues)

### Étape 7 : Ajouter le widget

1. Appuyez **longuement** sur l'écran d'accueil de votre tablette
2. Sélectionnez **"Widgets"** ou **"App widgets"** (selon votre version Android)
3. Cherchez **"DrinkAware"** dans la liste
4. Faites glisser le widget sur l'écran d'accueil

## 🔍 Vérifications

### Si le widget n'apparaît toujours pas

1. **Vérifier les logs** :
   ```bash
   adb logcat | grep -i widget
   ```

2. **Vérifier que l'APK contient les fichiers** :
   - Décompressez l'APK (renommez-le en .zip)
   - Vérifiez qu'il contient `res/xml/widget_info.xml`

3. **Réessayer avec un nettoyage complet** :
   ```bash
   # Supprimer le dossier android
   rm -rf android
   
   # Régénérer
   npx expo prebuild --platform android
   
   # Rebuild
   eas build --platform android --profile preview --clear-cache
   ```

## 📝 Notes importantes

- ⚠️ **Ne pas utiliser Expo Go** : Le widget nécessite une build native, pas Expo Go
- ✅ **Toujours faire `prebuild`** avant de générer l'APK si vous modifiez des fichiers natifs
- 🔄 **Nettoyer le cache** si vous avez des problèmes avec `--clear-cache`

## 🆘 Problèmes courants

### "Le widget n'apparaît pas dans la liste"

**Solution** : Vérifiez que vous avez bien exécuté `npx expo prebuild` avant de générer l'APK.

### "Erreur lors du build"

**Solution** : Vérifiez les logs EAS et assurez-vous que tous les fichiers sont au bon endroit.

### "L'APK s'installe mais le widget n'est pas là"

**Solution** : Les fichiers du widget ne sont peut-être pas inclus. Réessayez avec `prebuild --clean`.

