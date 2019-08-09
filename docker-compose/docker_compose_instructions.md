In order to use docker secrets for IDM authentication parameters, follow the following steps:

-   Register the application on IDM
-   Insert the sensitive data into the file **age_idm_auth.txt**
-   Run docker engine in swarm mode (if it isn't yet): `docker swarm init`
-   Start docker-compose by: `docker-compose up -d`
-   Destroy docker-compose by: `docker-compose down -v`
-   Change to standalone mode (if you need it): `docker swarm leave`
