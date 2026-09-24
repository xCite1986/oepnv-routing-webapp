import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';
import { AdminDashboard } from '../components/admin/AdminDashboard';
import { AdminApiClient } from '../api/adminClient';

describe('AdminDashboard Component', () => {
  beforeEach(() => {
    sessionStorage.clear();
    AdminApiClient.logout();
  });

  it('displays password prompt when unauthenticated', () => {
    const handleBack = vi.fn();
    render(<AdminDashboard onBackToApp={handleBack} />);

    expect(screen.getByText('Kennwortgeschützter Administrationsbereich')).toBeInTheDocument();
    expect(screen.getByLabelText(/Admin-Kennwort/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Entsperren & Anmelden/i })).toBeInTheDocument();
  });

  it('shows error on invalid password and unlocks on valid password', async () => {
    const handleBack = vi.fn();
    render(<AdminDashboard onBackToApp={handleBack} />);

    const passwordInput = screen.getByLabelText(/Admin-Kennwort/i);
    const submitBtn = screen.getByRole('button', { name: /Entsperren & Anmelden/i });

    // Falsches Kennwort eingeben
    fireEvent.change(passwordInput, { target: { value: 'falsches_kennwort' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Ungültiges Kennwort/i)).toBeInTheDocument();
    });

    // Korrektes Kennwort eingeben
    fireEvent.change(passwordInput, { target: { value: 'admin123' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('ÖPNV Datenpflege & API-Konsole')).toBeInTheDocument();
      expect(screen.getByText('Fahrplandaten & GTFS')).toBeInTheDocument();
    });
  });

  it('locks and logs out when clicking Abmelden', async () => {
    sessionStorage.setItem('oepnv_admin_token', 'test-token');
    const handleBack = vi.fn();
    render(<AdminDashboard onBackToApp={handleBack} />);

    expect(screen.getByText('ÖPNV Datenpflege & API-Konsole')).toBeInTheDocument();

    const logoutBtn = screen.getByRole('button', { name: /Abmelden/i });
    fireEvent.click(logoutBtn);

    await waitFor(() => {
      expect(screen.getByText('Kennwortgeschützter Administrationsbereich')).toBeInTheDocument();
    });
  });

  describe('Authenticated Operations', () => {
    beforeEach(() => {
      sessionStorage.setItem('oepnv_admin_token', 'test-authenticated-token');
    });

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

    it('navigates to train performance tab and renders cost formula and datasets', async () => {
      const handleBack = vi.fn();
      render(<AdminDashboard onBackToApp={handleBack} />);

      const perfTabButton = screen.getByRole('button', { name: /Zug-Performance/i });
      expect(perfTabButton).toBeInTheDocument();

      fireEvent.click(perfTabButton);

      await waitFor(() => {
        const datasetEls = screen.getAllByText(/piebro\/deutsche-bahn-data/i);
        expect(datasetEls.length).toBeGreaterThan(0);
        expect(screen.getByText(/Anschlussrisiko-Simulator/i)).toBeInTheDocument();
        expect(screen.getByText(/Kostenfunktion \(§18\) & Gewichtungsfaktoren/i)).toBeInTheDocument();
      });
    });
  });
});
