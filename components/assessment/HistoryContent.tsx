
'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
    Search,
    Filter,
    PlusCircle,
    XCircle,
    Info,
} from 'lucide-react';

import PageContainer from '@/components/layout/PageContainer';
import AssessmentTable from '@/components/assessment/AssessmentTable';
import EmptyState from '@/components/assessment/EmptyState';
import type { Assessment, RiskLevel } from '@/types/assessment';

interface HistoryContentProps {
    assessments: Assessment[];
}

export default function HistoryContent({
    assessments,
}: HistoryContentProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRisk, setSelectedRisk] = useState<'all' | RiskLevel>('all');

    // Filter berdasarkan nama jaringan dan tingkat risiko
    const filteredAssessments = useMemo(() => {
        return assessments.filter((item) => {
            const matchesSearch = item.ssid
                .toLowerCase()
                .includes(searchQuery.trim().toLowerCase());

            const matchesRisk =
                selectedRisk === 'all' || item.riskLevel === selectedRisk;

            return matchesSearch && matchesRisk;
        });
    }, [assessments, searchQuery, selectedRisk]);

    const hasActiveFilters =
        searchQuery.trim() !== '' || selectedRisk !== 'all';

    const handleResetFilters = () => {
        setSearchQuery('');
        setSelectedRisk('all');
    };

    return (
        <PageContainer
            title="Assessment History"
            description="Review previous Wi-Fi configuration evaluations and inspect security findings."
        >
            <div className="space-y-6">
                {/* Database storage notice */}
                <aside
                    role="note"
                    aria-label="Database storage notice"
                    className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-xs text-emerald-900 shadow-2xs"
                >
                    <div className="flex items-start gap-3">
                        <Info
                            className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-700"
                            aria-hidden="true"
                        />
                        <p className="leading-relaxed">
                            <strong>Persistent Storage:</strong> Assessment history is now
                            stored in the PostgreSQL database. Your saved assessments remain
                            available after refreshing or reopening the application.
                        </p>
                    </div>
                </aside>

                {/* Search, Filter, and New Check */}
                <div className="rounded-xl border border-card-border bg-card p-5 shadow-xs">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        {/* Search Input */}
                        <div className="relative flex-1">
                            <label htmlFor="search-ssid" className="sr-only">
                                Search assessments by network SSID
                            </label>

                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <Search
                                    className="h-4 w-4 text-slate-400"
                                    aria-hidden="true"
                                />
                            </div>

                            <input
                                type="text"
                                id="search-ssid"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search network name (SSID)..."
                                className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-4 text-sm text-foreground placeholder:text-slate-400 transition-colors focus:border-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-100"
                            />
                        </div>

                        {/* Risk Filter */}
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                                <Filter
                                    className="h-4 w-4 text-muted"
                                    aria-hidden="true"
                                />

                                <label
                                    htmlFor="risk-filter"
                                    className="text-xs font-medium text-slate-700"
                                >
                                    Risk:
                                </label>

                                <select
                                    id="risk-filter"
                                    value={selectedRisk}
                                    onChange={(e) =>
                                        setSelectedRisk(e.target.value as 'all' | RiskLevel)
                                    }
                                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 transition-colors focus:border-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-100"
                                >
                                    <option value="all">All Risk Levels</option>
                                    <option value="low">Low Risk Only</option>
                                    <option value="medium">Medium Risk Only</option>
                                    <option value="high">High Risk Only</option>
                                </select>
                            </div>

                            {hasActiveFilters && (
                                <button
                                    type="button"
                                    onClick={handleResetFilters}
                                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
                                >
                                    <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
                                    Clear
                                </button>
                            )}

                            <Link
                                href="/check"
                                className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-cyan-800 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            >
                                <PlusCircle className="h-4 w-4" aria-hidden="true" />
                                New Check
                            </Link>
                        </div>
                    </div>

                    {/* Assessment Count */}
                    <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-muted">
                        <span>
                            Showing {filteredAssessments.length} of {assessments.length}{' '}
                            total assessments
                        </span>

                        {hasActiveFilters && (
                            <span className="font-medium text-cyan-700">
                                Filters active
                            </span>
                        )}
                    </div>
                </div>

                {/* Assessment Results */}
                <div className="rounded-xl border border-card-border bg-card p-5 shadow-xs sm:p-6">
                    {filteredAssessments.length > 0 ? (
                        <AssessmentTable assessments={filteredAssessments} />
                    ) : (
                        <EmptyState
                            title={
                                hasActiveFilters
                                    ? 'No matching assessments found'
                                    : 'No assessments available'
                            }
                            description={
                                hasActiveFilters
                                    ? 'Try adjusting your search criteria or resetting the risk filter.'
                                    : 'Start your first Wi-Fi assessment to begin logging historical evaluations.'
                            }
                            actionLabel={
                                hasActiveFilters ? 'Clear Filters' : 'Run New Assessment'
                            }
                            actionHref={hasActiveFilters ? '#' : '/check'}
                        />
                    )}
                </div>
            </div>
        </PageContainer>
    );
}
