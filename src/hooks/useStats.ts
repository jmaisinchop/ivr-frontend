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

  const fetch = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data: result } = await statsApi.getCallsDaily(days);
      setData(result);
    } catch (err) {
      console.error('Error fetching calls daily:', err);
    } finally {
      setIsLoading(false);
    }
  }, [days]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, isLoading, refetch: fetch };
}

export function useCallsMonthly(months = 12) {
  const [data, setData] = useState<CallsPerMonth[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data: result } = await statsApi.getCallsMonthly(months);
      setData(result);
    } catch (err) {
      console.error('Error fetching calls monthly:', err);
    } finally {
      setIsLoading(false);
    }
  }, [months]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, isLoading, refetch: fetch };
}

export function useStatusDistribution(days = 30) {
  const [data, setData] = useState<CallStatusDistribution[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data: result } = await statsApi.getStatusDistribution(days);
      setData(result);
    } catch (err) {
      console.error('Error fetching status distribution:', err);
    } finally {
      setIsLoading(false);
    }
  }, [days]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, isLoading, refetch: fetch };
}

export function useHangupCauses(limit = 5, days = 30) {
  const [data, setData] = useState<HangupCause[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data: result } = await statsApi.getHangupCauses(limit, days);
      setData(result);
    } catch (err) {
      console.error('Error fetching hangup causes:', err);
    } finally {
      setIsLoading(false);
    }
  }, [limit, days]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, isLoading, refetch: fetch };
}

export function useAgentPerformance(days = 30) {
  const [data, setData] = useState<AgentPerformance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data: result } = await statsApi.getAgentPerformance(days);
      setData(result);
    } catch (err) {
      console.error('Error fetching agent performance:', err);
    } finally {
      setIsLoading(false);
    }
  }, [days]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, isLoading, refetch: fetch };
}

export function useCampaignLeaderboard(limit = 5) {
  const [data, setData] = useState<CampaignLeaderboard[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data: result } = await statsApi.getCampaignLeaderboard(limit);
      setData(result);
    } catch (err) {
      console.error('Error fetching campaign leaderboard:', err);
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, isLoading, refetch: fetch };
}

export function useChannelPressure() {
  const [data, setData] = useState<{ total: number; used: number; pressure: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      const { data: result } = await statsApi.getChannelPressure();
      setData(result);
    } catch (err) {
      console.error('Error fetching channel pressure:', err);
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

  const fetch = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data: result } = await statsApi.getSuccessTrend(days);
      setData(result);
    } catch (err) {
      console.error('Error fetching success trend:', err);
    } finally {
      setIsLoading(false);
    }
  }, [days]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, isLoading, refetch: fetch };
}

export function useRetryRate(days = 30) {
  const [data, setData] = useState<{ total: number; withRetry: number; retryRate: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data: result } = await statsApi.getRetryRate(days);
      setData(result);
    } catch (err) {
      console.error('Error fetching retry rate:', err);
    } finally {
      setIsLoading(false);
    }
  }, [days]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, isLoading, refetch: fetch };
}