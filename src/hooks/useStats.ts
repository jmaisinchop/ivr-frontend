'use client';

import { useState, useEffect, useCallback } from 'react';
import { statsApi } from '@/lib/api';
import {
  DashboardOverview,
  CallsPerDay,
  CallsPerMonth,
  CallStatusDistribution,
  HangupCause,
  AgentPerformance,
  CampaignLeaderboard,
} from '@/types';

export function useDashboardOverview() {
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data } = await statsApi.getDashboardOverview();
      setData(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
    const interval = setInterval(fetch, 30000);
    return () => clearInterval(interval);
  }, [fetch]);

  return { data, isLoading, error, refetch: fetch };
}

export function useCallsDaily(days = 30) {
  const [data, setData] = useState<CallsPerDay[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    statsApi.getCallsDaily(days).then(({ data }) => {
      setData(data);
      setIsLoading(false);
    });
  }, [days]);

  return { data, isLoading };
}

export function useCallsMonthly(months = 12) {
  const [data, setData] = useState<CallsPerMonth[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    statsApi.getCallsMonthly(months).then(({ data }) => {
      setData(data);
      setIsLoading(false);
    });
  }, [months]);

  return { data, isLoading };
}

export function useStatusDistribution(days = 30) {
  const [data, setData] = useState<CallStatusDistribution[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    statsApi.getStatusDistribution(days).then(({ data }) => {
      setData(data);
      setIsLoading(false);
    });
  }, [days]);

  return { data, isLoading };
}

export function useHangupCauses(limit = 5, days = 30) {
  const [data, setData] = useState<HangupCause[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    statsApi.getHangupCauses(limit, days).then(({ data }) => {
      setData(data);
      setIsLoading(false);
    });
  }, [limit, days]);

  return { data, isLoading };
}

export function useAgentPerformance(days = 30) {
  const [data, setData] = useState<AgentPerformance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    statsApi.getAgentPerformance(days).then(({ data }) => {
      setData(data);
      setIsLoading(false);
    });
  }, [days]);

  return { data, isLoading };
}

export function useCampaignLeaderboard(limit = 5) {
  const [data, setData] = useState<CampaignLeaderboard[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    statsApi.getCampaignLeaderboard(limit).then(({ data }) => {
      setData(data);
      setIsLoading(false);
    });
  }, [limit]);

  return { data, isLoading };
}

export function useChannelPressure() {
  const [data, setData] = useState<{ total: number; used: number; pressure: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      const { data } = await statsApi.getChannelPressure();
      setData(data);
    } catch (err) {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
    const interval = setInterval(fetch, 10000);
    return () => clearInterval(interval);
  }, [fetch]);

  return { data, isLoading, refetch: fetch };
}

export function useSuccessTrend(days = 30) {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    statsApi.getSuccessTrend(days).then(({ data }) => {
      setData(data);
      setIsLoading(false);
    });
  }, [days]);

  return { data, isLoading };
}

export function useRetryRate(days = 30) {
  const [data, setData] = useState<{ total: number; withRetry: number; retryRate: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    statsApi.getRetryRate(days).then(({ data }) => {
      setData(data);
      setIsLoading(false);
    });
  }, [days]);

  return { data, isLoading };
}
