'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { managerAPI } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useDashboardHeader } from '@/components/layout/DashboardShell';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { format, startOfDay, endOfDay, subDays } from 'date-fns';
import Link from 'next/link';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

const formatNumber = (value: number) => new Intl.NumberFormat('en-IN').format(value);

const getDatePresets = () => {
  const now = new Date();
  return {
    today: {
      start: startOfDay(now),
      end: endOfDay(now),
    },
    yesterday: {
      start: startOfDay(subDays(now, 1)),
      end: endOfDay(subDays(now, 1)),
    },
    last7Days: {
      start: startOfDay(subDays(now, 7)),
      end: endOfDay(now),
    },
    last30Days: {
      start: startOfDay(subDays(now, 30)),
      end: endOfDay(now),
    },
  };
};

type DatePreset = 'today' | 'yesterday' | 'last7Days' | 'last30Days';

export default function TeamAnalyticsPage() {
  const router = useRouter();
  const params = useParams();
  const managerId = params.managerId as string;
  const { setHeaderContent, clearHeaderContent } = useDashboardHeader();

  const [datePreset, setDatePreset] = useState<DatePreset>('today');
  const datePresets = getDatePresets();
  const selectedRange = datePresets[datePreset];

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['team-analytics', managerId, datePreset],
    queryFn: async () => {
      const response = await managerAPI.getTeamAnalytics(managerId, {
        startDate: format(selectedRange.start, 'yyyy-MM-dd'),
        endDate: format(selectedRange.end, 'yyyy-MM-dd'),
      });
      return response;
    },
    enabled: !!managerId,
  });

  useEffect(() => {
    setHeaderContent(
      <div className="flex items-center justify-between w-full">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Team Analytics
            {analytics?.manager && ` - ${analytics.manager.name}`}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Comprehensive team performance metrics
          </p>
        </div>
        <Link href="/superadmin/users">
          <Button size="sm" variant="outline">
            ← Back to Users
          </Button>
        </Link>
      </div>
    );

    return () => clearHeaderContent();
  }, [setHeaderContent, clearHeaderContent, analytics]);

  const statusChartData = analytics?.teamStats?.statusBreakdown
    ? Object.entries(analytics.teamStats.statusBreakdown).map(([name, value]) => ({
        name,
        value: value as number,
      }))
    : [];

  const userLeadsChartData = analytics?.userAnalytics
    ? analytics.userAnalytics.map((user: any) => ({
        name: user.name.length > 10 ? user.name.substring(0, 10) + '...' : user.name,
        fullName: user.name,
        leads: user.totalLeads,
        confirmed: user.confirmedLeads,
      }))
    : [];

  return (
    <div className="space-y-6">
      {/* Date Presets */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={datePreset === 'today' ? 'primary' : 'outline'}
            onClick={() => setDatePreset('today')}
          >
            Today
          </Button>
          <Button
            size="sm"
            variant={datePreset === 'yesterday' ? 'primary' : 'outline'}
            onClick={() => setDatePreset('yesterday')}
          >
            Yesterday
          </Button>
          <Button
            size="sm"
            variant={datePreset === 'last7Days' ? 'primary' : 'outline'}
            onClick={() => setDatePreset('last7Days')}
          >
            Last 7 Days
          </Button>
          <Button
            size="sm"
            variant={datePreset === 'last30Days' ? 'primary' : 'outline'}
            onClick={() => setDatePreset('last30Days')}
          >
            Last 30 Days
          </Button>
        </div>
      </Card>

      {/* Team Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Leads</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {isLoading ? '...' : formatNumber(analytics?.teamStats?.totalLeads || 0)}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <div className="w-6 h-6 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                L
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Confirmed Leads</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {isLoading ? '...' : formatNumber(analytics?.teamStats?.confirmedLeads || 0)}
              </p>
            </div>
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <div className="w-6 h-6 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                ✓
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Team Calls</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {isLoading ? '...' : formatNumber(analytics?.teamStats?.calls || 0)}
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <div className="w-6 h-6 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                📞
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Team SMS</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {isLoading ? '...' : formatNumber(analytics?.teamStats?.sms || 0)}
              </p>
            </div>
            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <div className="w-6 h-6 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                💬
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Team Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Status Breakdown */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Team Lead Status Breakdown
          </h3>
          {isLoading ? (
            <Skeleton className="h-64" />
          ) : statusChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(props: any) => {
                    const { name, percent } = props;
                    return `${name} ${((percent as number) * 100).toFixed(0)}%`;
                  }}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              No data available
            </div>
          )}
        </Card>

        {/* Team Leads by User */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Leads by Team Member
          </h3>
          {isLoading ? (
            <Skeleton className="h-64" />
          ) : userLeadsChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={userLeadsChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="leads" fill="#3b82f6" name="Total Leads" />
                <Bar dataKey="confirmed" fill="#10b981" name="Confirmed" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              No team data available
            </div>
          )}
        </Card>
      </div>

      {/* Team Activity Summary */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Team Activity Summary ({datePreset === 'today' ? 'Today' : datePreset})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">Calls Made</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
              {isLoading ? '...' : formatNumber(analytics?.teamStats?.calls || 0)}
            </p>
          </div>
          <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">SMS Sent</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
              {isLoading ? '...' : formatNumber(analytics?.teamStats?.sms || 0)}
            </p>
          </div>
          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">Status Changes</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
              {isLoading ? '...' : formatNumber(analytics?.teamStats?.statusChanges || 0)}
            </p>
          </div>
        </div>
      </Card>

      {/* Unfollowed Leads Summary */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Unfollowed Leads (Last 7 Days)
        </h3>
        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Unfollowed Leads</p>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            {isLoading ? '...' : formatNumber(analytics?.teamStats?.totalUnfollowedLeads || 0)}
          </p>
        </div>
      </Card>

      {/* User-Specific Analytics Cards */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Team Member Analytics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="p-6">
                <Skeleton className="h-32" />
              </Card>
            ))
          ) : analytics?.userAnalytics && analytics.userAnalytics.length > 0 ? (
            analytics.userAnalytics.map((user: any) => (
              <Card key={user.userId} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {user.name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      {user.roleName}
                      {user.isManager && (
                        <span className="ml-2 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-200 text-xs">
                          Manager
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total Leads</span>
                    <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {formatNumber(user.totalLeads)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Confirmed</span>
                    <span className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatNumber(user.confirmedLeads)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Calls ({datePreset})</span>
                    <span className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                      {formatNumber(user.calls)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">SMS ({datePreset})</span>
                    <span className="text-lg font-semibold text-orange-600 dark:text-orange-400">
                      {formatNumber(user.sms)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Unfollowed Leads</span>
                    <span className="text-lg font-semibold text-amber-600 dark:text-amber-400">
                      {formatNumber(user.unfollowedLeadsCount)}
                    </span>
                  </div>

                  {/* Status Breakdown */}
                  {user.statusBreakdown && Object.keys(user.statusBreakdown).length > 0 && (
                    <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                        Status Breakdown:
                      </p>
                      <div className="space-y-1">
                        {Object.entries(user.statusBreakdown)
                          .slice(0, 5)
                          .map(([status, count]) => (
                            <div
                              key={status}
                              className="flex items-center justify-between text-xs"
                            >
                              <span className="text-gray-600 dark:text-gray-400">{status}</span>
                              <span className="font-semibold text-gray-900 dark:text-gray-100">
                                {formatNumber(count as number)}
                              </span>
                            </div>
                          ))}
                        {Object.keys(user.statusBreakdown).length > 5 && (
                          <p className="text-xs text-gray-500">
                            +{Object.keys(user.statusBreakdown).length - 5} more
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-6 col-span-full">
              <p className="text-center text-gray-500">No team members found</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

