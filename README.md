# Progetto-RC
Progetto per il corso 2018/19 di Reti di Calcolatori, tenuto dal prof. Andrea Vitaletti presso La Sapienza Università di Roma.

## Requisiti
I requisiti del progetto sono i seguenti:
- Il servizio REST che implementate (lo chiameremo SERV) deve offrire delle API documentate (e.g. GET /sanlorenzo fornisce tutti i cinema di sanlorenzo)

- SERV si deve interfacciare con almeno due servizi REST “esterni”, cioè non su localhost

- Almeno uno dei servizi REST esterni deve essere “commerciale” (es: twitter, google, facebook, pubnub, parse, firbase etc)
- Almeno uno dei servizi REST esterni deve richiedere oauth
- Si devono usare Websocket e/o AMQP (o simili es MQTT)

- Il progetto deve essere su GIT (GITHUB, GITLAB ...) e documentato don un README
- Le API  REST implementate in SERV devono essere documentate su GIT e devono essere validate con un caso di test 

## Tecnologie utilizzate
- REST 1: Twitter (oAuth)
- REST 2: Here
  1. Routing
  2. Places
  3. Geocoder
- WebSocket
- Docker

## Idea del Progetto
Applicazione che permette ad un utente di trovare un percorso inserendo una via di partenza e un luogo di destinazione, la destinazione infatti può essere indicata sia tramite una via, che tramite un luogo di interesse (e.g. McDonalds).

L'utente ha la possibilità di specificare il tipo di trasporto (a scelta fra trasporti pubblici e privati).

In base al tipo di trasporto scelto, l'utente ha a disposizione servizi diversi:

- Trasporto Pubblico: l'utente ha a disposizione una chat broadcast per comunicare con gli altri utenti, intrattenersi nell'attesa dei mezzi e eventualmente avere informazioni ulteriori su ritardi o altro. In aggiunta, l'utente può scegliere di fare l'accesso a Twitter per identificarsi nella chat tramite il proprio username.   
- Trasporto Privato: l'utente ha la possibilità di fare l'accesso a Twitter per condividere con i suoi followers i luoghi di partenza e destinazione del viaggio che sta intraprendendo, in modo tale da offrirsi per un servizio di car sharing.

## API REST
L'Applicazione espone due API tramite le quali offre un servizio di mesh-up dei servizi offerti dalle API REST utilizzate. La documentazione relativa alle API è nel file API_documentation.md nella stessa cartella del README.md.
