# TODO list
- service file pro systemd

- doplnit (a vytvorit) konkretni odkaz jak ma vypadat informacni URL pro navstevniky
  - https://github.com/CESNET/eduroam-db/blob/master/web/coverage/views/index.pug#L66
  - https://github.com/CESNET/eduroam-db/blob/master/web/coverage/views/index.pug#L168

- dalsi moznosti do listu nabizenych sifrovani?
  - https://github.com/CESNET/eduroam-db/blob/master/web/coverage/views/index.pug#L184

- mapy:
  - momentalne je pridani bodu na mape pouze dopredne - tj po zadani mesta a ulice je vyhledan prislusny bod na mape
    Pokud by bylo vyhledavani i zpetne (z bodu na mape ulice a mesto), nemohl by to byt pro nektere instituce problem?
    Co kdyz nebudou mit mapy presna data? V takovem pripade by bylo nemozne (?) mit zaroven presne souradnice a ulici/mesto, pokud
    budou mit mapy chybna data.
  - pridat do mapy vyhledani ulice/mesta podle vybraneho bodu na mape?
    - jo tohle je rozumne reseni predchoziho bodu

- predelat dropdowny v lokalitach na checkboxy?
  - pridano, vyhovuje?

- vizualni signalizace super admin modu?
  - pridano, vyhovuje?
  
- chybove podbarveni pro konkrentni lokalitu? tohle by asi nebylo uplne jednoduche implementovat
  - nakonec to bylo celkem jednoduche, vyhovuje?

- vratit puvodni modrou barvu odkazu pro nazvy jednotlivych sekci? Po uprave knihovny se tohle rozbilo

- tlacitko pro zobrazeni JSONu je zpet, ale pouze v admin modu

- pridat mail do requestu na openstreetmap api?
  - detaily viz https://wiki.openstreetmap.org/wiki/Nominatim
