# TODO list
- service file pro systemd

- doplnit (a vytvorit) konkretni odkaz jak ma vypadat informacni URL pro navstevniky
  - https://github.com/CESNET/eduroam-db/blob/master/web/coverage/views/index.pug#L66
  - https://github.com/CESNET/eduroam-db/blob/master/web/coverage/views/index.pug#L168

- dalsi moznosti do listu nabizenych sifrovani?
  - https://github.com/CESNET/eduroam-db/blob/master/web/coverage/views/index.pug#L184

- mapy:
  - prerusena editace a nasledny vyber noveho realmu -> vede na nejakou chybu
  - pridat sede signalizacni boxy, ze mapa se nacita?

- KML pro eduroam.cz
  - mapy:
    - zachovat strukturu aktualniho KML
    - z institution.json brat koordinaty vsech bodu

  - prehled pripojenych instituci:
    - prozatim nepredavat generator seznamu pripojenych lokalit, zavisi ale na XML datech


- nasazeni pokryti.eduroam.cz
  - souvislost s mapou pokryti na eduroam.cz, prehledem pripojenych insitituci
  - pripojovani.eduroam.cz - bude potreba uprava evidence xml
  - ermon - revize testu
