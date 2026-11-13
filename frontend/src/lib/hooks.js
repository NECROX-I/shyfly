import { useEffect, useRef, useState } from 'react'
import { shopAPI } from '../services/api'
import { defaultContent } from './defaultContent'

let catCache = null
let catPromise = null
export function useCategories() {
  const [cats, setCats] = useState(catCache || [])
  useEffect(() => {
    if (catCache) return
    catPromise = catPromise || shopAPI.categories().then((r) => (catCache = r.data.categories))
    catPromise.then((c) => setCats(c)).catch(() => { catPromise = null })
  }, [])
  return cats
}

let cfgCache = null
let cfgPromise = null
const DEFAULT_CFG = { loaded: false, content: defaultContent, freeShippingMin: 999, shippingFee: 79, codFee: 40, codMax: 15000, codEnabled: true, returnWindowDays: 7, onlinePayment: false, whatsapp: '', announcements: [], store: {}, delivery: { min: 4, max: 7 } }
export function useConfig() {
  const [cfg, setCfg] = useState(cfgCache || DEFAULT_CFG)
  useEffect(() => {
    if (cfgCache) return
    cfgPromise = cfgPromise || shopAPI.config().then((r) => (cfgCache = { ...DEFAULT_CFG, ...r.data.config, loaded: true }))
    cfgPromise.then(setCfg).catch(() => { cfgPromise = null; setCfg({ ...DEFAULT_CFG, loaded: true }) })
  }, [])
  return cfg
}

export function useDebounce(value, ms = 300) {
  const [v, setV] = useState(value)
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t) }, [value, ms])
  return v
}

export function useCountdownToMidnight() {
  const calc = () => {
    const now = new Date(); const end = new Date(now); end.setHours(23, 59, 59, 999)
    const s = Math.max(0, Math.floor((end - now) / 1000))
    return { h: Math.floor(s / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 }
  }
  const [t, setT] = useState(calc)
  useEffect(() => { const i = setInterval(() => setT(calc()), 1000); return () => clearInterval(i) }, [])
  return t
}

export function useLockBody(locked) {
  useEffect(() => {
    if (!locked) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [locked])
}

export function useOnClickOutside(ref, cb) {
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) cb() }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [ref, cb])
}

export function useIsDesktop() {
  const [d, setD] = useState(typeof window !== 'undefined' && window.matchMedia('(min-width:1024px)').matches)
  useEffect(() => {
    const mq = window.matchMedia('(min-width:1024px)')
    const h = (e) => setD(e.matches)
    mq.addEventListener('change', h)
    return () => mq.removeEventListener('change', h)
  }, [])
  return d
}

export function useAsync(fn, deps = []) {
  const [state, setState] = useState({ loading: true, data: null, error: null })
  const alive = useRef(true)
  useEffect(() => {
    alive.current = true
    setState((s) => ({ ...s, loading: true, error: null }))
    fn().then((data) => alive.current && setState({ loading: false, data, error: null }))
      .catch((error) => alive.current && setState({ loading: false, data: null, error }))
    return () => { alive.current = false }
    // eslint-disable-next-line
  }, deps)
  return state
}
