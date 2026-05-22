"use client"

import { useState, useEffect } from "react"

interface UseApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

export function useApi<T>(
  apiFunction: () => Promise<T>,
  dependencies: any[] = [],
): UseApiState<T> & { refetch: () => Promise<void> } {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: true,
    error: null,
  })

  const fetchData = async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const result = await apiFunction()
      setState({ data: result, loading: false, error: null })
    } catch (error) {
      setState({
        data: null,
        loading: false,
        error: error instanceof Error ? error.message : "Une erreur est survenue",
      })
    }
  }

  useEffect(() => {
    fetchData()
  }, dependencies)

  return {
    ...state,
    refetch: fetchData,
  }
}

export function useMutation<T, P = any>(mutationFunction: (params: P) => Promise<T>) {
  const [state, setState] = useState<{
    loading: boolean
    error: string | null
  }>({
    loading: false,
    error: null,
  })

  const mutate = async (params: P): Promise<T | null> => {
    setState({ loading: true, error: null })
    try {
      const result = await mutationFunction(params)
      setState({ loading: false, error: null })
      return result
    } catch (error) {
      setState({
        loading: false,
        error: error instanceof Error ? error.message : "Une erreur est survenue",
      })
      return null
    }
  }

  return {
    ...state,
    mutate,
  }
}
