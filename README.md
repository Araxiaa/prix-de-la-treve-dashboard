# Tableau de bord staff — Le Prix de la Trêve

Site de gestion pour **Bubulle** (gestion), **Ricochet** (rôle-play) et **Vigie** (fiches). Connexion avec Discord, réservée
au staff. Hébergé sur **GitHub Pages**, données dans le projet Supabase des bots.

```
npm install        # une seule fois
npm run dev        # site local (http://localhost:5173) avec la vraie connexion Discord
npm run demo       # site local avec de FAUSSES données, sans connexion (pour voir l'interface)
npm test           # tests (identifiants Discord, calendrier RP, niveaux…)
npm run build      # vérifie les types + construit le site dans dist/
npm run deploy     # build + publication sur GitHub Pages (branche gh-pages)
```

## Comment ça marche (et pourquoi c'est sûr)

```
 Navigateur ──(connexion Discord)──▶ Supabase Auth
     │  lit : characters, npcs, fils, sanctions… (règles RLS : staff uniquement)
     │  écrit : UNIQUEMENT via la fonction dashboard_enqueue(...)
     ▼
 table bot_jobs ◀── les bots (Bubulle / Ricochet / Vigie) viennent y chercher leurs demandes,
                    les exécutent avec LEUR code et leurs règles, journalisent sur Discord et notent le résultat.
```

* **Qui est staff ?** Bubulle recopie toutes les 15 minutes dans `dashboard_access` les membres qui ont un rôle admin / staff /
  apprenti sur chaque serveur (mêmes règles que ses commandes). Le site ne déduit **aucun** droit côté navigateur.
* **Identité non falsifiable.** La base reconnaît la personne grâce à `auth.identities` (fourni par Discord), jamais
  `user_metadata` (qui peut être modifié par l'utilisateur lui-même).
* **Aucune écriture directe.** Aucune règle RLS n'autorise le site à modifier les tables des bots. Une action = une demande
  (`bot_jobs`) vérifiée par `dashboard_enqueue` (droits sur CE serveur, action connue, 20 demandes en attente maximum).
  Les règles du jeu (PV, vies, rangs, journaux, logs Discord) restent donc dans les bots.
* **Clé publique.** `VITE_SUPABASE_PUBLISHABLE_KEY` est faite pour être visible dans un site web. Ne mets **jamais**
  la clé `service_role` ni `DATABASE_URL` dans ce projet.
* Les identifiants Discord (18-19 chiffres) sont lus comme du **texte** (`src/lib/bigint.ts`) : JavaScript les arrondirait sinon.

## Mise en route (une seule fois)

1. **Supabase → Authentication → URL Configuration** : ajoute dans *Redirect URLs*
   * `https://<ton-compte>.github.io/<ton-depot>/` (le site publié)
   * `http://localhost:5173/` (pour `npm run dev`)
   La connexion Discord est déjà activée sur le projet (elle sert aux autres sites).
2. **Dépôt GitHub** : crée un dépôt (privé ou public) puis, dans ce dossier :
   ```
   git remote add origin https://github.com/<ton-compte>/<ton-depot>.git
   git add . && git commit -m "Tableau de bord"
   git push -u origin main
   npm run deploy
   ```
   Puis **GitHub → Settings → Pages → Source : Deploy from a branch → gh-pages / (root)**.
3. **Bots** : redéploie Bubulle, Ricochet et Vigie (ils contiennent le nouveau module `dashboard_jobs.py` + `cogs/dashboard.py`).
   Bubulle remplit `dashboard_access` au bout de 15 minutes maximum.
4. Ouvre le site, « Se connecter avec Discord ». Si tu vois « Accès réservé au staff », attends la synchronisation de Bubulle
   (ou vérifie `/perms` : tes rôles staff/admin doivent y être configurés).

## Ce que le site sait faire

| Section | Lecture | Actions (exécutées par le bot) |
|---|---|---|
| Vue d'ensemble | stats, calendrier RP, état des bots, alertes | — |
| Personnages (Bubulle) | liste filtrable, fiche, chronologie, compétences, handicaps | **créer**, modifier (nom, clan, rang, âge, joueur, genre, préfixe, avatar), baptême, PV, PV max / PA / vies, compétences, handicaps, mort / disparition / retour, archiver, supprimer (admin) |
| PNJ (Bubulle) | liste filtrable, fiche, historique | **créer**, modifier, mort / disparition / retour, supprimer (admin) |
| Modération, Niveaux (Bubulle) | sanctions, classement XP | — (se fait sur Discord avec `/mod`) |
| Fils RP (Ricochet) | activité, rappels, clôtures | remettre la fiche de scène à l'instant présent |
| Gibier & herbier (Ricochet) | réserves, infirmerie | ajouter / retirer du gibier |
| Répertoire Fiche (Vigie) | OC sans salon, salle d'attente | créer un salon de fiche, annoncer les lunes, appliquer le rôle d'accès (admin) |
| Bots & journal | état des bots, historique des demandes | — |

## Ajouter une nouvelle action

1. Ajoute-la dans la table `dashboard_actions` (bot, action, libellé, niveau minimal `staff`/`admin`) — migration Supabase.
2. Écris son *handler* dans `cogs/dashboard.py` du bot concerné (`async def job_xxx(self, job) -> dict`) et enregistre-le dans
   le dictionnaire passé à `JobRunner`. Lève `JobError("message clair")` pour un échec attendu.
3. Côté site : un bouton qui appelle `useJobs().run({ label, bot, action, payload })` (voir `src/components/actions.tsx`).

## Dépannage

* *« Accès réservé au staff »* : Bubulle n'a pas encore synchronisé tes rôles (15 min) ou n'est pas dans le serveur.
* *Une demande reste « en attente »* : le bot concerné est hors ligne (onglet **Bots & journal**). Une demande de plus de
  30 minutes est abandonnée par le bot (jamais exécutée par surprise).
* *Ricochet bloqué par Discord (erreur 1015)* : les demandes attendent la fin du blocage, rien n'est perdu.
