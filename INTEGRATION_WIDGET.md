# Guide d'intégration du Widget Android

## Étape 1 : Générer les fichiers natifs Android

Si vous n'avez pas encore généré les fichiers natifs Android, exécutez :

```bash
npx expo prebuild
```

Cette commande génère le dossier `android/` avec tous les fichiers nécessaires.

## Étape 2 : Intégrer le WidgetPackage dans MainApplication.java

Après avoir exécuté `npx expo prebuild`, vous devez modifier le fichier :

`android/app/src/main/java/com/suslec/sobrietytracker/MainApplication.java`

### Option A : Si le fichier existe déjà

Ajoutez l'import en haut du fichier :

```java
import com.suslec.sobrietytracker.WidgetPackage;
```

Puis, dans la méthode `getPackages()`, ajoutez le package :

```java
@Override
protected List<ReactPackage> getPackages() {
    @SuppressWarnings("UnnecessaryLocalVariable")
    List<ReactPackage> packages = new PackageList(this).getPackages();
    // Ajouter cette ligne :
    packages.add(new WidgetPackage());
    return packages;
}
```

### Option B : Si vous utilisez le template fourni

Le fichier `android/app/src/main/java/com/suslec/sobrietytracker/MainApplication.java` que nous avons créé contient déjà l'intégration. Assurez-vous qu'il est bien à cet emplacement après le prebuild.

## Étape 3 : Vérifier AndroidManifest.xml

Le fichier `android/app/src/main/AndroidManifest.xml` que nous avons créé contient déjà la configuration du widget. Vérifiez qu'il inclut :

1. Les permissions nécessaires
2. Le receiver pour le widget
3. Le receiver pour le démarrage

## Étape 4 : Compiler et tester

### Avec Expo

```bash
# Créer un development build
npx expo run:android

# Ou créer une build avec EAS
eas build --platform android --profile preview
```

### Tester le widget

1. Installez l'application sur un appareil Android
2. Appuyez longuement sur l'écran d'accueil
3. Sélectionnez "Widgets" ou "App widgets"
4. Trouvez "DrinkAware" dans la liste
5. Faites glisser le widget sur l'écran d'accueil

## Vérification

Pour vérifier que tout fonctionne :

1. Le widget s'affiche avec "0" jours si aucune donnée n'est disponible
2. Après avoir ajouté une vérification quotidienne dans l'app, le widget se met à jour
3. Si des jours ne sont pas vérifiés, une icône d'avertissement apparaît
4. En cliquant sur le widget, l'application s'ouvre

## Dépannage

### Le widget n'apparaît pas dans la liste

- Vérifiez que vous avez bien compilé une version native (pas Expo Go)
- Vérifiez que `WidgetPackage` est bien ajouté dans `MainApplication.java`
- Vérifiez que `AndroidManifest.xml` contient bien la configuration du widget
- Nettoyez et recompilez : `cd android && ./gradlew clean && cd .. && npx expo run:android`

### Le widget ne se met pas à jour

- Vérifiez les logs : `adb logcat | grep Widget`
- Vérifiez que `WidgetService.updateWidget()` est appelé après chaque modification
- Vérifiez que les données sont bien sauvegardées dans `SharedPreferences`

### Erreurs de compilation

- Vérifiez que tous les fichiers Java sont dans le bon package (`com.suslec.sobrietytracker`)
- Vérifiez que les imports sont corrects
- Assurez-vous d'avoir les bonnes versions des dépendances React Native

## Notes importantes

- ⚠️ Les widgets Android nécessitent du code natif, donc ils ne fonctionnent **PAS** avec Expo Go
- Vous devez créer un **development build** ou une **build de production**
- Le widget se met à jour automatiquement toutes les heures (limite Android) ou manuellement via le module natif
- Les données sont synchronisées depuis React Native vers `SharedPreferences` via le `WidgetModule`

## Structure finale attendue

```
android/
├── app/
│   └── src/
│       └── main/
│           ├── AndroidManifest.xml (avec configuration widget)
│           └── java/
│               └── com/
│                   └── suslec/
│                       └── sobrietytracker/
│                           ├── MainApplication.java (avec WidgetPackage)
│                           ├── SobrietyWidgetProvider.java
│                           ├── WidgetModule.java
│                           └── WidgetPackage.java
```

