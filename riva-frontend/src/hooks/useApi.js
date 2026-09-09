import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'

export function useApi(apiFn, deps = [], immediate = true) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(immediate)
  const [error, setError] = useState(null)

  const execute = useCallback(async (...args) => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiFn(...args)
      setData(res.data.data)
      return res.data.data
    } catch (err) {
      const msg = err.response?.data?.message || 'Something went wrong'
      setError(msg)
      toast.error(msg)
      throw err
    } finally {
      setLoading(false)
    }
  }, deps)

  useEffect(() => {
    if (immediate) execute()
  }, [execute])

  return { data, loading, error, execute, setData }
}

export function useSubmit(apiFn) {
  const [submitting, setSubmitting] = useState(false)

  const submit = useCallback(async (data, successMsg) => {
    setSubmitting(true)
    try {
      const res = await apiFn(data)
      if (successMsg) toast.success(successMsg)
      return res.data.data
    } catch (err) {
      const msg = err.response?.data?.message || 'Operation failed'
      toast.error(msg)
      throw err
    } finally {
      setSubmitting(false)
    }
  }, [apiFn])

  return { submit, submitting }
}
