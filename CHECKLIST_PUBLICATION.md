# ✅ Checklist de publication sur le Play Store

## 📋 Avant de commencer

- [ ] Compte Google Play Console créé et actif
- [ ] Frais d'inscription payés (25$ USD, paiement unique)
- [ ] Application testée et fonctionnelle sur Android
- [ ] Toutes les fonctionnalités testées (notifications, widget, etc.)

## 🔧 Préparation technique

- [ ] Version de l'application définie dans `app.json` (actuellement : 1.0.0)
- [ ] Package ID vérifié : `com.suslec.sobrietytracker`
- [ ] Icône de l'application prête (512x512px)
- [ ] Image de présentation créée (1024x500px)
- [ ] Captures d'écran préparées (minimum 2, recommandé 4-8)
- [ ] AAB de production généré avec `eas build --platform android --profile production`

## 📝 Contenus pour le Play Store

- [ ] Description courte rédigée (80 caractères max)
- [ ] Description complète rédigée (4000 caractères max)
- [ ] Description en français complétée
- [ ] Description en anglais complétée (optionnel mais recommandé)
- [ ] Catégorie choisie : Santé et forme
- [ ] Tags définis : sobriété, santé, suivi, bien-être

## 🖼️ Assets visuels

- [ ] Icône de l'application (512x512px) - `assets/icon.png`
- [ ] Image de présentation (1024x500px) - Feature Graphic
- [ ] Capture d'écran 1 : Écran d'accueil
- [ ] Capture d'écran 2 : Calendrier
- [ ] Capture d'écran 3 : Statistiques
- [ ] Capture d'écran 4 : Vérification quotidienne
- [ ] Capture d'écran 5 : Widget Android (optionnel)

## 🔒 Conformité et légalité

- [ ] Politique de confidentialité rédigée
- [ ] Politique de confidentialité hébergée (URL disponible)
- [ ] Déclaration de contenu remplie
- [ ] Classification du contenu définie
- [ ] Cible d'âge définie (18+)

## 📦 Publication

- [ ] Application créée dans Google Play Console
- [ ] Informations de base complétées
- [ ] Contenu de la boutique rempli
- [ ] AAB téléchargé dans la section Production
- [ ] Notes de version rédigées
- [ ] Formulaire de déclaration de contenu complété
- [ ] Politique de confidentialité liée
- [ ] Version soumise pour examen

## ✅ Post-publication

- [ ] Application approuvée par Google
- [ ] Application visible dans le Play Store
- [ ] Lien de téléchargement fonctionnel
- [ ] Captures d'écran affichées correctement
- [ ] Description complète et sans fautes
- [ ] Icône affichée correctement

## 📊 Suivi

- [ ] Dashboard Google Play Console configuré
- [ ] Notifications d'avis activées
- [ ] Plan de réponse aux avis préparé

---

## 🚀 Commandes importantes

### Générer le AAB de production
```bash
eas build --platform android --profile production
```

### Vérifier la version actuelle
```bash
# Dans app.json
"version": "1.0.0"
```

### Pour une mise à jour future
1. Modifier la version dans `app.json`
2. Générer un nouveau AAB
3. Télécharger dans Play Console
4. Ajouter des notes de version

---

## 📞 Support

- **Documentation Play Console :** https://support.google.com/googleplay/android-developer
- **Documentation EAS Build :** https://docs.expo.dev/build/introduction/
- **Forum Expo :** https://forums.expo.dev

---

**Date de création :** [DATE]  
**Dernière mise à jour :** [DATE]

