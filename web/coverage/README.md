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
  - zakaz scrollovani, scrollovani pomoci ctrl + kolecka

- predelat dropdowny v lokalitach na checkboxy?

- vizualni signalizace super admin modu?
  - ano
  
- chybove podbarveni pro konkrentni lokalitu? tohle by asi nebylo uplne jednoduche implementovat
  - ta se bez toho obejdeme

- abecedni setrideni realmu?
  - hezci reverzne podle domen jako mame na matici

- vratit puvodni modrou barvu odkazu pro nazvy jednotlivych sekci? Po uprave knihovny se tohle rozbilo
