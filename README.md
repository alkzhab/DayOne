# DayOne — Suivi d'entraînements

Application web personnelle de suivi d'entraînements sportifs, construite en **HTML, CSS et JavaScript natifs** (aucun framework, aucun serveur). Toutes les données (entraînements, programmes, exercices) sont stockées dans le **localStorage** du navigateur : rien n'est envoyé où que ce soit, tout reste sur l'appareil qui l'utilise.

Conçue d'après la charte graphique « DayOne — One Day or Day One » : thème sombre, Inter, vert citron pour l'action et les séances réalisées, rouge réservé aux séances non réalisées et aux suppressions.

## Fonctionnalités

- **Aujourd'hui** — planning horaire de 06:00 à 23:00 de la journée, bouton pour revenir à l'heure actuelle, bouton flottant « + ».
- **Calendrier** — vues Jour / Semaine / Mois, navigation précédent/suivant, indicateurs de statut par jour.
- **Programmes** — création de programmes (nom, icône, type, description) et de leurs exercices (séries, répétitions, poids, distance/durée, notes).
- **Fiche d'entraînement** — nom, icône, date, horaires, programme associé, statut (prévu / réalisé / non réalisé), intensité (1 à 10), notes. Modification et suppression.
- Données persistées automatiquement dans le navigateur ; un jeu d'exemples est créé au premier lancement.

## Utiliser le site en local

Aucune installation n'est nécessaire : ouvrez simplement `index.html` dans un navigateur. Pour un confort maximal sur mobile (et éviter certaines restrictions de navigateur sur les fichiers locaux), servez le dossier avec un petit serveur local, par exemple :

```bash
cd dayone-app
python3 -m http.server 8000
# puis ouvrez http://localhost:8000
```

## Héberger gratuitement sur GitHub Pages

1. Créez un nouveau dépôt GitHub (public) et ajoutez-y les trois fichiers `index.html`, `styles.css`, `app.js` (et ce `README.md` si vous voulez).
2. Dans le dépôt : **Settings → Pages**.
3. Sous « Build and deployment », choisissez **Source : Deploy from a branch**, puis la branche `main` et le dossier `/ (root)`.
4. Enregistrez. Au bout de quelques minutes, votre site sera disponible à une adresse du type :
   `https://<votre-nom-utilisateur>.github.io/<nom-du-depot>/`
5. Ajoutez l'adresse à l'écran d'accueil de votre téléphone Android (menu du navigateur → « Ajouter à l'écran d'accueil ») pour un accès rapide, façon application.

Chaque appareil/navigateur a son propre localStorage : les données ne se synchronisent pas automatiquement entre votre téléphone et votre ordinateur. C'est un choix délibéré (pas de serveur, pas de compte), mais cela veut dire qu'il faut utiliser le site depuis le même navigateur pour retrouver ses données.

## Structure des fichiers

```
dayone-app/
├── index.html    # structure des 3 pages + des feuilles (modales) de formulaire
├── styles.css    # charte graphique complète (couleurs, typographie, composants)
├── app.js        # logique applicative, rendu des vues, localStorage
└── README.md
```

## Remettre à zéro les données

Dans la console du navigateur (F12), exécutez :

```js
localStorage.removeItem("dayone.data.v1");
```

puis rechargez la page : un nouveau jeu d'exemples sera recréé.
