import { Journey, JourneySearchResponse, IncidentAlert } from '../types/routing';

export function createMockViennaJourneys(baseDateStr?: string): JourneySearchResponse {
  const baseTime = baseDateStr ? new Date(baseDateStr) : new Date();
  
  // Format Hilfsfunktion
  const addMinutes = (date: Date, minutes: number) => new Date(date.getTime() + minutes * 60 * 1000);
  const toISO = (date: Date) => date.toISOString();

  // Route 1: EMPFOHLEN (U1 + S7 via Praterstern) - 39 min
  // Trotz 1 extra Umstieg früher da, weil direkte S7 verspätet ist!
  const dep1 = baseTime;
  const leg1WalkEnd = addMinutes(dep1, 4);
  const leg1SubwayDep = addMinutes(dep1, 4);
  const leg1SubwayArr = addMinutes(dep1, 10);
  const leg1TransferEnd = addMinutes(dep1, 13);
  const leg2TrainDep = addMinutes(dep1, 13);
  const leg2TrainArr = addMinutes(dep1, 37);
  const arr1 = addMinutes(dep1, 39);

  const journey1: Journey = {
    id: 'journey-rec-u1-s7',
    recommended: true,
    categoryTag: 'EMPFOHLEN',
    tagLabel: 'EMPFOHLEN',
    departureTime: toISO(dep1),
    arrivalTime: toISO(arr1),
    durationSeconds: 39 * 60,
    walkingSeconds: 6 * 60,
    walkingMeters: 400,
    transferCount: 2,
    realtime: true,
    totalDelayMinutes: 0,
    explanation: {
      headline: 'Aktuell schnellste Verbindung',
      details: [
        'Trotz eines zusätzlichen Umstiegs bist du aktuell 8 Minuten schneller am Ziel.',
        'Die direkte Verbindung über Wien Mitte ist wegen einer Weichenstörung derzeit um 11 Minuten verspätet.',
        'Der Umstieg am Praterstern bietet einen sicheren Zeitpuffer von 3 Minuten auf demselben Bahnsteigbereich.'
      ]
    },
    legs: [
      {
        id: 'leg-1-1',
        type: 'WALK',
        fromStop: {
          name: 'Stephansplatz',
          lat: 48.20849,
          lon: 16.37208,
          scheduledTime: toISO(dep1),
        },
        toStop: {
          name: 'Stephansplatz U',
          lat: 48.20849,
          lon: 16.37208,
          platform: 'U1 Bahnsteig',
          scheduledTime: toISO(leg1WalkEnd),
        },
        startTime: toISO(dep1),
        endTime: toISO(leg1WalkEnd),
        durationSeconds: 4 * 60,
        distanceMeters: 280,
        realtimeStatus: 'ON_TIME',
        delayMinutes: 0,
        coordinates: [
          [16.37208, 48.20849],
          [16.37220, 48.20870],
          [16.37240, 48.20890],
        ]
      },
      {
        id: 'leg-1-2',
        type: 'SUBWAY',
        line: 'U1',
        headsign: 'Leopoldau',
        color: '#e2001a',
        textColor: '#ffffff',
        fromStop: {
          name: 'Stephansplatz U',
          lat: 48.20849,
          lon: 16.37208,
          platform: 'Gleis 1',
          scheduledTime: toISO(leg1SubwayDep),
          estimatedTime: toISO(leg1SubwayDep),
        },
        toStop: {
          name: 'Praterstern U',
          lat: 48.21780,
          lon: 16.39170,
          platform: 'Gleis 1',
          scheduledTime: toISO(leg1SubwayArr),
          estimatedTime: toISO(leg1SubwayArr),
        },
        startTime: toISO(leg1SubwayDep),
        endTime: toISO(leg1SubwayArr),
        durationSeconds: 6 * 60,
        stopsCount: 3,
        intermediateStops: [
          { name: 'Schwedenplatz', scheduledTime: toISO(addMinutes(dep1, 6)), delayMinutes: 0 },
          { name: 'Nestroyplatz', scheduledTime: toISO(addMinutes(dep1, 8)), delayMinutes: 0 },
        ],
        realtimeStatus: 'ON_TIME',
        delayMinutes: 0,
        coordinates: [
          [16.37240, 48.20890],
          [16.37750, 48.21140],
          [16.38450, 48.21480],
          [16.39170, 48.21780]
        ]
      },
      {
        id: 'leg-1-3',
        type: 'WALK',
        fromStop: {
          name: 'Praterstern U',
          lat: 48.21780,
          lon: 16.39170,
          scheduledTime: toISO(leg1SubwayArr),
        },
        toStop: {
          name: 'Praterstern S-Bahn',
          lat: 48.21810,
          lon: 16.39220,
          platform: 'Bahnsteig 1/2',
          scheduledTime: toISO(leg1TransferEnd),
        },
        startTime: toISO(leg1SubwayArr),
        endTime: toISO(leg1TransferEnd),
        durationSeconds: 3 * 60,
        distanceMeters: 180,
        realtimeStatus: 'ON_TIME',
        delayMinutes: 0,
        transferInfo: {
          stationName: 'Praterstern',
          durationSeconds: 180,
          walkingMeters: 180,
          difficulty: 'RELAXED',
          difficultyLabel: 'Entspannter Umstieg',
          bufferMinutes: 3,
          isPlatformCross: false
        },
        coordinates: [
          [16.39170, 48.21780],
          [16.39220, 48.21810]
        ]
      },
      {
        id: 'leg-1-4',
        type: 'TRAIN',
        line: 'S7',
        headsign: 'Flughafen Wien / Wolfsthal',
        color: '#0284c7',
        textColor: '#ffffff',
        fromStop: {
          name: 'Praterstern S-Bahn',
          lat: 48.21810,
          lon: 16.39220,
          platform: 'Bahnsteig 2',
          scheduledTime: toISO(leg2TrainDep),
          estimatedTime: toISO(leg2TrainDep),
        },
        toStop: {
          name: 'Flughafen Wien',
          lat: 48.11030,
          lon: 16.56970,
          platform: 'Bahnsteig 1',
          scheduledTime: toISO(leg2TrainArr),
          estimatedTime: toISO(leg2TrainArr),
        },
        startTime: toISO(leg2TrainDep),
        endTime: toISO(leg2TrainArr),
        durationSeconds: 24 * 60,
        stopsCount: 7,
        intermediateStops: [
          { name: 'Wien Rennweg', scheduledTime: toISO(addMinutes(dep1, 18)), delayMinutes: 0 },
          { name: 'Wien St. Marx', scheduledTime: toISO(addMinutes(dep1, 21)), delayMinutes: 0 },
          { name: 'Wien Geiselbergstraße', scheduledTime: toISO(addMinutes(dep1, 23)), delayMinutes: 0 },
          { name: 'Wien Zentralfriedhof', scheduledTime: toISO(addMinutes(dep1, 26)), delayMinutes: 0 },
          { name: 'Kaiserebersdorf', scheduledTime: toISO(addMinutes(dep1, 29)), delayMinutes: 0 },
          { name: 'Schwechat', scheduledTime: toISO(addMinutes(dep1, 32)), delayMinutes: 0 },
          { name: 'Mannswörth', scheduledTime: toISO(addMinutes(dep1, 35)), delayMinutes: 0 },
        ],
        realtimeStatus: 'ON_TIME',
        delayMinutes: 0,
        coordinates: [
          [16.39220, 48.21810],
          [16.38600, 48.20600],
          [16.38500, 48.19400],
          [16.40200, 48.18800],
          [16.44200, 48.15200],
          [16.47800, 48.13900],
          [16.56970, 48.11030]
        ]
      },
      {
        id: 'leg-1-5',
        type: 'WALK',
        fromStop: {
          name: 'Flughafen Wien Bahnhof',
          lat: 48.11030,
          lon: 16.56970,
          scheduledTime: toISO(leg2TrainArr),
        },
        toStop: {
          name: 'Flughafen Wien Terminal 1/3',
          lat: 48.11110,
          lon: 16.56850,
          scheduledTime: toISO(arr1),
        },
        startTime: toISO(leg2TrainArr),
        endTime: toISO(arr1),
        durationSeconds: 2 * 60,
        distanceMeters: 120,
        realtimeStatus: 'ON_TIME',
        delayMinutes: 0,
        coordinates: [
          [16.56970, 48.11030],
          [16.56850, 48.11110]
        ]
      }
    ]
  };

  // Route 2: DIREKTER (0-1 Umstieg, aber verspätet: 47 min statt 36 min)
  const dep2 = baseTime;
  const leg2_1WalkEnd = addMinutes(dep2, 9);
  const leg2_TrainSchedArr = addMinutes(dep2, 36);
  const leg2_TrainRealArr = addMinutes(dep2, 47); // +11 min Delay!
  const arr2 = addMinutes(dep2, 47);

  const journey2: Journey = {
    id: 'journey-alt-direkt-wienmitte',
    recommended: false,
    categoryTag: 'DIREKTER',
    tagLabel: 'DIREKTER',
    departureTime: toISO(dep2),
    arrivalTime: toISO(arr2),
    durationSeconds: 47 * 60,
    walkingSeconds: 9 * 60,
    walkingMeters: 620,
    transferCount: 0,
    realtime: true,
    totalDelayMinutes: 11,
    hasDisruptions: true,
    explanation: {
      headline: 'Direkte Alternative',
      details: [
        'Kein Linienumstieg nötig (Fußweg nach Wien Mitte).',
        'Aktuell +11 Minuten verspätet aufgrund einer Weichenstörung im Bereich Rennweg.',
        'Ankunft 8 Minuten später als die empfohlene Verbindung.'
      ]
    },
    comparisonWithRecommended: {
      timeDiffMinutes: 8,
      transferDiff: -2,
      walkDiffMinutes: 3,
      summaryText: '8 min langsamer • aktuell +11 min verspätet',
      reasons: [
        '8 min später am Ziel',
        'Aktuell +11 min verspätet',
        '220 m längerer Fußweg zu Fuß nach Wien Mitte'
      ]
    },
    legs: [
      {
        id: 'leg-2-1',
        type: 'WALK',
        fromStop: {
          name: 'Stephansplatz',
          lat: 48.20849,
          lon: 16.37208,
          scheduledTime: toISO(dep2),
        },
        toStop: {
          name: 'Wien Mitte Landstraße',
          lat: 48.20630,
          lon: 16.38550,
          platform: 'Bahnsteig 1',
          scheduledTime: toISO(leg2_1WalkEnd),
        },
        startTime: toISO(dep2),
        endTime: toISO(leg2_1WalkEnd),
        durationSeconds: 9 * 60,
        distanceMeters: 620,
        realtimeStatus: 'ON_TIME',
        delayMinutes: 0,
        coordinates: [
          [16.37208, 48.20849],
          [16.37900, 48.20700],
          [16.38550, 48.20630]
        ]
      },
      {
        id: 'leg-2-2',
        type: 'TRAIN',
        line: 'S7',
        headsign: 'Flughafen Wien',
        color: '#0284c7',
        textColor: '#ffffff',
        fromStop: {
          name: 'Wien Mitte Landstraße',
          lat: 48.20630,
          lon: 16.38550,
          platform: 'Gleis 1',
          scheduledTime: toISO(leg2_1WalkEnd),
          estimatedTime: toISO(addMinutes(leg2_1WalkEnd, 11)),
          delayMinutes: 11
        },
        toStop: {
          name: 'Flughafen Wien',
          lat: 48.11030,
          lon: 16.56970,
          platform: 'Bahnsteig 2',
          scheduledTime: toISO(leg2_TrainSchedArr),
          estimatedTime: toISO(leg2_TrainRealArr),
          delayMinutes: 11
        },
        startTime: toISO(leg2_1WalkEnd),
        endTime: toISO(arr2),
        durationSeconds: 38 * 60,
        stopsCount: 6,
        realtimeStatus: 'DELAYED',
        delayMinutes: 11,
        disruptionNotice: 'Weichenstörung Rennweg: Verzögerungen von 10-15 Min.',
        coordinates: [
          [16.38550, 48.20630],
          [16.38500, 48.19400],
          [16.40200, 48.18800],
          [16.44200, 48.15200],
          [16.47800, 48.13900],
          [16.56970, 48.11030]
        ]
      }
    ]
  };

  // Route 3: WENIGER ZU FUSS (U3 + REX 7) - 51 min
  const dep3 = addMinutes(baseTime, 2);
  const leg3_U3End = addMinutes(dep3, 4);
  const leg3_TransferEnd = addMinutes(dep3, 16); // 12 min Wartezeit auf REX
  const leg3_RexEnd = addMinutes(dep3, 47);
  const arr3 = addMinutes(dep3, 49);

  const journey3: Journey = {
    id: 'journey-alt-less-walk',
    recommended: false,
    categoryTag: 'WENIGER_FUSSWEG',
    tagLabel: 'WENIGER ZU FUSS',
    departureTime: toISO(dep3),
    arrivalTime: toISO(arr3),
    durationSeconds: 49 * 60,
    walkingSeconds: 4 * 60,
    walkingMeters: 230,
    transferCount: 1,
    realtime: true,
    totalDelayMinutes: 0,
    explanation: {
      headline: 'Bequeme Alternative mit minimalem Fußweg',
      details: [
        'Kürzester Fußweg (nur 230 m, direkt am U-Bahn-Aufgang Stephansplatz).',
        '12 Minuten Wartezeit am Umsteigebahnhof Wien Mitte auf den nächsten Regionalzug.',
        'Ankunft 10 Minuten später als die empfohlene Verbindung.'
      ]
    },
    comparisonWithRecommended: {
      timeDiffMinutes: 10,
      transferDiff: -1,
      walkDiffMinutes: -2,
      summaryText: '10 min langsamer • 12 min längere Wartezeit',
      reasons: [
        '10 min später am Ziel',
        '12 min Wartezeit am Umstieg Wien Mitte',
        'Sehr geringer Fußweg (230 m)'
      ]
    },
    legs: [
      {
        id: 'leg-3-1',
        type: 'WALK',
        fromStop: {
          name: 'Stephansplatz',
          lat: 48.20849,
          lon: 16.37208,
          scheduledTime: toISO(dep3),
        },
        toStop: {
          name: 'Stephansplatz U',
          lat: 48.20849,
          lon: 16.37208,
          platform: 'U3 Bahnsteig',
          scheduledTime: toISO(addMinutes(dep3, 1)),
        },
        startTime: toISO(dep3),
        endTime: toISO(addMinutes(dep3, 1)),
        durationSeconds: 1 * 60,
        distanceMeters: 80,
        realtimeStatus: 'ON_TIME',
        delayMinutes: 0,
      },
      {
        id: 'leg-3-2',
        type: 'SUBWAY',
        line: 'U3',
        headsign: 'Simmering',
        color: '#ea580c',
        textColor: '#ffffff',
        fromStop: {
          name: 'Stephansplatz U',
          lat: 48.20849,
          lon: 16.37208,
          platform: 'Gleis 2',
          scheduledTime: toISO(addMinutes(dep3, 1)),
        },
        toStop: {
          name: 'Landstraße / Wien Mitte',
          lat: 48.20630,
          lon: 16.38550,
          platform: 'Gleis 2',
          scheduledTime: toISO(leg3_U3End),
        },
        startTime: toISO(addMinutes(dep3, 1)),
        endTime: toISO(leg3_U3End),
        durationSeconds: 3 * 60,
        stopsCount: 2,
        intermediateStops: [
          { name: 'Stubentor', scheduledTime: toISO(addMinutes(dep3, 2)), delayMinutes: 0 }
        ],
        realtimeStatus: 'ON_TIME',
        delayMinutes: 0,
      },
      {
        id: 'leg-3-3',
        type: 'WALK',
        fromStop: {
          name: 'Landstraße U3',
          lat: 48.20630,
          lon: 16.38550,
          scheduledTime: toISO(leg3_U3End),
        },
        toStop: {
          name: 'Wien Mitte S-Bahn',
          lat: 48.20630,
          lon: 16.38550,
          platform: 'Bahnsteig 1',
          scheduledTime: toISO(leg3_TransferEnd),
        },
        startTime: toISO(leg3_U3End),
        endTime: toISO(leg3_TransferEnd),
        durationSeconds: 12 * 60,
        distanceMeters: 100,
        realtimeStatus: 'ON_TIME',
        delayMinutes: 0,
        transferInfo: {
          stationName: 'Wien Mitte',
          durationSeconds: 12 * 60,
          walkingMeters: 100,
          difficulty: 'RELAXED',
          difficultyLabel: 'Entspannter Umstieg (12 min Wartezeit)',
          bufferMinutes: 10,
          isPlatformCross: true
        }
      },
      {
        id: 'leg-3-4',
        type: 'REGIONAL_TRAIN',
        line: 'REX 7',
        headsign: 'Wolfsthal',
        color: '#004b9b',
        textColor: '#ffffff',
        fromStop: {
          name: 'Wien Mitte',
          lat: 48.20630,
          lon: 16.38550,
          platform: 'Bahnsteig 1',
          scheduledTime: toISO(leg3_TransferEnd),
        },
        toStop: {
          name: 'Flughafen Wien',
          lat: 48.11030,
          lon: 16.56970,
          platform: 'Bahnsteig 1',
          scheduledTime: toISO(leg3_RexEnd),
        },
        startTime: toISO(leg3_TransferEnd),
        endTime: toISO(leg3_RexEnd),
        durationSeconds: 31 * 60,
        stopsCount: 4,
        realtimeStatus: 'ON_TIME',
        delayMinutes: 0,
      },
      {
        id: 'leg-3-5',
        type: 'WALK',
        fromStop: {
          name: 'Flughafen Wien',
          lat: 48.11030,
          lon: 16.56970,
          scheduledTime: toISO(leg3_RexEnd),
        },
        toStop: {
          name: 'Flughafen Wien Terminal',
          lat: 48.11080,
          lon: 16.56900,
          scheduledTime: toISO(arr3),
        },
        startTime: toISO(leg3_RexEnd),
        endTime: toISO(arr3),
        durationSeconds: 2 * 60,
        distanceMeters: 50,
        realtimeStatus: 'ON_TIME',
        delayMinutes: 0,
      }
    ]
  };

  return {
    generatedAt: toISO(baseTime),
    recommendedJourneyId: journey1.id,
    journeys: [journey1, journey2, journey3],
    realtimeActive: true,
    disruptionSummary: 'Aktuelle Störungsmeldung: S-Bahn Stammstrecke / Rennweg +10-15 Min. Verzögerung wegen Weichenreparatur.'
  };
}

export const MOCK_INCIDENTS: IncidentAlert[] = [
  {
    id: 'inc-1',
    title: 'S-Bahn Stammstrecke: Verzögerungen',
    description: 'Wegen einer Weichenreparatur im Bereich Wien Rennweg kommt es auf den Linien S1, S2, S3, S4 und S7 zu Verzögerungen von bis zu 15 Minuten.',
    lines: ['S1', 'S2', 'S3', 'S7'],
    severity: 'WARNING',
    validFrom: '2026-09-24T14:30:00+02:00'
  },
  {
    id: 'inc-2',
    title: 'U4: Taktverdichtung nach Signalprüfung',
    description: 'Normaler Betrieb wieder aufgenommen, vereinzelte Folgeverspätungen möglich.',
    lines: ['U4'],
    severity: 'INFO',
    validFrom: '2026-09-24T15:00:00+02:00'
  }
];
