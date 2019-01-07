# DOCUMENTAZIONE API

Ad uno sviluppatore esterno saranno disponibili due API (su http://localhost:8080):

- path /routing/public/partenza=:Start&arrivo=:Destination <br>
    permette di ricevere come risposta un JSON con le informazioni riguardanti il tragitto da partenza a destinazione con i mezzi pubblici.
- path /routing/car/partenza=:Start&arrivo=:Destination <br>
    permette di ricevere come risposta un JSON con le informazioni riguardanti il tragitto da partenza a destinazione con i mezzi privati.

I file JSON ritornati saranno composti alla stessa maniera. Un esempio indicativo è il seguente:

{
  "response": {
    "metaInfo": {
      "timestamp": "2019-01-07T15:34:50Z",
      "mapVersion": "8.30.92.151",
      "moduleVersion": "7.2.201900-1265",
      "interfaceVersion": "2.6.34",
      "availableMapVersion": [
        "8.30.92.151"
      ]
    },
    "route": [
      {
        "waypoint": [
          {
            "linkId": "-826632453",
            "mappedPosition": {
              "latitude": 52.5162041,
              "longitude": 13.378365
            },
            "originalPosition": {
              "latitude": 52.5159999,
              "longitude": 13.3778999
            },
            "type": "stopOver",
            "spot": 0.5384615,
            "sideOfStreet": "right",
            "mappedRoadName": "Pariser Platz",
            "label": "Pariser Platz",
            "shapeIndex": 0
          },
          {
            "linkId": "+722940051",
            "mappedPosition": {
              "latitude": 52.5206638,
              "longitude": 13.3861149
            },
            "originalPosition": {
              "latitude": 52.5205999,
              "longitude": 13.3861999
            },
            "type": "stopOver",
            "spot": 0.4634146,
            "sideOfStreet": "right",
            "mappedRoadName": "Reichstagufer",
            "label": "Reichstagufer",
            "shapeIndex": 14
          }
        ],
        "mode": {
          "type": "fastest",
          "transportModes": [
            "car"
          ],
          "trafficMode": "enabled",
          "feature": []
        },
        "leg": [
          {
            "start": {
              "linkId": "-826632453",
              "mappedPosition": {
                "latitude": 52.5162041,
                "longitude": 13.378365
              },
              "originalPosition": {
                "latitude": 52.5159999,
                "longitude": 13.3778999
              },
              "type": "stopOver",
              "spot": 0.5384615,
              "sideOfStreet": "right",
              "mappedRoadName": "Pariser Platz",
              "label": "Pariser Platz",
              "shapeIndex": 0
            },
            "end": {
              "linkId": "+722940051",
              "mappedPosition": {
                "latitude": 52.5206638,
                "longitude": 13.3861149
              },
              "originalPosition": {
                "latitude": 52.5205999,
                "longitude": 13.3861999
              },
              "type": "stopOver",
              "spot": 0.4634146,
              "sideOfStreet": "right",
              "mappedRoadName": "Reichstagufer",
              "label": "Reichstagufer",
              "shapeIndex": 14
            },
            "length": 953,
            "travelTime": 292,
            "maneuver": [
              {
                "position": {
                  "latitude": 52.5162041,
                  "longitude": 13.378365
                },
                "instruction": "Head <span class=\"heading\">east</span> on <span class=\"street\">Pariser Platz</span>. <span class=\"distance-description\">Go for <span class=\"length\">119 m</span>.</span>",
                "travelTime": 88,
                "length": 119,
                "id": "M1",
                "_type": "PrivateTransportManeuverType"
              },
              {
                "position": {
                  "latitude": 52.5162792,
                  "longitude": 13.3795345
                },
                "instruction": "Continue on <span class=\"next-street\">Unter den Linden</span>. <span class=\"distance-description\">Go for <span class=\"length\">90 m</span>.</span>",
                "travelTime": 78,
                "length": 90,
                "id": "M2",
                "_type": "PrivateTransportManeuverType"
              },
              {
                "position": {
                  "latitude": 52.5163651,
                  "longitude": 13.3808541
                },
                "instruction": "Turn <span class=\"direction\">left</span> onto <span class=\"next-street\">Wilhelmstraße</span>. <span class=\"distance-description\">Go for <span class=\"length\">288 m</span>.</span>",
                "travelTime": 52,
                "length": 288,
                "id": "M3",
                "_type": "PrivateTransportManeuverType"
              },
              {
                "position": {
                  "latitude": 52.5189292,
                  "longitude": 13.3802962
                },
                "instruction": "Turn <span class=\"direction\">right</span> onto <span class=\"next-street\">Reichstagufer</span>. <span class=\"distance-description\">Go for <span class=\"length\">447 m</span>.</span>",
                "travelTime": 73,
                "length": 447,
                "id": "M4",
                "_type": "PrivateTransportManeuverType"
              },
              {
                "position": {
                  "latitude": 52.5206638,
                  "longitude": 13.3861149
                },
                "instruction": "Arrive at <span class=\"street\">Reichstagufer</span>. Your destination is on the right.",
                "travelTime": 1,
                "length": 9,
                "id": "M5",
                "_type": "PrivateTransportManeuverType"
              }
            ]
          }
        ],
        "summary": {
          "distance": 953,
          "trafficTime": 292,
          "baseTime": 289,
          "flags": [
            "noThroughRoad",
            "builtUpArea"
          ],
          "text": "The trip takes <span class=\"length\">953 m</span> and <span class=\"time\">5 mins</span>.",
          "travelTime": 292,
          "_type": "RouteSummaryType"
        }
      }
    ],
    "language": "en-us"
  }
}

In caso di errore invece, sarà ritornato un JSON di questo tipo:

{
  "_type": "ns2:RoutingServiceErrorType",
  "type": "ApplicationError",
  "subtype": "InvalidInputData",
  "details": "Longitude is missing",
  "additionalData": [
    {
      "key": "waypoint0",
      "value": "0"
    }
  ],
  "metaInfo": {
    "timestamp": "2019-01-07T15:41:44Z",
    "mapVersion": "8.30.92.151",
    "moduleVersion": "7.2.201900-1265",
    "interfaceVersion": "2.6.34",
    "availableMapVersion": [
      "8.30.92.151"
    ]
  }
}
