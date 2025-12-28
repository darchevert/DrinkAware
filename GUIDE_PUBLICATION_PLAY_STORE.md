# 📱 Guide de publication sur le Google Play Store

## 📋 Table des matières

1. [Préparation de l'application](#1-préparation-de-lapplication)
2. [Génération du fichier AAB](#2-génération-du-fichier-aab)
3. [Contenus pour le Play Store](#3-contenus-pour-le-play-store)
4. [Publication sur le Play Store](#4-publication-sur-le-play-store)
5. [Vérifications post-publication](#5-vérifications-post-publication)

---

## 1. Préparation de l'application

### ✅ Vérifications préalables

Avant de publier, assurez-vous que :

- [x] L'application fonctionne correctement sur Android
- [x] Les notifications sont testées
- [x] Le widget Android fonctionne
- [x] Toutes les fonctionnalités sont opérationnelles
- [x] Les traductions (FR/EN) sont complètes
- [x] L'icône et les images sont de bonne qualité

### 📝 Informations de l'application

**Nom de l'application :** DrinkAware  
**Package ID :** `com.suslec.sobrietytracker`  
**Version actuelle :** 1.0.0  
**Version du code :** 1

---

## 2. Génération du fichier AAB

### Étape 1 : Générer le AAB de production

```bash
eas build --platform android --profile production
```

Cette commande va :
- Générer un fichier **AAB** (Android App Bundle) requis par le Play Store
- Signer l'application avec votre keystore
- Créer un build optimisé pour la production

### Étape 2 : Télécharger le AAB

Une fois le build terminé :
1. Récupérez le lien de téléchargement depuis le terminal ou le dashboard EAS
2. Téléchargez le fichier `.aab`
3. Conservez-le dans un endroit sûr

> ⚠️ **Important** : Le fichier AAB est nécessaire pour la publication. Ne le supprimez pas !

---

## 3. Contenus pour le Play Store

### 📝 Description courte (80 caractères max)

**Version française :**
```
Suivez votre parcours de sobriété avec des statistiques détaillées et des rappels quotidiens.
```

**Version anglaise :**
```
Track your sobriety journey with detailed statistics and daily reminders.
```

### 📄 Description complète (4000 caractères max)

**Version française :**

```
DrinkAware - Votre compagnon pour un parcours de sobriété réussi

DrinkAware est une application mobile conçue pour vous accompagner dans votre parcours de sobriété. Que vous souhaitiez réduire votre consommation ou arrêter complètement, cette application vous offre tous les outils nécessaires pour suivre vos progrès et rester motivé.

✨ FONCTIONNALITÉS PRINCIPALES

📅 Vérifications quotidiennes
• Enregistrez facilement votre état de sobriété chaque jour
• Mode strict : simplement sobre ou non
• Mode détaillé : suivez votre niveau de consommation (un verre, plusieurs verres, trop bu)
• Ajoutez des notes personnelles pour chaque jour

📊 Statistiques détaillées
• Visualisez vos progrès avec des graphiques en camembert et en barres
• Suivez votre série actuelle de jours sobres
• Consultez votre progression hebdomadaire et mensuelle
• Analysez vos statistiques sur différentes périodes (7 jours, 30 jours, tout le temps)

📈 Progression visuelle
• Graphiques de progression hebdomadaire et mensuelle
• Visualisation claire de vos jours sobres par semaine/mois
• Statistiques de moyenne et de sobriété totale

🎯 Challenges et célébrations
• Atteignez des objectifs prédéfinis (1 jour, 1 semaine, 1 mois, etc.)
• Célébrez vos victoires et restez motivé
• Suivez vos challenges atteints avec les dates

📱 Widget Android
• Affichez votre série actuelle directement sur l'écran d'accueil
• Indicateur visuel pour les jours non vérifiés
• Mise à jour automatique

🔔 Rappels quotidiens
• Notification automatique à 20h chaque jour
• Rappel pour effectuer votre vérification quotidienne
• Ne manquez jamais un jour

🌍 Multilingue
• Interface disponible en français et en anglais
• Changez de langue à tout moment dans les paramètres

🌙 Mode sombre
• Interface adaptée pour une utilisation confortable de jour comme de nuit
• Basculez facilement entre le mode clair et sombre

📅 Calendrier des vérifications
• Consultez votre historique complet
• Visualisez tous vos jours sobres et consommations
• Navigation facile dans votre parcours

🔒 Confidentialité
• Toutes vos données sont stockées localement sur votre appareil
• Aucune donnée n'est envoyée à des serveurs externes
• Votre vie privée est respectée
• Aucune publicité

💡 POUR QUI ?

DrinkAware est conçue pour toute personne souhaitant :
• Suivre sa consommation d'alcool
• Réduire ou arrêter sa consommation
• Visualiser ses progrès de manière claire
• Rester motivé dans son parcours de sobriété
• Avoir un outil discret et personnel

🎨 INTERFACE INTUITIVE

L'application a été conçue avec une interface simple et intuitive :
• Navigation facile entre les différents écrans
• Graphiques clairs et compréhensibles
• Design moderne et épuré
• Expérience utilisateur optimale

📱 COMPATIBILITÉ

• Compatible avec les smartphones et tablettes Android
• Optimisé pour différentes tailles d'écran
• Fonctionne hors ligne (aucune connexion Internet requise)

🔧 FONCTIONNALITÉS TECHNIQUES

• Sauvegarde automatique de vos données
• Synchronisation locale sécurisée
• Performance optimale
• Mises à jour régulières

Rejoignez des milliers d'utilisateurs qui font confiance à DrinkAware pour suivre leur parcours de sobriété. Téléchargez l'application dès maintenant et commencez votre voyage vers une vie plus saine.

---

Note : Cette application est un outil de suivi personnel et ne remplace pas un suivi médical professionnel si nécessaire.
```

**Version anglaise :**

```
DrinkAware - Your companion for a successful sobriety journey

DrinkAware is a mobile application designed to support you in your sobriety journey. Whether you want to reduce your consumption or stop completely, this app provides all the tools you need to track your progress and stay motivated.

✨ MAIN FEATURES

📅 Daily checks
• Easily record your sobriety status each day
• Strict mode: simply sober or not
• Detailed mode: track your consumption level (one drink, multiple drinks, too much)
• Add personal notes for each day

📊 Detailed statistics
• Visualize your progress with pie and bar charts
• Track your current streak of sober days
• View your weekly and monthly progression
• Analyze your statistics over different periods (7 days, 30 days, all time)

📈 Visual progression
• Weekly and monthly progression charts
• Clear visualization of your sober days per week/month
• Average and total sobriety statistics

🎯 Challenges and celebrations
• Achieve predefined goals (1 day, 1 week, 1 month, etc.)
• Celebrate your victories and stay motivated
• Track your achieved challenges with dates

📱 Android widget
• Display your current streak directly on your home screen
• Visual indicator for unchecked days
• Automatic updates

🔔 Daily reminders
• Automatic notification at 8 PM every day
• Reminder to do your daily check
• Never miss a day

🌍 Multilingual
• Interface available in French and English
• Change language anytime in settings

🌙 Dark mode
• Interface adapted for comfortable use day and night
• Easily switch between light and dark mode

📅 Checks calendar
• View your complete history
• Visualize all your sober days and consumptions
• Easy navigation through your journey

🔒 Privacy
• All your data is stored locally on your device
• No data is sent to external servers
• Your privacy is respected
• No ads

💡 FOR WHOM?

DrinkAware is designed for anyone who wants to:
• Track their alcohol consumption
• Reduce or stop their consumption
• Visualize their progress clearly
• Stay motivated in their sobriety journey
• Have a discreet and personal tool

🎨 INTUITIVE INTERFACE

The app has been designed with a simple and intuitive interface:
• Easy navigation between different screens
• Clear and understandable charts
• Modern and clean design
• Optimized user experience

📱 COMPATIBILITY

• Compatible with Android smartphones and tablets
• Optimized for different screen sizes
• Works offline (no Internet connection required)

🔧 TECHNICAL FEATURES

• Automatic data backup
• Secure local synchronization
• Regular updates
• Multilingual support (FR/EN)

Join thousands of users who trust DrinkAware to track their sobriety journey. Download the app now and start your journey towards a healthier life.

---

Note: This application is a personal tracking tool and does not replace professional medical monitoring if necessary.
```

### 🏷️ Catégorie et tags

**Catégorie principale :** Santé et forme  
**Catégorie secondaire :** Style de vie

**Tags suggérés :**
- sobriété
- alcool
- santé
- suivi
- statistiques
- bien-être
- motivation
- défi

### 📸 Captures d'écran requises

Vous devez fournir au minimum **2 captures d'écran**, mais il est recommandé d'en avoir **4 à 8**.

**Captures d'écran suggérées :**

1. **Écran d'accueil** - Montrant la série actuelle et les statistiques principales
2. **Calendrier** - Affichant l'historique des vérifications
3. **Statistiques** - Graphiques et progression
4. **Vérification quotidienne** - Interface de vérification
5. **Widget Android** (optionnel) - Le widget sur l'écran d'accueil

**Spécifications :**
- Format : PNG ou JPEG
- Résolution minimale : 320px
- Résolution maximale : 3840px
- Ratio d'aspect : 16:9 ou 9:16
- Taille maximale : 8 Mo par image

### 🎨 Icône de l'application

L'icône est déjà configurée dans `app.json` :
- Fichier : `./assets/icon.png`
- Taille recommandée : 512x512 pixels
- Format : PNG avec transparence

### 🖼️ Image de présentation (Feature Graphic)

**Spécifications :**
- Dimensions : 1024 x 500 pixels
- Format : PNG ou JPEG
- Taille maximale : 1 Mo

**Contenu suggéré :**
- Nom de l'application : "DrinkAware"
- Tagline : "Votre compagnon pour un parcours de sobriété réussi"
- Visuels de l'application (captures d'écran miniatures)
- Couleurs de la marque (vert #4CAF50)

### 📋 Politique de confidentialité

**URL requise** pour le Play Store.

Vous devez créer une page web avec votre politique de confidentialité. Voici un modèle :

```
POLITIQUE DE CONFIDENTIALITÉ - DRINKAWARE

Dernière mise à jour : [DATE]

1. COLLECTE DE DONNÉES

DrinkAware ne collecte, ne stocke ni ne transmet aucune donnée personnelle à des serveurs externes. Toutes les données sont stockées localement sur votre appareil Android.

2. DONNÉES STOCKÉES LOCALEMENT

L'application stocke les données suivantes uniquement sur votre appareil :
- Dates de vérifications quotidiennes
- État de sobriété (sobre/non sobre)
- Niveau de consommation (si mode détaillé activé)
- Notes personnelles
- Statistiques calculées localement

3. PERMISSIONS

L'application demande les permissions suivantes :
- Notifications : Pour vous envoyer des rappels quotidiens à 20h
- Stockage : Pour sauvegarder vos données localement

4. PARTAGE DE DONNÉES

Aucune donnée n'est partagée avec des tiers. Aucune donnée n'est envoyée à des serveurs externes.

5. SÉCURITÉ

Toutes vos données sont stockées localement sur votre appareil et ne sont accessibles que par vous.

6. VOS DROITS

Vous pouvez supprimer toutes vos données à tout moment depuis les paramètres de l'application (bouton "Réinitialiser les données").

7. CONTACT

Pour toute question concernant cette politique de confidentialité, contactez : [VOTRE EMAIL]

8. MODIFICATIONS

Nous nous réservons le droit de modifier cette politique de confidentialité. Toute modification sera indiquée par une mise à jour de la date "Dernière mise à jour".
```

**Options pour héberger la politique :**
- GitHub Pages (gratuit)
- Votre site web personnel
- Google Sites (gratuit)
- Netlify (gratuit)

### 📧 Contact et support

**Email de contact :** [À compléter avec votre email]  
**Site web :** [Optionnel - URL de votre site]  
**Politique de confidentialité :** [URL de votre politique]

---

## 4. Publication sur le Play Store

### Étape 1 : Accéder à la Google Play Console

1. Allez sur https://play.google.com/console
2. Connectez-vous avec votre compte développeur Google
3. Acceptez les conditions si c'est votre première publication

### Étape 2 : Créer une nouvelle application

1. Cliquez sur **"Créer une application"**
2. Remplissez les informations :
   - **Nom de l'application :** DrinkAware
   - **Langue par défaut :** Français (France)
   - **Type d'application :** Application
   - **Gratuite ou payante :** Gratuite
   - **Déclaration de conformité :** Cochez les cases appropriées

### Étape 3 : Remplir le contenu de la boutique

#### 3.1 Informations sur l'application

- **Description courte :** [Utiliser le texte fourni ci-dessus]
- **Description complète :** [Utiliser le texte fourni ci-dessus]
- **Icône de l'application :** Uploader `assets/icon.png`
- **Image de présentation :** Uploader votre feature graphic (1024x500)
- **Captures d'écran :** Uploader vos captures d'écran

#### 3.2 Classification du contenu

- **Catégorie :** Santé et forme
- **Tags :** sobriété, santé, suivi, bien-être
- **Classification du contenu :** Tous publics (ou selon votre cible)

#### 3.3 Prix et distribution

- **Prix :** Gratuit
- **Pays/territoires :** Sélectionnez les pays où vous voulez distribuer
- **Appareils :** Smartphones et tablettes

### Étape 4 : Télécharger le AAB

1. Allez dans **"Production"** (ou "Test interne" pour tester d'abord)
2. Cliquez sur **"Créer une nouvelle version"**
3. **Téléchargez le fichier AAB** que vous avez généré avec EAS Build
4. Remplissez les **Notes de version** :

**Version 1.0.0 (Première version) :**
```
🎉 Première version de DrinkAware !

✨ Fonctionnalités :
- Vérifications quotidiennes (mode strict et détaillé)
- Statistiques détaillées avec graphiques
- Progression hebdomadaire et mensuelle
- Challenges et célébrations
- Widget Android
- Rappels quotidiens à 20h
- Mode sombre
- Support multilingue (FR/EN)
- Calendrier des vérifications

🔒 Confidentialité : Toutes les données sont stockées localement sur votre appareil.
```

### Étape 5 : Remplir les formulaires requis

#### 5.1 Déclaration de contenu

Répondez aux questions :
- **Contenu médical :** Non (ou Oui si vous considérez que c'est un outil médical)
- **Données personnelles :** Non (les données restent locales)
- **Publicité :** Non
- **Achats intégrés :** Non

#### 5.2 Cible d'âge

- **Groupe d'âge cible :** 18+ (ou selon votre cible)

#### 5.3 Politique de confidentialité

- **URL de la politique de confidentialité :** [Votre URL]

### Étape 6 : Vérifier et publier

1. **Vérifiez toutes les informations** une dernière fois
2. Cliquez sur **"Examiner la version"**
3. Google va examiner votre application (peut prendre quelques heures à quelques jours)
4. Une fois approuvée, votre application sera disponible sur le Play Store !

---

## 5. Vérifications post-publication

### ✅ Checklist post-publication

- [ ] L'application apparaît dans le Play Store
- [ ] Les captures d'écran s'affichent correctement
- [ ] La description est complète et sans fautes
- [ ] Le lien de téléchargement fonctionne
- [ ] L'icône s'affiche correctement
- [ ] Les notifications fonctionnent
- [ ] Le widget fonctionne
- [ ] Toutes les fonctionnalités sont opérationnelles

### 📊 Suivi des statistiques

Une fois publiée, vous pouvez suivre :
- Nombre de téléchargements
- Notes et avis des utilisateurs
- Statistiques d'utilisation
- Revenus (si vous passez en version payante plus tard)

### 🔄 Mises à jour futures

Pour publier une mise à jour :

1. Modifiez la version dans `app.json` :
   ```json
   "version": "1.0.1"
   ```

2. Générez un nouveau AAB :
   ```bash
   eas build --platform android --profile production
   ```

3. Téléchargez le nouveau AAB dans la Google Play Console
4. Ajoutez des notes de version expliquant les changements
5. Publiez la mise à jour

---

## 📝 Notes importantes

### ⚠️ Points d'attention

1. **Première publication :** La première publication peut prendre 1 à 7 jours pour être approuvée
2. **Mises à jour :** Les mises à jour sont généralement approuvées plus rapidement (quelques heures)
3. **Politique de confidentialité :** Obligatoire pour toutes les applications
4. **Avis utilisateurs :** Répondez aux avis pour montrer votre engagement
5. **Mises à jour régulières :** Gardez votre application à jour pour maintenir la confiance des utilisateurs

### 💡 Conseils

- Testez votre application sur plusieurs appareils avant de publier
- Prenez des captures d'écran de qualité
- Écrivez une description claire et engageante
- Répondez aux avis des utilisateurs
- Publiez des mises à jour régulières

---

## 🆘 Support

Si vous rencontrez des problèmes :

1. **Documentation Google Play Console :** https://support.google.com/googleplay/android-developer
2. **Forum EAS Build :** https://forums.expo.dev
3. **Documentation Expo :** https://docs.expo.dev

---

**Bonne chance avec votre publication ! 🚀**

