'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import type { Assessment } from '@/types/assessment';
import { mockAssessments } from '@/data/mock-assessments';

interface AssessmentContextType {
  /** All assessments (mock + session-created) */
  assessments: Assessment[];
  /** Add a new assessment to the list */
  addAssessment: (assessment: Assessment) => void;
  /** Find an assessment by ID */
  getAssessment: (id: string) => Assessment | undefined;
}

const AssessmentContext = createContext<AssessmentContextType | undefined>(undefined);

export function AssessmentProvider({ children }: { children: React.ReactNode }) {
  // Initialize with mock data; new assessments are added during the session
  const [assessments, setAssessments] = useState<Assessment[]>(mockAssessments);

  const addAssessment = useCallback((assessment: Assessment) => {
    // Add new assessment at the beginning (most recent first)
    setAssessments((prev) => [assessment, ...prev]);
  }, []);

  const getAssessment = useCallback(
    (id: string) => assessments.find((a) => a.id === id),
    [assessments]
  );

  return (
    <AssessmentContext.Provider value={{ assessments, addAssessment, getAssessment }}>
      {children}
    </AssessmentContext.Provider>
  );
}

/**
 * Hook to access assessment data throughout the app.
 * Must be used within an AssessmentProvider.
 */
export function useAssessments(): AssessmentContextType {
  const context = useContext(AssessmentContext);
  if (!context) {
    throw new Error('useAssessments must be used within an AssessmentProvider');
  }
  return context;
}
