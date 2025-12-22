# Guide de débogage du Widget Android

## Problème : Le widget n'apparaît pas dans la liste des widgets disponibles

### Vérifications à faire

1. **Vérifier que l'APK contient les fichiers du widget**
   ```bash
   # Décompresser l'APK et vérifier les fichiers
   unzip -l your-app.apk | grep widget
   ```
   Vous devriez voir :
   - `res/xml/widget_info.xml`
   - `res/layout/widget_sobriety.xml`
   - `classes.dex` (contient SobrietyWidgetProvider)

2. **Vérifier les logs Android**
   ```bash
   adb logcat | grep -i widget
   ```
   Recherchez les erreurs liées au widget.

3. **Vérifier que le widget est enregistré**
   ```bash
   adb shell dumpsys package com.suslec.sobrietytracker | grep -i widget
   ```

4. **Vérifier le manifest dans l'APK**
   ```bash
   # Extraire le manifest
   aapt dump xmltree your-app.apk AndroidManifest.xml | grep -i widget
   ```

### Solutions possibles

1. **Nettoyer et reconstruire**
   ```bash
   cd android
   ./gradlew clean
   cd ..
   eas build --platform android --profile preview --clear-cache
   ```

2. **Vérifier que les fichiers sont au bon endroit**
   - `android/app/src/main/res/xml/widget_info.xml` ✓
   - `android/app/src/main/res/layout/widget_sobriety.xml` ✓
   - `android/app/src/main/java/com/suslec/sobrietytracker/SobrietyWidgetProvider.java` ✓

3. **Vérifier le MainApplication.java**
   - Doit contenir `import com.suslec.sobrietytracker.WidgetPackage;`
   - Doit contenir `packages.add(new WidgetPackage());`

4. **Vérifier AndroidManifest.xml**
   - Doit contenir le receiver pour le widget
   - Doit contenir la meta-data avec `@xml/widget_info`

### Test rapide

Après avoir installé l'APK, exécutez :
```bash
adb shell am broadcast -a android.appwidget.action.APPWIDGET_UPDATE
```

Cela devrait déclencher une mise à jour du widget si il est correctement enregistré.

