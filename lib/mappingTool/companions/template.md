The OPCUA Agent is able to support any kind of OPCUA companion, just adding in the folder companions the relative
template, named as "nameofthecompanion".template.json In this way the mapping tool can recognize matching the
"nameofthecompanion" provided as filename with companion name in the server namespaces. In the following an example of
template can be used as starting point to create a new data model. Each key of the JSON structure is commented out to
provide a brief description of them.

```
{
	"id": "WwMachine", #entity id
	"type": "WoodWorkingMachine", #type of entity, MUST NOT BE CHANGED
	"Machines": [{#List of all woodworking machines managed in a plant. Each <Machine> Object represents an instance of a machine. In the simplest case, there is only one machine.
		"Identification": {#The Identification Object provides identification information of the woodworking machine
			"LocationPlant": {			   #name of the attribute
				"ocb_id": "LocationPlant", #name of the attribute
				"ocb_type" : "Text",	   #type of the attribute
				"ocb_behaviour": "Passive",#behaviour of the attribute. Passive (monitored on demand) or Active (constantly monitored) are the allowed values.
				"opcua_id": "ns=5;s=Rover.Identification.LocationPlant" #nodeId of the attribute
			}
			,...,
			"Location": {
				"ocb_id": "Location",
				"ocb_type" : "Text",
				"ocb_behaviour": "Passive",
				"opcua_id": "ns=5;s=Rover.Identification.Location"
			}
		},
		"State": { #The State Object provide information about the states of the machine.
			"Machine": {
				"Overview": {
					"CurrentState": {
						"ocb_id": "CurrentState",
						"ocb_type" : "Text",
						"ocb_behaviour": "Passive",
						"opcua_id": "ns=5;s=Rover.State.Machine.Overview.CurrentState"
					}
				},
				"Flags": {
					"MachineOn": {
						"ocb_id": "MachineOn",
						"ocb_type" : "Boolean",
						"ocb_behaviour": "Passive",
						"opcua_id": "ns=5;s=Rover.State.Machine.Flags.MachineOn"
					}
				},
				"Values": {
					"AxisOverride": {
						"ocb_id": "AxisOverride",
						"ocb_type" : "Number",
						"ocb_behaviour": "Active",
						"opcua_id": "ns=5;s=Rover.State.Machine.Values.AxisOverride"
					}
					,..,
					"RelativePiecesOut": {
						"ocb_id": "RelativePiecesOut",
						"ocb_type" : "Number",
						"ocb_behaviour": "Active",
						"opcua_id": "ns=5;s=Rover.State.Machine.Values.RelativePiecesOut"
					}
				}
			}
		},
		"Events": [],#The Events Object provides events.
		"ManufacturerSpecific": {}#The ManufacturerSpecific Object provides manufacturer specific functionality.
	}]
}

```
