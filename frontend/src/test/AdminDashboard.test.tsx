import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { AdminDashboard } from '../components/admin/AdminDashboard';

describe('AdminDashboard Component', () => {
  it('renders admin title and navigation tabs', () => {
    const handleBack = vi.fn();
    render(<AdminDashboard onBackToApp={handleBack} />);

    expect(screen.getByText('ÖPNV Datenpflege & API-Konsole')).toBeInTheDocument();
    expect(screen.getByText('Fahrplandaten & GTFS')).toBeInTheDocument();
    expect(screen.getByText('API-Status & Diagnostik')).toBeInTheDocument();
    expect(screen.getByText('Live-Echtzeit-Monitor')).toBeInTheDocument();
    expect(screen.getByText('Konfiguration & Schnittstellen')).toBeInTheDocument();
  });

  it('displays GTFS feeds for Wiener Linien and ÖBB', async () => {
    const handleBack = vi.fn();
    render(<AdminDashboard onBackToApp={handleBack} />);

    await waitFor(() => {
      expect(screen.getByText(/Wiener Linien GTFS/i)).toBeInTheDocument();
      expect(screen.getByText(/ÖBB Personenverkehr GTFS/i)).toBeInTheDocument();
    });
  });
});
