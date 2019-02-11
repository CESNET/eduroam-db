# TODO list
- doplnit (a vytvorit) konkretni odkaz jak ma vypadat informacni URL pro navstevniky
  - https://github.com/CESNET/eduroam-db/blob/master/web/coverage/views/index.pug#L66
  - https://github.com/CESNET/eduroam-db/blob/master/web/coverage/views/index.pug#L168

- dalsi moznosti do listu nabizenych sifrovani?
  - https://github.com/CESNET/eduroam-db/blob/master/web/coverage/views/index.pug#L184

# postup nasazeni pokryti.eduroam.cz:
  1. otestovani aplikace pokryti.eduroam.cz

  2. priprava skriptu pro export do celosvetove db, diffovani [SOLVED]
     - cron 1x denne pomoci [inst_json.sh](https://github.com/CESNET/eduroam-db/blob/master/convertor/inst_json.sh)
     - soucasti cronu je zaloha

  3. uprava map pro eduroam.cz
     - mapy jsou na https://ermon.cesnet.cz/pokryti/nove_mapy/map_small.html a https://ermon.cesnet.cz/pokryti/nove_mapy/map_full.html
     - generovani dat pridano do cronu spolecne s exportem do celosvetove db pomoci [export.sh](https://github.com/CESNET/eduroam-db/blob/master/tools/export.sh)

     - souvislost zdrojovych dat s prehledem pripojenych insitituci
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
       - lokalizace vystupu do cestiny?

  7. import cistych dat z XML do aplikace pokryti.eduroam.cz
     - smazat data posledni upravy

  8. informovani adminu

  9. zadost o zmenu formatu exportu v celosvetove db

