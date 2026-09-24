import React, { useState, useEffect, useCallback } from 'react';
import { Journey, JourneySearchRequest, JourneySearchResponse, Leg } from './types/routing';
import { TransitApiClient } from './api/client';
import { AppShell } from './components/common/AppShell';
import { SearchForm } from './components/search/SearchForm';
import { JourneyResults } from './components/journeys/JourneyResults';
import { MapPanel } from './components/map/MapPanel';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { VIENNA_LOCATIONS } from './api/viennaLocations';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'app' | 'admin'>('app');
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [selectedJourney, setSelectedJourney] = useState<Journey | null>(null);
  const [selectedLeg, setSelectedLeg] = useState<Leg | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [realtimeActive, setRealtimeActive] = useState<boolean>(true);
  const [disruptionSummary, setDisruptionSummary] = useState<string | undefined>();
  const [showMapOnMobile, setShowMapOnMobile] = useState<boolean>(false);
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);
  const [lastRequest, setLastRequest] = useState<JourneySearchRequest | null>(null);

  // Sync hash routing #admin
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#admin') {
        setCurrentView('admin');
      } else {
        setCurrentView('app');
      }
    };
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Check backend availability on mount
  useEffect(() => {
    TransitApiClient.checkBackendHealth().then((isAvailable) => {
      setIsBackendConnected(isAvailable);
    });
  }, []);

  // Execute Search
  const handleSearch = useCallback(async (request: JourneySearchRequest) => {
    setIsLoading(true);
    setError(null);
    setLastRequest(request);

    try {
      const response: JourneySearchResponse = await TransitApiClient.searchJourneys(request);
      setJourneys(response.journeys);
      setRealtimeActive(response.realtimeActive);
      setDisruptionSummary(response.disruptionSummary);

      // Select recommended journey by default
      const rec = response.journeys.find((j) => j.recommended) || response.journeys[0] || null;
      setSelectedJourney(rec);
      setSelectedLeg(null);
    } catch (err: any) {
      setError(err?.message || 'Verbindungssuche fehlgeschlagen. Bitte versuche es erneut.');
      setJourneys([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial Search according to §33: Stephansplatz -> Flughafen Wien
  useEffect(() => {
    const initialRequest: JourneySearchRequest = {
      from: VIENNA_LOCATIONS[0], // Stephansplatz
      to: VIENNA_LOCATIONS[1],   // Flughafen Wien
      dateTime: new Date().toISOString(),
      timeMode: 'DEPARTURE',
      preferences: {
        maxWalkingDistance: 1500,
        maxTransfers: 6,
        optimization: 'FASTEST',
      },
    };
    handleSearch(initialRequest);
  }, [handleSearch]);

  const handleSelectJourney = (journey: Journey) => {
    setSelectedJourney(journey);
    setSelectedLeg(null);
  };

  const handleSelectLeg = (leg: Leg) => {
    setSelectedLeg(leg);
  };

  const handleShowOnMap = (journey: Journey) => {
    setSelectedJourney(journey);
    setShowMapOnMobile(true);
  };

  if (currentView === 'admin') {
    return (
      <AdminDashboard
        onBackToApp={() => {
          window.location.hash = '';
          setCurrentView('app');
        }}
      />
    );
  }

  return (
    <AppShell
      showMapOnMobile={showMapOnMobile}
      onToggleMapMobile={() => setShowMapOnMobile(!showMapOnMobile)}
      isBackendConnected={isBackendConnected}
      onOpenAdmin={() => {
        window.location.hash = '#admin';
        setCurrentView('admin');
      }}
      mapNode={
        <MapPanel
          journey={selectedJourney}
          selectedLeg={selectedLeg}
          isCollapsible={showMapOnMobile}
          onClose={() => setShowMapOnMobile(false)}
        />
      }
    >
      {/* Search Input Form */}
      <SearchForm onSearch={handleSearch} isLoading={isLoading} />

      {/* Results List */}
      <JourneyResults
        journeys={journeys}
        selectedJourneyId={selectedJourney?.id}
        isLoading={isLoading}
        error={error}
        realtimeActive={realtimeActive}
        disruptionSummary={disruptionSummary}
        onSelectJourney={handleSelectJourney}
        onSelectLeg={handleSelectLeg}
        onShowOnMap={handleShowOnMap}
        onRetry={() => lastRequest && handleSearch(lastRequest)}
      />
    </AppShell>
  );
};

export default App;
