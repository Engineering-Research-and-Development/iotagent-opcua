import static org.opcfoundation.ua.utils.EndpointUtil.selectByMessageSecurityMode;
import static org.opcfoundation.ua.utils.EndpointUtil.selectByProtocol;
import static org.opcfoundation.ua.utils.EndpointUtil.sortBySecurityLevel;

import java.io.File;
import java.io.IOException;
import java.net.InetAddress;
import java.security.InvalidAlgorithmParameterException;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.security.cert.CertificateException;
import java.security.spec.InvalidKeySpecException;
import java.security.spec.InvalidParameterSpecException;

import javax.crypto.BadPaddingException;
import javax.crypto.IllegalBlockSizeException;
import javax.crypto.NoSuchPaddingException;

import org.opcfoundation.ua.application.Client;
import org.opcfoundation.ua.application.SessionChannel;
import org.opcfoundation.ua.builtintypes.NodeId;
import org.opcfoundation.ua.common.ServiceFaultException;
import org.opcfoundation.ua.common.ServiceResultException;
import org.opcfoundation.ua.core.Attributes;
import org.opcfoundation.ua.core.BrowseDescription;
import org.opcfoundation.ua.core.BrowseDirection;
import org.opcfoundation.ua.core.BrowseResponse;
import org.opcfoundation.ua.core.BrowseResult;
import org.opcfoundation.ua.core.BrowseResultMask;
import org.opcfoundation.ua.core.EndpointDescription;
import org.opcfoundation.ua.core.Identifiers;
import org.opcfoundation.ua.core.MessageSecurityMode;
import org.opcfoundation.ua.core.NodeClass;
import org.opcfoundation.ua.core.ReadRequest;
import org.opcfoundation.ua.core.ReadResponse;
import org.opcfoundation.ua.core.ReadValueId;
import org.opcfoundation.ua.core.ReferenceDescription;
import org.opcfoundation.ua.core.TimestampsToReturn;
import org.opcfoundation.ua.transport.ServiceChannel;
import org.opcfoundation.ua.transport.security.Cert;
import org.opcfoundation.ua.transport.security.KeyPair;
import org.opcfoundation.ua.transport.security.PrivKey;
import org.opcfoundation.ua.utils.CertificateUtils;

public class Test {
	private static final String PRIVKEY_PASSWORD = "Opc.Ua";

	
	
