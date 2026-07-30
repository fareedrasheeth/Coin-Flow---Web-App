'use client';
import React from 'react';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import ToastNotification from '@/components/ToastNotification';
import FullSlotAlertModal from '@/components/Modals/FullSlotAlertModal';
import ResetConfirmModal from '@/components/Modals/ResetConfirmModal';
import EmergencyModal from '@/components/Modals/EmergencyModal';

export default function AppShell({ children, pageTitle = 'Overview Dashboard' }) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Navbar title={pageTitle} />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
          {children}
        </main>
      </div>

      {/* Global Modals & Notifications */}
      <ToastNotification />
      <FullSlotAlertModal />
      <ResetConfirmModal />
      <EmergencyModal />
    </div>
  );
}
