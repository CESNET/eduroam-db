# TODO list
- doplnit (a vytvorit) konkretni odkaz jak ma vypadat informacni URL pro navstevniky
  - https://github.com/CESNET/eduroam-db/blob/master/web/coverage/views/index.pug#L66
  - https://github.com/CESNET/eduroam-db/blob/master/web/coverage/views/index.pug#L168

- dalsi moznosti do listu nabizenych sifrovani?
  - https://github.com/CESNET/eduroam-db/blob/master/web/coverage/views/index.pug#L184

- KML pro eduroam.cz
  - mapy:
    - zachovat strukturu aktualniho KML
    - z institution.json brat koordinaty vsech bodu

  - prehled pripojenych instituci:
    - prozatim nepredelavat generator seznamu pripojenych lokalit, zavisi ale na XML datech


- postup nasazeni pokryti.eduroam.cz:
  1. otestovani aplikace pokryti.eduroam.cz

  2. priprava skriptu pro export do celosvetove db, diffovani [SOLVED]
     - cron 1x denne pomoci [inst_json.sh](https://github.com/CESNET/eduroam-db/blob/master/convertor/inst_json.sh)
     - soucasti cronu je zaloha

  3. uprava map pro eduroam.cz
     - souvislost s mapou pokryti na eduroam.cz, prehledem pripojenych insitituci
     - navrh mapy je na https://ermon.cesnet.cz/pokryti/nove_mapy/map_small.html
       - zdrojova data ve formatu geojson
       - je potreba doresit generovani dat
       - git repo?
     - souvislost s prehledem pripojenych instituci
       - zavislost na XML datech

  4. uprava dokumentace na eduroam.cz
     - pridat odkaz a popis na monitor.eduroam.cz

  5. uprava pripojovani.eduroam.cz
     - prebirani informaci o stavu pokryti z monitoringu je hotove
     - pridani atributu do ldapu - reference na realm, ktery obsahuje testovaci ucet

  6. uprava testu v ermonu
     - zlikvidovat test INST-XML
     - upravit test INST-JSON (vlastni kontroly proti schematu + dodatecne kontroly?)
       - jiny nazev? (pokud ano, je potreba reflektovat v pripojovani.eduroam.cz)
       - pridat kontroly proti schematu
       - dodatecne kontroly (viz aktualni test)

  7. import cistych dat z XML do aplikace pokryti.eduroam.cz
     - smazat data posledni upravy

  8. informovani adminu

  9. zadost o zmenu formatu exportu v celosvetove db


