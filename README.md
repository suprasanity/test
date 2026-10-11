# Connexion Microsoft — version 2

Cette version fait uniquement la connexion interactive et affiche « Connecté avec [nom du compte] ». Elle remplace le chat Azure de la version 1.

## Lancer

1. Installer Node.js 22 ou plus : https://nodejs.org
2. Extraire le ZIP dans un nouveau dossier. Arrêter l'ancien serveur avec Ctrl+C.
3. Double-cliquer `start-windows.bat`, ou lancer `npm install` puis `npm start` dans ce dossier.
4. Ouvrir http://127.0.0.1:3000 (recharger si la page s'ouvre avant le serveur).
5. Cliquer « Se connecter à Microsoft », choisir le compte, finir la connexion et revenir à la page.

Le nom affiché vient du profil retourné par Microsoft ; à défaut, l'identifiant du compte est utilisé. Un pseudo distinct n'est pas toujours fourni par Microsoft.

## Fonctionnement

- Interface HTML/JS et serveur Node.js local.
- MSAL Node, connexion par code d'autorisation avec PKCE dans le navigateur système.
- Autorité `https://login.microsoftonline.com/common` pour permettre le choix du compte, au lieu d'imposer un répertoire professionnel.
- Scopes `openid` et `profile` uniquement. Aucun jeton Azure OpenAI demandé, aucun appel LLM, Graph ou ressource Azure.
- Application publique Microsoft Azure CLI existante : `04b07795-8ddb-461a-bbee-02f9e1bf7b46`. Cet identifiant public est intégré au code ; aucun Client ID, Tenant ID, secret ou App Registration à configurer.
- Le SDK valide la réponse d'authentification. Aucun décodage artisanal de jeton pour prétendre être connecté.
- Jetons et compte en mémoire côté Node.js ; seuls le nom et l'identifiant du compte sont transmis à l'interface. Pas de stockage sur disque.
- « Déconnecter » efface la session locale de l'application, pas les cookies Microsoft du navigateur. Le bouton de connexion affiche le sélecteur de compte.
- Serveur limité à 127.0.0.1, origine/Host/anti-CSRF vérifiés. Une session locale, pas un service multi-utilisateur.

## Limites / erreurs

Cette connexion confirme ton identité Microsoft, pas tes droits sur Azure ou sur un LLM. L'application publique Microsoft et les comptes admis restent soumis aux règles Microsoft et aux politiques de ton entreprise. Cette version réduit les demandes à la connexion et au profil ; elle ne garantit pas de résoudre AADSTS50020 si le compte ou l'application est bloqué.

- Port 3000 occupé : arrêter l'ancien serveur.
- AADSTS50020 : essayer le bon compte ; si l'erreur persiste, vérifier son répertoire et l'accès à l'application avec l'administrateur.
- Navigateur absent : lancer sur un PC disposant d'un navigateur par défaut (Windows, macOS ou Linux avec xdg-open).
- Connexion annulée : attendre l'erreur ou redémarrer le serveur, puis réessayer.

## Validation

`npm test` : profil simulé, état connecté, absence de fuite de jetons, anti-CSRF, déconnexion et suppression de la route chat. La connexion Microsoft réelle doit être testée sur ton PC avec ton compte ; elle n'a pas été exécutée ici.

## Références

https://learn.microsoft.com/en-us/javascript/api/@azure/msal-node/interactiverequest
https://learn.microsoft.com/en-us/entra/identity-platform/v2-protocols-oidc
