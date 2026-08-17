# Rattrapage — Debug d'une API Node.js

## Contexte

Vous reprenez la maintenance de `biblio-api`, une petite API REST de gestion de
bibliotheque (Express 4). Le developpeur precedent est parti sans documentation
et le service accumule les tickets de bug.

**L'API contient plusieurs bugs.** Ils sont tous dans le dossier `src/`.
Aucun bug n'est cache dans `data/`, `package.json` ou les dependances.

Votre mission : diagnostiquer, expliquer, corriger.

---

## Mise en route

```bash
npm install
npm start          # http://localhost:3000
# ou
npm run dev        # avec rechargement automatique
```

Verification rapide que le serveur repond :

```bash
curl http://localhost:3000/health
# {"status":"ok"}
```

### Endpoints

| Methode  | Route                        | Role                                  |
| -------- | ---------------------------- | ------------------------------------- |
| `GET`    | `/health`                    | Ping                                  |
| `GET`    | `/api/books?page=&limit=&q=` | Catalogue pagine, recherche par titre |
| `GET`    | `/api/books/available`       | Livres avec `stock > 0`               |
| `GET`    | `/api/books/:id`             | Detail d'un livre                     |
| `POST`   | `/api/books`                 | Creation d'un livre                   |
| `DELETE` | `/api/books/:id`             | Suppression d'un livre                |
| `GET`    | `/api/loans`                 | Emprunts en cours                     |
| `POST`   | `/api/loans`                 | Creation d'un emprunt                 |

### Deux points importants avant de commencer

1. **Redemarrez le serveur entre chaque test.** Le catalogue est mis en cache en
   memoire : certains bugs laissent l'application dans un etat incoherent, ce qui
   fausse les tests suivants.
2. **`data/books.json` peut etre corrompu par les bugs.** C'est normal, il fait
   partie du diagnostic. Pour restaurer le jeu de donnees initial :
   ```bash
   git checkout data/books.json
   ```
3. **Certains bugs en masquent d'autres.** Traitez les tickets dans l'ordre :
   tant que le ticket #1 n'est pas corrige, les tickets #6 et #7 ne sont pas
   reproductibles.

---

## Travail attendu

1. Creez une branche depuis `main` :
   ```bash
   git checkout -b fix/rattrapage-<votre-nom>
   ```
2. **Un commit par bug corrige** , format impose :
   ```
   <NOM_DE_BRANCHE> <GITMOJI> <description courte>
   ```
   exemple : `fix/rattrapage-dupont 🐛 corrige l'ordre du middleware express.json`
3. Creez un fichier `ANALYSE.md` a la racine. Pour **chacun des bugs** :
   - le numero du ticket ;
   - le fichier et la ligne concernes ;
   - **la cause reelle** (pas le symptome : _pourquoi_ le code produit ce
     comportement) ;
   - la correction apportee et pourquoi elle est correcte ;
   - la commande `curl` qui prouve que c'est corrige.
4. Poussez la branche et ouvrez une Pull Request vers `main`.

### Regles

- Corrigez **au minimum** : pas de reecriture de l'architecture, pas de
  changement de librairie, pas de passage a Express 5. Chaque correctif doit
  tenir en quelques lignes.
- L'API publique ne change pas : memes routes, memes formats de reponse.
- Les commentaires et la structure des fichiers restent en place.
- Aucun bug ne se corrige en supprimant une fonctionnalite.

### Evaluation

| Critere                                                             | Points |
| ------------------------------------------------------------------- | ------ |
| bugs corriges et fonctionnels                                       | 8      |
| Qualite de l'analyse dans `ANALYSE.md` (cause reelle, pas symptome) | 8      |
| Hygiene git (branche, 1 commit par bug, messages conformes)         | 2      |
| Correctifs minimaux et propres                                      | 2      |
| **Total**                                                           | **20** |

Un bug corrige mais mal explique ne vaut que la moitie des points. Un bug
"corrige" par un contournement (try/catch qui avale l'erreur, valeur codee en
dur, etc.) ne vaut aucun point.

---

## Les tickets

> Les tickets decrivent des **symptomes** remontes par les utilisateurs. Ils ne
> disent pas ou est le bug : c'est votre travail.

### Ticket #1 — « Impossible de creer un livre »

Le front envoie un JSON parfaitement valide, l'API repond systematiquement
`400 Payload invalide` en pretendant que tous les champs sont absents.

