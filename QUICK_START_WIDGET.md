# Démarrage rapide - Widget Android

## Étapes rapides

### 1. Générer les fichiers natifs (si pas déjà fait)

```bash
npx expo prebuild
```

### 2. Vérifier MainApplication.java

Le fichier `android/app/src/main/java/com/suslec/sobrietytracker/MainApplication.java` doit contenir :

```java
import com.suslec.sobrietytracker.WidgetPackage;

// Dans getPackages() :
packages.add(new WidgetPackage());
```

**Note** : Si Expo a généré un `MainApplication.java` différent, ajoutez simplement ces deux lignes au fichier existant.

### 3. Compiler et installer

```bash
npx expo run:android
```

### 4. Ajouter le widget

1. Appuyez longuement sur l'écran d'accueil Android
2. Sélectionnez "Widgets"
3. Trouvez "DrinkAware"
4. Glissez le widget sur l'écran

## ✅ Vérification

Le widget devrait :
- Afficher "0" si aucune donnée
- Se mettre à jour après chaque vérification quotidienne
- Afficher un avertissement si des jours ne sont pas vérifiés
- Ouvrir l'app au clic

## ❌ Problèmes courants

**Le widget n'apparaît pas** :
- Vérifiez que vous avez compilé une version native (pas Expo Go)
- Vérifiez que `WidgetPackage` est dans `MainApplication.java`

**Le widget ne se met pas à jour** :
- Vérifiez les logs : `adb logcat | grep Widget`
- Vérifiez que les données sont sauvegardées dans l'app

Pour plus de détails, voir `INTEGRATION_WIDGET.md`

