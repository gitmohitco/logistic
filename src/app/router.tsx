import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '../layouts/AppLayout';
import { ProtectedRoute } from '../features/auth/ProtectedRoute';
import { LoginPage } from '../features/auth/LoginPage';
import { AccessDeniedPage } from '../features/auth/AccessDeniedPage';
import { NotFoundPage } from '../features/auth/NotFoundPage';
import { DashboardView } from '../features/dashboard/DashboardView';
import { ShipmentsListPage } from '../features/shipments/ShipmentsListPage';
import { ShipmentDetailsPage } from '../features/shipments/ShipmentDetailsPage';
import { BulkTrackingPage } from '../features/bulk-tracking/BulkTrackingPage';
import { TrackingEventsPage } from '../features/tracking-events/TrackingEventsPage';
import { ShipmentExceptionsPage } from '../features/exceptions/ShipmentExceptionsPage';
import { AiAssistantPage } from '../features/ai-assistant/AiAssistantPage';
import { UserManagementPage } from '../features/user-management/UserManagementPage';
import { SettingsPage } from '../features/settings/SettingsPage';

export const AppRouter: React.FC = () => {
  return (
    <Routes>
      {/* Public / Authentication Route */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/access-denied" element={<AccessDeniedPage />} />

      {/* Protected Routes wrapped in AppLayout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout pageTitle="Shipment Exception Control Tower">
              <Navigate to="/dashboard" replace />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AppLayout pageTitle="Logistics Control Tower Workspace" breadcrumb={['Control Tower', 'Dashboard']}>
              <DashboardView />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/shipments"
        element={
          <ProtectedRoute>
            <AppLayout pageTitle="Shipment Manifest Directory" breadcrumb={['Control Tower', 'Shipments']}>
              <ShipmentsListPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/shipments/:id"
        element={
          <ProtectedRoute>
            <AppLayout pageTitle="Shipment Operational Dossier" breadcrumb={['Shipments', 'Details']}>
              <ShipmentDetailsPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/bulk-track"
        element={
          <ProtectedRoute requiredPermission="canBulkTrack">
            <AppLayout pageTitle="Bulk Shipment Tracking" breadcrumb={['Shipments', 'Bulk Tracking']}>
              <BulkTrackingPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/tracking-events"
        element={
          <ProtectedRoute>
            <AppLayout pageTitle="Live Tracking Events Feed" breadcrumb={['Control Tower', 'Events Feed']}>
              <TrackingEventsPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/exceptions"
        element={
          <ProtectedRoute
            allowedRoles={[
              'ADMINISTRATOR',
              'CONTROL_TOWER_ANALYST',
              'DISPATCHER_PLANNER',
              'CARRIER',
              'WAREHOUSE_SUPERVISOR',
              'CUSTOMER_SERVICE',
            ]}
          >
            <AppLayout pageTitle="Shipment Exception War Room" breadcrumb={['Control Tower', 'Exceptions']}>
              <ShipmentExceptionsPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/ai-assistant"
        element={
          <ProtectedRoute requiredPermission="canUseAiAssistant">
            <AppLayout pageTitle="Mendix AI Operations Copilot" breadcrumb={['AI Services', 'Copilot']}>
              <AiAssistantPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/users"
        element={
          <ProtectedRoute requiredPermission="canManageUsers">
            <AppLayout pageTitle="Administrator User Entitlements" breadcrumb={['Administration', 'Users']}>
              <UserManagementPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <AppLayout pageTitle="System Preferences & Profile Settings" breadcrumb={['Control Tower', 'Settings']}>
              <SettingsPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Catch-all 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