```bash
curl -i -X POST localhost:3000/api/books \
  -H 'Content-Type: application/json' \
  -d '{"title":"Nana","author":"Emile Zola","stock":2}'
```

Attendu : `201` avec le livre cree.
Observe : `400 {"details":["title est requis","author est requis","stock est requis"]}`

---

### Ticket #2 — « La page des livres disponibles est cassee »

L'ecran « disponibles » affiche une erreur 500 depuis la mise en production.

```bash
curl -i localhost:3000/api/books/available
```

Attendu : la liste des livres dont le stock est superieur a 0.
Observe : `500 {"error":"books.filter is not a function"}`

---

### Ticket #3 — « Aucune fiche livre ne s'ouvre »

Cliquer sur n'importe quel livre du catalogue mene a une page 404, alors que le
livre existe bien dans le catalogue.

```bash
curl -i localhost:3000/api/books/1
```

Attendu : le detail du livre 1.
Observe : `404 {"error":"Livre 1 introuvable"}`

---

### Ticket #4 — « Les premiers livres du catalogue sont invisibles »

Sur la premiere page du catalogue, les documentalistes ne voient jamais les
premiers livres de la liste. Ils apparaissent seulement si on demande une page
avant la premiere.

```bash
# serveur fraichement redemarre
curl -s "localhost:3000/api/books?page=1&limit=3"
```

Attendu : les livres 1, 2 et 3.
Observe : les livres 4, 5 et 6.

---

### Ticket #5 — « Consulter le catalogue efface des livres » (critique)

Un documentaliste a signale que le catalogue se vide au fil de la journee. Une
simple consultation en lecture semble detruire des donnees, et une modification
faite ensuite grave la perte dans `data/books.json`.

```bash
# serveur fraichement redemarre
curl -s "localhost:3000/api/books?page=1&limit=3"   # renvoie 3 livres, total 6
curl -s "localhost:3000/api/books?page=1&limit=3"   # total est passe a 3 !
```

Attendu : deux requetes identiques renvoient le meme resultat.
Observe : le catalogue retrecit a chaque appel.

---

### Ticket #6 — « On ne peut pas referencer un livre en rupture »

_(reproductible une fois le ticket #1 corrige)_

Le service acquisitions veut referencer un ouvrage commande mais pas encore
recu, donc avec un stock de 0. L'API refuse en disant que le champ est absent —
alors qu'il est bien present et vaut `0`.

```bash
curl -i -X POST localhost:3000/api/books \
  -H 'Content-Type: application/json' \
  -d '{"title":"Nana","author":"Emile Zola","stock":0}'
```

Attendu : `201`, le livre est cree avec `stock: 0`.
Observe : `400 {"details":["stock est requis"]}`

---

### Ticket #7 — « Deux livres differents ont le meme identifiant »

_(reproductible une fois le ticket #1 corrige)_

Apres une operation de desherbage (suppression d'anciens ouvrages), les livres
nouvellement crees ecrasent des fiches existantes dans l'interface.

```bash
# serveur fraichement redemarre
curl -s -X DELETE localhost:3000/api/books/3
curl -s -X POST localhost:3000/api/books \
  -H 'Content-Type: application/json' \
  -d '{"title":"Nana","author":"Emile Zola","stock":2}'
# -> l'id renvoye est deja utilise par un autre livre
```

Attendu : un identifiant unique, jamais reutilise.
Observe : un identifiant en collision avec un livre existant.

---

### Ticket #8 — « L'API tombe plusieurs fois par jour » (critique)

Le processus Node s'arrete brutalement en production. Les logs montrent une
erreur non geree juste apres une tentative d'emprunt. Le client, lui, ne recoit
jamais de reponse : la connexion est coupee.

```bash
curl -i -m 5 -X POST localhost:3000/api/loans \
  -H 'Content-Type: application/json' \
  -d '{"bookId":999,"member":"Bob"}'
curl localhost:3000/health   # le serveur ne repond plus
```

Attendu : `404 {"error":"Livre 999 introuvable"}` et un serveur toujours debout.
Observe : aucune reponse, le process meurt.

> Indice de contexte : cette application tourne sur **Express 4**, pas Express 5.
> La difference de comportement entre les deux versions sur ce point precis fait
> partie de l'explication attendue.

---

## Rendu

- Branche poussee : `fix/rattrapage-<votre-nom>`
- 8 commits, un par bug, messages au format impose
- `ANALYSE.md` complet a la racine
- Pull Request ouverte vers `main`
