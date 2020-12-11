# OPC UA Agent Secure Connection Configuration

#### Step 1 - Keys pair generation

Create a file called "user-key.conf" with the following content:

```
[ req ]
default_bits = 2048
default_md = sha256
distinguished_name = subject
req_extensions = req_ext
x509_extensions = req_ext
string_mask = utf8only
prompt = no

[ req_ext ]
basicConstraints = CA:FALSE
nsCertType = client, server
keyUsage = nonRepudiation, digitalSignature, keyEncipherment, dataEncipherment, keyCertSign
extendedKeyUsage= serverAuth, clientAuth
nsComment = "Node OPC UA User Cert"
subjectKeyIdentifier=hash
authorityKeyIdentifier=keyid,issuer
subjectAltName = URI:urn:opcua:user:eng,IP: 127.0.0.1

[ subject ]
countryName = IT
stateOrProvinceName = IT
localityName = Palermo
organizationName = EngineeringIngegneriaInformatica
commonName = ENG
```

Within the same directory, generate both certificate and private key running the following command:

```bash
openssl req -x509 -days 365 -new -out client_certificate.pem -keyout client_private_key_encr.pem -config user-key.conf   
```

#### Step 2 - Password deletion from private key

Remove the password from your private key:

```bash
openssl rsa -in client_private_key_encr.pem -out client_private_key.pem
```

#### Step 3 - Certificate and private key installation
Put **client_private_key.pem** and **client_certificate.pem** **under _iotagent-opcua/certificates_** folder. Finally specify the proper connection settings in your *config.properties* file.

*P.S: Always remember to trust your clint certificate on your OPC UA Server.*
