CARANDANG-HUB
A PlayStation 4 style home screen that runs in the browser. Plain HTML, CSS and JavaScript.

HOW TO RUN
  Double-click index.html, or open the folder in VS Code and use Live Server.
  Needs internet for Firebase and the Google Font. Live Server is recommended for auth.

ACCOUNT SETUP
  In Firebase Console, open Authentication > Sign-in method and enable Email/Password.
  The site asks users only for a username and password. It turns the username into an
  internal email-shaped login for Firebase, so users do not need to provide an email.

HOW TO USE IT
  Arrow keys / Tab   move along the row of tiles (Home and End jump to the first or last)
  Enter              start the selected app
  Mouse or touch     click a tile to select it, click it again (or press Start) to open it
  Up arrow           go to the power button (Turn off, Restart)
  Esc                go back to the home screen

FOLDERS
  index.html          the page shell
  css/desktop.css     the PS4 look (home screen, tiles, top bar, full-screen apps, menus)
  css/marketplace.css styles for the Marketplace app
  js/core.js          small vector icons, generated cover art, and a helper for building elements
  js/wallpaper.js     draws the animated blue wave background
  js/desktop.js       tiles, top bar, apps, power menu, and the APPS list
  js/marketplace.js   the Marketplace app (logic unchanged)
  assets/             square tile pictures for My Portfolio and Obstacle Game
  apps/portfolio/     your portfolio, unchanged
  apps/isaac/         your Isaac roster page, unchanged

ADD OR CHANGE AN APP
  Open js/desktop.js and edit the APPS list near the top.
    art:            the tile picture (a file path, or Icons.cover('bag') / Icons.cover('mail'))
    kind: 'frame'   opens one of your pages full screen inside the hub
    kind: 'custom'  builds its own content with a mount function
    kind: 'link'    opens a website in a new tab
  Some sites (Facebook, for example) refuse to load inside the hub, so use 'link' for those.
  Tile pictures look best square. For a wide screenshot, make a square version with the
  screenshot centered on a blurred copy of itself (see the files in assets/).

CHANGE THE NAME, USER, OR COLORS
  HUB_NAME, USER_NAME and AVATAR are at the top of js/desktop.js. Also change <title> in index.html.
  Background colors are at the top of js/wallpaper.js. UI colors are the :root variables in css/desktop.css.

MARKETPLACE NOTES
  Listings, likes and comments are shared through Firestore. Accounts and signed-in
  sessions are handled by Firebase Authentication. Photos are shrunk to 720px before
  upload so each listing stays within Firestore's document size limit.
  Photos are shrunk to 720px before saving so the browser storage does not fill up fast.