	public static void main(String[] args) throws ServiceResultException {
		// TODO Auto-generated method stub
///////////// CLIENT //////////////
// Load Client's Application Instance Certificate from file
//KeyPair myClientApplicationInstanceCertificate = ExampleKeys.getCert("Client");
// Create Client
		// Try to load an application certificate with the specified application name.
	    // In case it is not found, a new certificate is created.
	    final KeyPair pair = getCert("Test");

	    // Create the client using information provided by the created certificate
	    final Client myClient = Client.createClientApplication(pair);
//KeyPair myHttpsCertificate = ExampleKeys.getHttpsCert("Client");
//myClient.getApplication().getHttpsSettings().setKeyPair(myHttpsCertificate);
//////////////////////////////////////

////////// DISCOVER ENDPOINT /////////
// Discover server's endpoints, and choose one
//String publicHostname = InetAddress.getLocalHost().getHostName();
String url = "opc.tcp://localhost:4334/UA/MyLittleServer"; // ServerExample1
//url="opc.tcp://opcua.demo-this.com:51210/UA/SampleServer";
//url="opc.tcp://commsvr.com:51234/UA/CAS_UA_Server";
// "https://"+publicHostname+":8443/UAExample"; // ServerExample1
// "opc.tcp://"+publicHostname+":51210/"; // :51210=Sample Server
// "https://"+publicHostname+":51212/SampleServer/"; // :51212=Sample Server
// "opc.tcp://"+publicHostname+":62541/"; // :62541=DataAccess Server
EndpointDescription[] endpoints = myClient.discoverEndpoints(url);
// Filter out all but opc.tcp protocol endpoints
if (url.startsWith("opc.tcp")) {
  endpoints = selectByProtocol(endpoints, "opc.tcp");
  // Filter out all but Signed & Encrypted endpoints
  endpoints = selectByMessageSecurityMode(endpoints, MessageSecurityMode.None);

  // Filter out all but Basic128 cryption endpoints
  // endpoints = selectBySecurityPolicy(endpoints, SecurityPolicy.BASIC128RSA15);
  // Sort endpoints by security level. The lowest level at the
  // beginning, the highest at the end of the array
  endpoints = sortBySecurityLevel(endpoints);
} else {
  endpoints = selectByProtocol(endpoints, "https");
}

// Choose one endpoint
EndpointDescription endpoint = endpoints[endpoints.length - 1];
//////////////////////////////////////

endpoint.setSecurityMode(MessageSecurityMode.None);
///////////// EXECUTE //////////////
SessionChannel mySession = myClient.createSessionChannel(endpoint);
// mySession.activate("username", "123");
mySession.activate();
//////////////////////////////////////
// Browse Root
/*BrowseDescription browse = new BrowseDescription();
browse.setNodeId(Identifiers.RootFolder);
browse.setBrowseDirection(BrowseDirection.Forward);
browse.setIncludeSubtypes(true);
browse.setNodeClassMask(NodeClass.Object, NodeClass.Variable);
browse.setResultMask(BrowseResultMask.All);
BrowseResponse res3 = mySession.Browse(null, null, null, browse);
for (BrowseResult res:res3.getResults()) {
	
	for (ReferenceDescription ref:res.getReferences()) {
		System.out.println(ref.getBrowseName());
	}
}*/

browse(Identifiers.RootFolder,mySession,0);

///////////// SHUTDOWN /////////////
//Close channel
mySession.closeAsync();
//////////////////////////////////////
System.exit(0);
//System.out.println(res3);

//////////// TEST-STACK ////////////
// Create Channel
ServiceChannel myChannel = myClient.createServiceChannel(endpoint);
// Create Test Request
NodeId nodeId=NodeId.parseNodeId("ns=1;s=PumpSpeed");
ReadValueId[] nodesToRead = {new ReadValueId(nodeId, Attributes.Value, null, null)};
ReadRequest req = new ReadRequest(null, 0.0, TimestampsToReturn.Both, nodesToRead);
System.out.println("REQUEST: " + req);

// Invoke service
ReadResponse res = mySession.Read(req);
// Print result
System.out.println("RESPONSE: " + res);
//////////////////////////////////////


///////////// SHUTDOWN /////////////
// Close channel
myChannel.closeAsync();
//////////////////////////////////////
System.exit(0);
	}
	/**
	 * Load file certificate and private key from applicationName.der & .pfx - or create ones if they do not exist
	 * @return the KeyPair composed of the certificate and private key
	 * @throws ServiceResultException
	 */
	public static KeyPair getCert(String applicationName)
	throws ServiceResultException
	{
		File certFile = new File(applicationName + ".der");
		File privKeyFile =  new File(applicationName+ ".pem");
		try {
			Cert myCertificate = Cert.load( certFile );
			PrivKey myPrivateKey = PrivKey.load( privKeyFile, PRIVKEY_PASSWORD );
			return new KeyPair(myCertificate, myPrivateKey); 
		} catch (CertificateException e) {
			throw new ServiceResultException( e );
		} catch (IOException e) {		
			try {
				String hostName = InetAddress.getLocalHost().getHostName();
				String applicationUri = "urn:"+hostName+":"+applicationName;
				KeyPair keys = CertificateUtils.createApplicationInstanceCertificate(applicationName, null, applicationUri, 3650, hostName);
				keys.getCertificate().save(certFile);
				keys.getPrivateKey().save(privKeyFile);
				return keys;
			} catch (Exception e1) {
				throw new ServiceResultException( e1 );
			}
		} catch (NoSuchAlgorithmException e) {
			throw new ServiceResultException( e );
		} catch (InvalidKeyException e) {
			throw new ServiceResultException( e );
		} catch (InvalidKeySpecException e) {
			throw new ServiceResultException( e );
		} catch (NoSuchPaddingException e) {
			throw new ServiceResultException( e );
		} catch (InvalidAlgorithmParameterException e) {
			throw new ServiceResultException( e );
		} catch (IllegalBlockSizeException e) {
			throw new ServiceResultException( e );
		} catch (BadPaddingException e) {
			throw new ServiceResultException( e );
		} catch (InvalidParameterSpecException e) {
			throw new ServiceResultException( e );
		}
	}
	
	
	private static void browse(NodeId nodeId, SessionChannel mySession, int level ) throws ServiceFaultException, ServiceResultException {
//System.out.println("****="+nodeId.toString());
if (level>3)
	return;
		// Browse Root
		BrowseDescription browse = new BrowseDescription();
		browse.setNodeId(nodeId);
		browse.setBrowseDirection(BrowseDirection.Forward);
		browse.setIncludeSubtypes(true);
		browse.setNodeClassMask(NodeClass.Object, NodeClass.Variable);
		browse.setResultMask(BrowseResultMask.All);
		BrowseResponse res3 = mySession.Browse(null, null, null, browse);
		for (BrowseResult res:res3.getResults()) {
			
			for (ReferenceDescription ref:res.getReferences()) {
				for (int i=0; i<level; i++) {
					for (int j=0;j<5;j++)
						System.out.print("-");
				}

				
				try {
					//String childNodeId=ref.getNodeId().toString().substring(ref.getNodeId().toString().lastIndexOf(';')+1);
					
					//System.out.println("ref.getNodeId().getServerIndex()="+ref.getNodeId().getValue().toString());
					//System.out.println("ref.getNodeId().getNamespaceIndex()="+ref.getNodeId().getNamespaceIndex());
					String childNodeId="ns="+ref.getNodeId().getNamespaceIndex()+";i="+ref.getNodeId().getValue().toString();
					//System.out.println("childNodeId="+childNodeId);
					System.out.println(ref.getNodeClass()+": "+ref.getBrowseName()+"("+childNodeId+")");
					browse(NodeId.parseNodeId(childNodeId), mySession, level+1);
				}
				catch (Exception e) {
					// TODO: handle exception
				
				}
			}
		}
	}
	
}
