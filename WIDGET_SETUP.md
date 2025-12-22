# Guide d'installation du Widget Android

Ce guide explique comment intégrer le widget Android dans votre application Expo.

## Structure des fichiers créés

### Fichiers Android natifs

1. **Java/Kotlin** :
   - `android/app/src/main/java/com/suslec/sobrietytracker/SobrietyWidgetProvider.java` - Provider du widget
   - `android/app/src/main/java/com/suslec/sobrietytracker/WidgetModule.java` - Module React Native
   - `android/app/src/main/java/com/suslec/sobrietytracker/WidgetPackage.java` - Package React Native

2. **Ressources XML** :
   - `android/app/src/main/res/layout/widget_sobriety.xml` - Layout du widget
   - `android/app/src/main/res/drawable/widget_background.xml` - Fond du widget
   - `android/app/src/main/res/xml/widget_info.xml` - Configuration du widget
   - `android/app/src/main/res/values/strings.xml` - Chaînes de caractères

3. **Manifest** :
   - `android/app/src/main/AndroidManifest.xml` - Configuration Android

### Fichiers React Native

- `src/utils/WidgetService.ts` - Service pour mettre à jour le widget

## Étapes d'installation

### 1. Prérequis

Vous devez avoir un projet Expo avec un dev client (development build) car les widgets nécessitent du code natif.

```bash
# Si vous n'avez pas encore créé de dev client
npx expo prebuild
```

### 2. Intégration dans MainApplication.java

Vous devez enregistrer le `WidgetPackage` dans votre `MainApplication.java` :

```java
// android/app/src/main/java/com/suslec/sobrietytracker/MainApplication.java

import com.suslec.sobrietytracker.WidgetPackage;
// ... autres imports

@Override
protected List<ReactPackage> getPackages() {
    @SuppressWarnings("UnnecessaryLocalVariable")
    List<ReactPackage> packages = new PackageList(this).getPackages();
    // ... autres packages
    packages.add(new WidgetPackage()); // Ajouter cette ligne
    return packages;
}
```

### 3. Configuration du build

Le widget nécessite que vous construisiez une version native de l'application :

```bash
# Pour Android
eas build --platform android --profile preview
# ou
npx expo run:android
```

### 4. Test du widget

1. Installez l'application sur un appareil Android
2. Appuyez longuement sur l'écran d'accueil
3. Sélectionnez "Widgets"
4. Trouvez "DrinkAware" dans la liste
5. Ajoutez le widget à l'écran d'accueil

## Fonctionnalités du widget

- **Affichage de la série actuelle** : Affiche le nombre de jours consécutifs sobres
- **Indicateur de jours non vérifiés** : Affiche un avertissement si des jours n'ont pas été vérifiés dans les 7 derniers jours
- **Mise à jour automatique** : Le widget se met à jour automatiquement après chaque vérification quotidienne
- **Clic pour ouvrir l'app** : Taper sur le widget ouvre l'application

## Personnalisation

### Modifier l'apparence du widget

Éditez `android/app/src/main/res/layout/widget_sobriety.xml` pour changer :
- Les couleurs
- Les tailles de texte
- La disposition des éléments

### Modifier la fréquence de mise à jour

Par défaut, le widget se met à jour toutes les heures. Pour changer cela, modifiez `updatePeriodMillis` dans `widget_info.xml` :

```xml
<appwidget-provider
    android:updatePeriodMillis="1800000" <!-- 30 minutes -->
    ... />
```

**Note** : Android limite la fréquence minimale à 30 minutes pour économiser la batterie.

## Dépannage

### Le widget ne s'affiche pas

1. Vérifiez que vous avez bien compilé une version native (pas Expo Go)
2. Vérifiez que le `WidgetPackage` est bien enregistré dans `MainApplication.java`
3. Vérifiez les logs Android : `adb logcat | grep Widget`

### Le widget ne se met pas à jour

1. Vérifiez que `WidgetService.updateWidget()` est appelé après chaque modification de données
2. Vérifiez que les données sont bien sauvegardées dans `SharedPreferences`
3. Vérifiez les permissions dans `AndroidManifest.xml`

### Erreurs de compilation

Si vous avez des erreurs de compilation Java :
1. Vérifiez que tous les imports sont corrects
2. Vérifiez que le package name correspond à celui de votre application
3. Assurez-vous d'avoir les bonnes versions des dépendances React Native

## Notes importantes

- Les widgets Android nécessitent du code natif, donc ils ne fonctionnent pas avec Expo Go
- Vous devez créer un development build ou une build de production
- Le widget utilise `SharedPreferences` pour stocker les données, qui sont synchronisées depuis React Native via le module natif
- La mise à jour automatique est limitée par Android à un minimum de 30 minutes pour économiser la batterie

